const twilio = require('twilio');
const logger = require('./utils/logger');
const movementService = require('./movementService');

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
      logger.info(`Message from ${from}: ${body}`);

      const command = body.trim().toUpperCase();
      const parts = body.trim().split(' ');

      // Command: HELP
      if (command === 'HELP') {
        await this.sendHelpMessage(from);
        return;
      }

      // Command: REGISTER
      if (command === 'REGISTER') {
        await this.handleRegister(from);
        return;
      }

      // Command: BALANCE
      if (command === 'BALANCE') {
        await this.handleBalance(from);
        return;
      }

      // Command: PAY <phone> <amount>
      if (parts[0].toUpperCase() === 'PAY') {
        if (parts.length < 3) {
          await this.sendMessage(
            from,
            '❌ Invalid PAY command.\n\nUsage: PAY <phone> <amount>\nExample: PAY +1234567890 0.01'
          );
          return;
        }

        const recipientPhone = parts[1];
        const amount = parts[2];

        await this.handlePayment(from, recipientPhone, amount);
        return;
      }

      // Command: STATUS
      if (command === 'STATUS') {
        await this.handleStatus(from);
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
💸 *PAY <phone> <amount>* - Send payment
   Example: PAY +1234567890 0.01

📊 *STATUS* - Check registration status
❓ *HELP* - Show this message

Need more help? Visit our docs.
    `.trim();

    await this.sendMessage(to, helpMessage);
  }

  /**
   * Handle registration
   */
  async handleRegister(from) {
    try {
      // Check if already registered
      const isRegistered = await movementService.isPhoneRegistered(from);

      if (isRegistered) {
        await this.sendMessage(
          from,
          '✅ Your phone is already registered!\n\nYou can start sending and receiving payments.'
        );
        return;
      }

      // In a real implementation, you would:
      // 1. Create or retrieve user's wallet
      // 2. Store securely in database
      // 3. Register on blockchain

      await this.sendMessage(
        from,
        `📝 *Registration Process*

To complete registration:
1. Create an account via our web app
2. Link your phone number
3. Your wallet will be created securely

Visit: https://chatterpay.app/register

⚠️ Note: For security, wallet creation requires additional verification.
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
  async handleBalance(from) {
    try {
      // Check if registered
      const isRegistered = await movementService.isPhoneRegistered(from);

      if (!isRegistered) {
        await this.sendMessage(
          from,
          '❌ Your phone is not registered.\n\nSend REGISTER to get started.'
        );
        return;
      }

      // Get address from phone
      const address = await movementService.getAddressFromPhone(from);

      // Get balance
      const balance = await movementService.getBalance(address);
      const balanceFormatted = (balance / 100000000).toFixed(8);

      // Get transaction history
      const history = await movementService.getTransactionHistory(address);

      await this.sendMessage(
        from,
        `💰 *Your Balance*

Balance: ${balanceFormatted} APT
Address: ${address.substring(0, 10)}...

📊 Transactions:
• Sent: ${history.sent}
• Received: ${history.received}
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling balance check:', error);
      await this.sendMessage(
        from,
        '❌ Could not fetch balance. Please try again later.'
      );
    }
  }

  /**
   * Handle payment
   */
  async handlePayment(from, recipientPhone, amount) {
    try {
      // Validate phone format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(recipientPhone)) {
        await this.sendMessage(
          from,
          '❌ Invalid recipient phone format.\n\nUse international format: +1234567890'
        );
        return;
      }

      // Validate amount
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        await this.sendMessage(
          from,
          '❌ Invalid amount.\n\nAmount must be a positive number.'
        );
        return;
      }

      // Check if sender is registered
      const isSenderRegistered = await movementService.isPhoneRegistered(from);
      if (!isSenderRegistered) {
        await this.sendMessage(
          from,
          '❌ Your phone is not registered.\n\nSend REGISTER to get started.'
        );
        return;
      }

      // Check if recipient is registered
      const isRecipientRegistered = await movementService.isPhoneRegistered(recipientPhone);
      if (!isRecipientRegistered) {
        await this.sendMessage(
          from,
          `❌ Recipient ${recipientPhone} is not registered.\n\nThey need to register first.`
        );
        return;
      }

      // Send processing message
      await this.sendMessage(
        from,
        `⏳ Processing payment of ${amount} APT to ${recipientPhone}...\n\nPlease wait.`
      );

      // In a real implementation, you would:
      // 1. Retrieve sender's private key from secure storage
      // 2. Execute the payment transaction
      // 3. Send confirmation

      // For demo purposes, we'll send a note about the API usage
      await this.sendMessage(
        from,
        `ℹ️ *Payment Initiated*

For security, payments via WhatsApp require:
1. Authentication via our app
2. Transaction signing

Use our API endpoint instead:
POST /api/send
{
  "privateKeyHex": "your_key",
  "recipientPhone": "${recipientPhone}",
  "amount": "${amount}"
}

Visit our docs for details.
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling payment:', error);
      await this.sendMessage(
        from,
        '❌ Payment failed. Please try again later.'
      );
    }
  }

  /**
   * Handle status check
   */
  async handleStatus(from) {
    try {
      const isRegistered = await movementService.isPhoneRegistered(from);

      if (isRegistered) {
        const address = await movementService.getAddressFromPhone(from);
        const balance = await movementService.getBalance(address);
        const balanceFormatted = (balance / 100000000).toFixed(8);

        await this.sendMessage(
          from,
          `✅ *Account Status: Active*

Phone: ${from}
Address: ${address.substring(0, 10)}...${address.slice(-6)}
Balance: ${balanceFormatted} APT

You can send and receive payments!
          `.trim()
        );
      } else {
        await this.sendMessage(
          from,
          `📱 *Account Status: Not Registered*

Send REGISTER to get started!
          `.trim()
        );
      }
    } catch (error) {
      logger.error('Error checking status:', error);
      await this.sendMessage(
        from,
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
