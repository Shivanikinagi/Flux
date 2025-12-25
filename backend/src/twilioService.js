const twilio = require('twilio');
const logger = require('./utils/logger');
const movementService = require('./movementService');
const nameMappingService = require('./nameMappingService');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      logger.warn('Twilio credentials not fully configured');
      this.client = null;
    } else {
      this.client = twilio(this.accountSid, this.authToken);
      logger.info('Twilio service initialized');
    }

    // Store user sessions (in production, use Redis or database)
    this.userSessions = new Map();
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(to, message) {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      const result = await this.client.messages.create({
        from: this.phoneNumber,
        to: to,
        body: message,
      });

      logger.info(`Message sent to ${to}: ${result.sid}`);
      return result.sid;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WhatsApp messages
   */
  async handleIncomingMessage(from, body) {
    try {
      // Normalize phone number - remove 'whatsapp:' prefix if present
      const normalizedPhone = from.replace('whatsapp:', '');
      logger.info(`Message from ${from} (normalized: ${normalizedPhone}): ${body}`);

      const command = body.trim().toUpperCase();
      const parts = body.trim().split(' ');

      // Command: HELP
      if (command === 'HELP') {
        await this.sendHelpMessage(from);
        return;
      }

      // Command: REGISTER
      if (command === 'REGISTER') {
        await this.handleRegister(from, normalizedPhone);
        return;
      }

      // Command: BALANCE
      if (command === 'BALANCE') {
        await this.handleBalance(from, normalizedPhone);
        return;
      }

      // Command: PAY <phone_or_name> <amount>
      if (parts[0].toUpperCase() === 'PAY') {
        if (parts.length < 3) {
          await this.sendMessage(
            from,
            '❌ Invalid PAY command.\n\nUsage: PAY <name_or_phone> <amount>\nExample: PAY Pavan 10\nExample: PAY +1234567890 10'
          );
          return;
        }

        const recipient = parts[1];
        const amount = parts[2];

        await this.handlePayment(from, normalizedPhone, recipient, amount);
        return;
      }

      // Command: STATUS
      if (command === 'STATUS') {
        await this.handleStatus(from, normalizedPhone);
        return;
      }

      // Unknown command
      await this.sendMessage(
        from,
        '❓ Unknown command.\n\nSend HELP to see available commands.'
      );
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      await this.sendMessage(
        from,
        '❌ An error occurred processing your request. Please try again later.'
      );
    }
  }

  /**
   * Send help message
   */
  async sendHelpMessage(to) {
    const helpMessage = `
🌟 *ChatterPay Commands*

📱 *REGISTER* - Register your phone with blockchain
💰 *BALANCE* - Check your account balance
💸 *PAY <name_or_phone> <amount>* - Send payment
   Example: PAY Pavan 10
   Example: PAY +1234567890 10

📊 *STATUS* - Check registration status
❓ *HELP* - Show this message

✨ *New Feature:* You can now send payments using names!
Register at our web app to link your name with your phone.
    `.trim();

    await this.sendMessage(to, helpMessage);
  }

  /**
   * Handle registration
   */
  async handleRegister(twilioFrom, normalizedPhone) {
    try {
      // Check if already registered using normalized phone
      const userInfo = await nameMappingService.getUserInfo(normalizedPhone);

      if (userInfo) {
        await this.sendMessage(
          twilioFrom,
          '✅ Your phone is already registered!\n\nYou can start sending and receiving payments.'
        );
        return;
      }

      // In a real implementation, you would:
      // 1. Create or retrieve user's wallet
      // 2. Store securely in database
      // 3. Register on blockchain

      await this.sendMessage(
        twilioFrom,
        `📝 *Registration Process*

To complete registration:
1. Visit: http://localhost:3000
2. Enter your name and THIS phone number: ${normalizedPhone}
3. Leave wallet fields empty to create new wallet
4. Save your private key securely!

✨ After registration, you can:
• Check balance: BALANCE
• Send payments by name: PAY Pavan 10
• Send by phone: PAY +1234567890 10
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling registration:', error);
      throw error;
    }
  }

  /**
   * Handle balance check
   */
  async handleBalance(twilioFrom, normalizedPhone) {
    try {
      // Check if registered in name mapping service using normalized phone
      const userInfo = await nameMappingService.getUserInfo(normalizedPhone);

      if (!userInfo) {
        await this.sendMessage(
          twilioFrom,
          '❌ Your phone is not registered.\n\nRegister at: http://localhost:3000\nEnter your name, phone, and create a wallet!'
        );
        return;
      }

      // Get address from name mapping
      const address = userInfo.address;
      const name = userInfo.name;

      // Get balance
      const balance = await movementService.getBalance(address);
      const balanceFormatted = (balance / 100000000).toFixed(8);

      // Get transaction history
      const history = await movementService.getTransactionHistory(address);

      await this.sendMessage(
        from,
        `💰 *Your Balance*

Name: ${name}
Balance: ${balanceFormatted} MOVE
Address: ${address.substring(0, 10)}...

📊 Transactions:
• Sent: ${history.sent}
• Received: ${history.received}
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling balance check:', error);
      await this.sendMessage(
        twilioFrom,
        '❌ Could not fetch balance. Please try again later.'
      );
    }
  }

  /**
   * Handle payment
   */
  async handlePayment(twilioFrom, normalizedPhone, recipient, amount) {
    try {
      // Check if recipient is a name or phone number
      let recipientPhone;
      let recipientName;
      let recipientAddress;

      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      
      if (phoneRegex.test(recipient)) {
        // Recipient is a phone number
        recipientPhone = recipient;
        recipientName = await nameMappingService.getNameByPhone(recipientPhone);
        recipientAddress = await nameMappingService.getAddressByPhone(recipientPhone);
      } else {
        // Recipient might be a name
        const userInfo = await nameMappingService.getUserInfo(recipient);
        if (userInfo) {
          recipientPhone = userInfo.phone;
          recipientName = userInfo.name;
          recipientAddress = userInfo.address;
        } else {
          await this.sendMessage(
            twilioFrom,
            `❌ Recipient "${recipient}" not found.\n\nMake sure the name or phone number is correct.`
          );
          return;
        }
      }

      // Validate amount
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        await this.sendMessage(
          twilioFrom,
          '❌ Invalid amount.\n\nAmount must be a positive number.'
        );
        return;
      }

      // Check if sender is registered
      const senderAddress = await nameMappingService.getAddressByPhone(normalizedPhone);
      if (!senderAddress) {
        await this.sendMessage(
          twilioFrom,
          '❌ Your phone is not registered.\n\nSend REGISTER to get started.'
        );
        return;
      }

      // Check if recipient is registered
      if (!recipientAddress) {
        await this.sendMessage(
          twilioFrom,
          `❌ Recipient ${recipientName || recipientPhone} is not registered.\n\nThey need to register first.`
        );
        return;
      }

      // Send processing message
      const displayName = recipientName || recipientPhone;
      await this.sendMessage(
        twilioFrom,
        `⏳ Processing payment of ${amount} MOVE to ${displayName}...\n\nPlease wait.`
      );

      // Get sender's private key from storage
      const senderPrivateKey = await nameMappingService.getPrivateKeyByPhone(normalizedPhone);
      
      if (!senderPrivateKey) {
        await this.sendMessage(
          twilioFrom,
          `❌ *Payment Failed*\n\nYour account doesn't have a private key stored.\n\nTo enable WhatsApp payments:\n1. Visit: http://localhost:3000\n2. Re-register with your private key\n3. Or use API: POST /api/send`
        );
        return;
      }

      // Execute the payment transaction
      try {
        const result = await movementService.sendPaymentToPhone(
          senderPrivateKey,
          recipientPhone,
          amount
        );

        await this.sendMessage(
          twilioFrom,
          `✅ *Payment Sent!*\n\nAmount: ${amount} MOVE\nTo: ${displayName}\nTx: ${result.hash.substring(0, 10)}...${result.hash.slice(-6)}\n\nView: https://explorer.movementnetwork.xyz/txn/${result.hash}`
        );
      } catch (txError) {
        logger.error('Transaction failed:', txError);
        await this.sendMessage(
          twilioFrom,
          `❌ *Transaction Failed*\n\n${txError.message || 'Please check your balance and try again.'}`
        );
        return;
      }
    } catch (error) {
      logger.error('Error handling payment:', error);
      await this.sendMessage(
        twilioFrom,
        '❌ Payment failed. Please try again later.'
      );
    }
  }

  /**
   * Handle status check
   */
  async handleStatus(twilioFrom, normalizedPhone) {
    try {
      const userInfo = await nameMappingService.getUserInfo(normalizedPhone);

      if (userInfo) {
        const address = userInfo.address;
        const name = userInfo.name;
        const balance = await movementService.getBalance(address);
        const balanceFormatted = (balance / 100000000).toFixed(8);

        await this.sendMessage(
          twilioFrom,
          `✅ *Account Status: Active*

Name: ${name}

Phone: ${normalizedPhone}
Address: ${address.substring(0, 10)}...${address.slice(-6)}
Balance: ${balanceFormatted} MOVE

You can send and receive payments!
          `.trim()
        );
      } else {
        await this.sendMessage(
          twilioFrom,
          `📱 *Account Status: Not Registered*

Send REGISTER to get started!
          `.trim()
        );
      }
    } catch (error) {
      logger.error('Error checking status:', error);
      await this.sendMessage(
        twilioFrom,
        '❌ Could not check status. Please try again later.'
      );
    }
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(to, type, amount, from, txHash) {
    try {
      const message = type === 'received'
        ? `💰 *Payment Received!*

Amount: ${amount} APT
From: ${from}

Transaction: ${txHash.substring(0, 10)}...

Check balance: Send BALANCE
        `.trim()
        : `✅ *Payment Sent!*

Amount: ${amount} APT
To: ${from}

Transaction: ${txHash.substring(0, 10)}...

Check balance: Send BALANCE
        `.trim();

      await this.sendMessage(to, message);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }
}

module.exports = new TwilioService();
