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

      // Check for user session (awaiting confirmation)
      const session = this.userSessions.get(normalizedPhone);
      if (session && session.state === 'AWAITING_REGISTRATION_CONFIRM') {
        const response = body.trim().toLowerCase();
        if (response.includes('yes') || response.includes('please') || response.includes('sure') || response.includes('ok')) {
          await this.handleRegister(from, normalizedPhone);
          return;
        } else if (response.includes('no')) {
          this.userSessions.delete(normalizedPhone);
          await this.sendMessage(from, `No worries at all! 😊

Whenever you're ready to create a wallet and start sending MOVE, just send me any message. I'll be here to help!

Have a great day! ✨`);
          return;
        }
      }

      // Check if user is registered, if not offer auto-registration
      const userInfo = await nameMappingService.getUserInfo(normalizedPhone);
      
      if (!userInfo && !['REGISTER', 'HELP'].includes(command)) {
        await this.sendWelcomeAndAutoRegister(from, normalizedPhone, body);
        return;
      }

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
            `Oops! Let me help you with that. 💡

To send a payment, use this format:
*PAY [recipient] [amount]*

📝 *Examples:*
• PAY Mrunal 10
• PAY Dad 5.5
• PAY +919876543210 20

Just type the recipient's name (or phone) and the amount. Easy!`
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
        `Hmm, I didn't quite catch that! 🤔

I can help you with:
• Checking your balance
• Sending payments to friends
• Viewing your account

Just send *HELP* to see everything I can do!`
      );
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      await this.sendMessage(
        from,
        `Oops! Something went wrong on my end. 😅

Could you try that again? If the issue persists, just send *HELP* and we'll figure it out together!`
      );
    }
  }

  /**
   * Welcome new user and offer auto-registration
   */
  async sendWelcomeAndAutoRegister(twilioFrom, normalizedPhone, originalMessage) {
    try {
      await this.sendMessage(
        twilioFrom,
        `Hey! 👋

I'm Flux AI, your crypto payment assistant.

I notice you don't have an account yet. I can help you create one right now - it only takes a moment. Your account will be securely linked to your phone number for easy peer-to-peer transactions.

✨ Would you like me to proceed with account creation?`
      );
      
      // Set session flag for auto-registration
      this.userSessions.set(normalizedPhone, {
        state: 'AWAITING_REGISTRATION_CONFIRM',
        originalMessage: originalMessage,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Error in welcome message:', error);
      throw error;
    }
  }

  /**
   * Send help message
   */
  async sendHelpMessage(to) {
    const helpMessage = `Hey! 👋 Here's what I can help you with:

━━━━━━━━━━━━━━━━━━━━━━━━

💰 *BALANCE*
Check how much MOVE you have

💸 *PAY [name] [amount]*
Send MOVE to anyone instantly
_Examples:_
• PAY Mrunal 10
• PAY +919876543210 5

👤 *STATUS*
View your wallet details

🆕 *REGISTER*
Create a new wallet (if needed)

━━━━━━━━━━━━━━━━━━━━━━━━

✨ *Pro tip:* Just send payments by name - no wallet addresses needed!

💬 Have questions? Just ask me naturally and I'll do my best to help!`;

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
          `Hey! You're all set! ✅

Your Flux wallet is already active and ready to go. You can send and receive MOVE payments anytime.

💡 *Quick actions:*
• Send *BALANCE* to check your funds
• Send *PAY [name] [amount]* to send money
• Send *HELP* to see all commands

What would you like to do?`
        );
        return;
      }

      // Auto-create wallet and register
      await this.sendMessage(twilioFrom, 'Perfect! Let me generate a secure wallet for you...\n\n⚡ Initializing Movement blockchain connection...\n🔐 Generating cryptographic keys with Move security...\n📱 Linking to phone number securely...');
      
      // Generate wallet
      const wallet = await movementService.generateWallet();
      
      // Fund the wallet
      await movementService.fundAccount(wallet.address);
      
      // Extract name from phone or use default
      const defaultName = normalizedPhone.substring(0, 15);
      
      // Register on blockchain
      await movementService.registerUser(normalizedPhone, wallet.address, wallet.privateKey);
      
      // Store in name mapping
      await nameMappingService.saveUserInfo({
        name: defaultName,
        phone: normalizedPhone,
        address: wallet.address,
        privateKey: wallet.privateKey
      });
      
      // Get balance
      const balance = await movementService.getBalance(wallet.address);
      const balanceFormatted = (balance / 100000000).toFixed(2);
      
      await this.sendMessage(
        twilioFrom,
        `🎉 *Welcome to Flux!*

Your secure wallet is ready and live on Movement Network!

──────────────────
💰 *Balance:* ${balanceFormatted} MOVE
🏦 *Wallet:* ${wallet.address.substring(0, 10)}...${wallet.address.slice(-8)}
⛓️ *Network:* Movement Testnet
──────────────────

✨ *What you can do:*
• Send money: PAY [name] [amount]
• Check balance: BALANCE
• Account info: STATUS
• Get help: HELP

Your funds are secured by Move language smart contracts on Movement blockchain. Start sending money by just typing their name!`.trim()
      );
      
      // Clear session
      this.userSessions.delete(normalizedPhone);
    } catch (error) {
      logger.error('Error handling registration:', error);
      await this.sendMessage(twilioFrom, '❌ Registration failed. Please try again or contact support.');
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
        `💰 *Your Flux Wallet*

──────────────────
👤 *Name:* ${name}
💎 *Balance:* ${balanceFormatted} MOVE
🏦 *Address:* ${address.substring(0, 10)}...${address.slice(-8)}
⛓️ *Network:* Movement Testnet
──────────────────

📊 *Transaction Summary:*
📤 Sent: ${history.sent}
📥 Received: ${history.received}

🔍 View on Explorer:
https://explorer.movementnetwork.xyz/account/${address}?network=bardock+testnet

✨ Ready to send payments? Just type:
PAY [name] [amount]
        `.trim()
      );
    } catch (error) {
      logger.error('Error handling balance check:', error);
      await this.sendMessage(
        twilioFrom,
        `Oops! I'm having trouble checking your balance right now. 😅

The Movement Network might be busy. Could you try again in a moment?

If this keeps happening, let me know!`
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
          `Hmm, that amount doesn't look quite right. 🤔\n\nMake sure you're using a positive number like:\n• PAY Mrunal 10\n• PAY Dad 5.5\n\nWhat amount would you like to send?`
        );
        return;
      }

      // Check if sender is registered
      const senderAddress = await nameMappingService.getAddressByPhone(normalizedPhone);
      if (!senderAddress) {
        await this.sendMessage(
          twilioFrom,
          `Hey! Looks like you need a wallet first. 🏦

No worries - I can create one for you right now! Just send *REGISTER* and we'll get you set up in seconds.

Ready to start?`
        );
        return;
      }

      // Check if recipient is registered
      if (!recipientAddress) {
        await this.sendMessage(
          twilioFrom,
          `Hmm, looks like ${recipientName || recipientPhone} isn't on Flux yet. 🤔

They'll need to create a wallet first before they can receive payments. Just ask them to send any message to this number and I'll help them get set up!

It only takes a minute! ⚡`
        );
        return;
      }

      // Send processing message
      const displayName = recipientName || recipientPhone;
      await this.sendMessage(
        twilioFrom,
        `Processing your transaction...

💸 *Amount:* ${amount} MOVE
👤 *To:* ${displayName}

⚡ Verifying recipient wallet...
🔐 Signing with your private key...
⛓️ Broadcasting to Movement Network...
⏳ Awaiting blockchain confirmation...`
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
          `✅ *Transaction Successful!*

I've just executed a live blockchain transaction!

──────────────────
📤 *From:* Your Flux wallet
📥 *To:* ${displayName}
💰 *Amount:* ${amount} MOVE
⛓️ *Network:* Movement Testnet
✨ *Status:* Confirmed on blockchain
──────────────────

🔗 *Transaction Hash:*
${txHash.substring(0, 20)}...${txHash.slice(-10)}

🔍 *View on Explorer:*
https://explorer.movementnetwork.xyz/txn/${txHash}?network=bardock+testnet

Your payment has been securely recorded on Movement blockchain! 🚀`
        );
      } catch (txError) {
        logger.error('Transaction failed:', txError);
        await this.sendMessage(
          twilioFrom,
          `❌ *Transaction Failed*

Oops! The blockchain transaction couldn't be completed.

⚠️ *Reason:* ${txError.message || 'Please verify your balance and try again.'}

💡 *Tip:* Make sure you have enough MOVE tokens to cover both the payment and gas fees (usually ~0.0001 MOVE).`
        );
        return;
      }
    } catch (error) {
      logger.error('Error handling payment:', error);
      await this.sendMessage(
        twilioFrom,
        `Oops! Something went wrong while processing your payment. 😅

Don't worry - no funds were transferred. Could you try again?

If the issue persists, send *BALANCE* to check your wallet status.`
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

Amount: ${amount} MOVE
From: ${from}

Transaction: ${txHash.substring(0, 10)}...

Check balance: Send BALANCE
        `.trim()
        : `✅ *Payment Sent!*

Amount: ${amount} MOVE
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
