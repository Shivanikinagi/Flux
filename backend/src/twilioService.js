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
*CHATTERPAY - COMMAND REFERENCE*

*REGISTER*
Register your phone number with the blockchain network

*BALANCE*
Check your current wallet balance and transaction history

*PAY <recipient> <amount>*
Send payment to a registered user
Examples:
  PAY Pavan 10
  PAY +1234567890 10

*STATUS*
View your account registration status and details

*HELP*
Display this command reference

---
NAME-BASED PAYMENTS:
Register at http://localhost:3000 to link your name with your wallet and enable sending payments by name.
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
          '*REGISTRATION STATUS: ACTIVE*\n\nYour phone number is already registered.\nYou can send and receive payments.\n\nType HELP for available commands.'
        );
        return;
      }

      // In a real implementation, you would:
      // 1. Create or retrieve user's wallet
      // 2. Store securely in database
      // 3. Register on blockchain

      await this.sendMessage(
        twilioFrom,
        `*REGISTRATION REQUIRED*

To complete your registration:

1. Visit: http://localhost:3000
2. Enter your name and phone number: ${normalizedPhone}
3. Generate a new wallet or import existing one
4. Store your private key securely

After registration you can:
- Check balance: BALANCE
- Send by name: PAY Pavan 10
- Send by phone: PAY +1234567890 10
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
          '*ACCOUNT NOT FOUND*\n\nYour phone number is not registered.\n\nRegister at: http://localhost:3000\nEnter your name, phone number, and create a wallet.\n\nType HELP for more information.'
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
        twilioFrom,
        `*ACCOUNT BALANCE*

Name: ${name}
Balance: ${balanceFormatted} MOVE
Address: ${address.substring(0, 10)}...

TRANSACTION SUMMARY:
Sent: ${history.sent}
Received: ${history.received}
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling balance check:', error);
      await this.sendMessage(
        twilioFrom,
        '*ERROR*\n\nUnable to retrieve balance at this time.\nPlease try again later.'
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
            `*RECIPIENT NOT FOUND*\n\nRecipient "${recipient}" is not registered.\n\nVerify the name or phone number is correct.`
          );
          return;
        }
      }

      // Validate amount
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        await this.sendMessage(
          twilioFrom,
          '*INVALID AMOUNT*\n\nAmount must be a positive number.\n\nExample: PAY Dad 10'
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
          `*RECIPIENT NOT REGISTERED*\n\nRecipient ${recipientName || recipientPhone} is not registered on ChatterPay.\n\nThey must register before receiving payments.`
        );
        return;
      }

      // Send processing message
      const displayName = recipientName || recipientPhone;
      await this.sendMessage(
        twilioFrom,
        `*PAYMENT PROCESSING*\n\nAmount: ${amount} MOVE\nRecipient: ${displayName}\n\nPlease wait...`
      );

      // Get sender's private key from storage
      const senderPrivateKey = await nameMappingService.getPrivateKeyByPhone(normalizedPhone);
      
      if (!senderPrivateKey) {
        await this.sendMessage(
          twilioFrom,
          `*PAYMENT FAILED*\n\nPrivate key not found for your account.\n\nTo enable WhatsApp payments:\n1. Visit: http://localhost:3000\n2. Re-register with your private key\n\nAlternatively, use API endpoint: POST /api/send`
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

        const txHash = result.transactionHash;
        await this.sendMessage(
          twilioFrom,
          `*PAYMENT SUCCESSFUL*\n\nAmount: ${amount} MOVE\nRecipient: ${displayName}\nTransaction: ${txHash.substring(0, 10)}...${txHash.slice(-6)}\n\nView details:\nhttps://explorer.movementnetwork.xyz/txn/${txHash}`
        );
      } catch (txError) {
        logger.error('Transaction failed:', txError);
        await this.sendMessage(
          twilioFrom,
          `*TRANSACTION FAILED*\n\n${txError.message || 'Please verify your balance and try again.'}`
        );
        return;
      }
    } catch (error) {
      logger.error('Error handling payment:', error);
      await this.sendMessage(
        twilioFrom,
        '*PAYMENT ERROR*\n\nUnable to process payment at this time.\nPlease try again later.'
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
          `*ACCOUNT STATUS: ACTIVE*

Name: ${name}
Phone: ${normalizedPhone}
Address: ${address.substring(0, 10)}...${address.slice(-6)}
Balance: ${balanceFormatted} MOVE

Account is ready for transactions.
          `.trim()
        );
      } else {
        await this.sendMessage(
          twilioFrom,
          `*ACCOUNT STATUS: NOT REGISTERED*

Your phone number is not registered.

Send REGISTER to begin setup.
          `.trim()
        );
      }
    } catch (error) {
      logger.error('Error checking status:', error);
      await this.sendMessage(
        twilioFrom,
        '*ERROR*\n\nUnable to retrieve status at this time.\nPlease try again later.'
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
