const { AptosClient, AptosAccount, TxnBuilderTypes } = require('aptos');
const crypto = require('crypto');
const logger = require('./utils/logger');

class MovementService {
  constructor() {
    this.nodeUrl = process.env.MOVEMENT_NODE_URL || 'https://testnet.movementnetwork.xyz/v1';
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.client = new AptosClient(this.nodeUrl);

    if (!this.contractAddress) {
      logger.warn('CONTRACT_ADDRESS not set in environment variables');
    }

    logger.info(`Movement service initialized: ${this.nodeUrl}`);
  }

  /**
   * Hash phone number for privacy
   */
  hashPhoneNumber(phone) {
    return crypto.createHash('sha256').update(phone).digest();
  }

  /**
   * Create account from private key
   */
  getAccountFromPrivateKey(privateKeyHex) {
    const privateKeyBytes = Buffer.from(privateKeyHex.replace('0x', ''), 'hex');
    return new AptosAccount(privateKeyBytes);
  }

  /**
   * Get account balance
   */
  async getBalance(address) {
    try {
      const resources = await this.client.getAccountResources(address);
      const coinResource = resources.find(
        r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (coinResource) {
        return parseInt(coinResource.data.coin.value);
      }

      return 0;
    } catch (error) {
      logger.error('Error fetching balance:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Register phone number to blockchain address
   */
  async registerPhone(privateKeyHex, phone) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const account = this.getAccountFromPrivateKey(privateKeyHex);
      const phoneHash = this.hashPhoneNumber(phone);

      logger.info(`Registering phone for address: ${account.address().hex()}`);

      const payload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::phone_registry::register_phone`,
        type_arguments: [],
        arguments: [
          Array.from(phoneHash),
          this.contractAddress,
        ],
      };

      const txnRequest = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);

      logger.info(`Transaction submitted: ${transactionRes.hash}`);
      await this.client.waitForTransaction(transactionRes.hash);

      logger.info(`Phone registered successfully: ${transactionRes.hash}`);

      return {
        transactionHash: transactionRes.hash,
        address: account.address().hex(),
        phoneHash: phoneHash.toString('hex'),
      };
    } catch (error) {
      logger.error('Error registering phone:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Send payment to a phone number
   */
  async sendPaymentToPhone(privateKeyHex, recipientPhone, amount) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const account = this.getAccountFromPrivateKey(privateKeyHex);
      const recipientPhoneHash = this.hashPhoneNumber(recipientPhone);

      // Convert amount to octas (1 APT = 100000000 octas)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      logger.info(`Sending payment: ${amountInOctas} octas to ${recipientPhone}`);

      // Check if recipient is registered
      const isRegistered = await this.isPhoneRegistered(recipientPhone);
      if (!isRegistered) {
        throw new Error('Recipient phone number is not registered');
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::phone_registry::send_payment_to_phone`,
        type_arguments: [],
        arguments: [
          Array.from(recipientPhoneHash),
          amountInOctas.toString(),
          this.contractAddress,
        ],
      };

      const txnRequest = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);

      logger.info(`Payment transaction submitted: ${transactionRes.hash}`);
      await this.client.waitForTransaction(transactionRes.hash);

      logger.info(`Payment sent successfully: ${transactionRes.hash}`);

      return {
        transactionHash: transactionRes.hash,
        sender: account.address().hex(),
        recipientPhone: recipientPhone,
        amount: amount,
        amountInOctas: amountInOctas,
      };
    } catch (error) {
      logger.error('Error sending payment:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Check if phone number is registered
   */
  async isPhoneRegistered(phone) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const phoneHash = this.hashPhoneNumber(phone);

      const result = await this.client.view({
        function: `${this.contractAddress}::phone_registry::is_phone_registered`,
        type_arguments: [],
        arguments: [Array.from(phoneHash), this.contractAddress],
      });

      return result[0];
    } catch (error) {
      logger.error('Error checking registration:', error);
      return false;
    }
  }

  /**
   * Get address from phone number
   */
  async getAddressFromPhone(phone) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const phoneHash = this.hashPhoneNumber(phone);

      const result = await this.client.view({
        function: `${this.contractAddress}::phone_registry::get_address_from_phone`,
        type_arguments: [],
        arguments: [Array.from(phoneHash), this.contractAddress],
      });

      return result[0];
    } catch (error) {
      logger.error('Error getting address from phone:', error);
      throw new Error('Failed to get address from phone number');
    }
  }

  /**
   * Get transaction count for address
   */
  async getTransactionHistory(address) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const result = await this.client.view({
        function: `${this.contractAddress}::phone_registry::get_transaction_count`,
        type_arguments: [],
        arguments: [address],
      });

      return {
        sent: parseInt(result[0]),
        received: parseInt(result[1]),
      };
    } catch (error) {
      logger.error('Error getting transaction history:', error);
      return { sent: 0, received: 0 };
    }
  }

  /**
   * Get total registered users
   */
  async getTotalUsers() {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const result = await this.client.view({
        function: `${this.contractAddress}::phone_registry::get_total_users`,
        type_arguments: [],
        arguments: [this.contractAddress],
      });

      return parseInt(result[0]);
    } catch (error) {
      logger.error('Error getting total users:', error);
      return 0;
    }
  }
}

module.exports = new MovementService();
