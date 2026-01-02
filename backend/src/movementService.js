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
   * Generate a new wallet (keypair)
   */
  generateNewWallet() {
    const account = new AptosAccount();
    return {
      address: account.address().hex(),
      privateKey: `0x${Buffer.from(account.signingKey.secretKey).toString('hex').slice(0, 64)}`,
      publicKey: account.pubKey().hex(),
    };
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
   * Fund account via Movement Network faucet
   */
  async fundAccount(address) {
    try {
      logger.info(`Checking balance for address: ${address}`);

      // First check if account exists and has balance
      try {
        const balance = await this.getBalance(address);
        if (balance > 1000000) { // If has more than 0.01 MOVE
          logger.info(`Account already has sufficient funds: ${balance} Octas`);
          return { 
            message: 'Account already funded',
            balance: balance,
            skipped: true 
          };
        }
      } catch (error) {
        // Account doesn't exist yet, continue to fund
        logger.info('Account not found on-chain, will fund via faucet');
      }

      logger.info(`Requesting funds for address: ${address}`);

      // Use Movement Testnet Faucet (Chain ID: 250)
      // Faucet endpoint: https://faucet.testnet.movementnetwork.xyz/
      // RPC: https://testnet.movementnetwork.xyz/v1
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      // Fund with 1 MOVE (100000000 Octas) from Movement testnet faucet
      const command = `aptos account fund-with-faucet --account ${address} --amount 100000000 --url https://testnet.movementnetwork.xyz/v1 --faucet-url https://faucet.testnet.movementnetwork.xyz`;
      
      logger.info(`Funding command: ${command}`);
      
      const { stdout, stderr } = await execPromise(command);
      
      if (stderr && !stderr.includes('Result')) {
        logger.error(`Faucet stderr: ${stderr}`);
        throw new Error(`Faucet command failed: ${stderr}`);
      }

      logger.info(`Account funded successfully: ${address}`);
      logger.info(`Faucet output: ${stdout}`);

      return { 
        message: 'Account funded successfully',
        output: stdout,
        funded: true
      };
    } catch (error) {
      logger.error('Error funding account:', error);
      throw new Error(`Failed to fund account: ${error.message}`);
    }
  }

  /**
   * Register phone number to blockchain address
   */
  async registerPhone(privateKeyHex, phone, name) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const account = this.getAccountFromPrivateKey(privateKeyHex);
      const phoneHash = this.hashPhoneNumber(phone);

      logger.info(`Registering phone for address: ${account.address().hex()}, name: ${name}`);

      const payload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::phone_registry::register_user`,
        type_arguments: [],
        arguments: [
          this.contractAddress,
          Array.from(phoneHash),
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
        name: name,
      };
    } catch (error) {
      logger.error('Error registering phone:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Update phone registration (for re-registration)
   */
  async updatePhone(privateKeyHex, phone, name) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      const account = this.getAccountFromPrivateKey(privateKeyHex);
      const phoneHash = this.hashPhoneNumber(phone);

      logger.info(`Updating phone for address: ${account.address().hex()}, name: ${name}`);

      const payload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::phone_registry::update_user`,
        type_arguments: [],
        arguments: [
          this.contractAddress,
          Array.from(phoneHash),
        ],
      };

      const txnRequest = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);

      logger.info(`Transaction submitted: ${transactionRes.hash}`);
      await this.client.waitForTransaction(transactionRes.hash);

      logger.info(`Phone updated successfully: ${transactionRes.hash}`);

      return {
        transactionHash: transactionRes.hash,
        address: account.address().hex(),
        phoneHash: phoneHash.toString('hex'),
        name: name,
      };
    } catch (error) {
      logger.error('Error updating phone:', error);
      throw new Error(`Update failed: ${error.message}`);
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

      // Get recipient's address from name mapping
      const nameMappingService = require('./nameMappingService');
      const recipientInfo = await nameMappingService.getUserInfo(recipientPhone);
      
      if (!recipientInfo) {
        throw new Error('Recipient not registered');
      }

      const recipientAddress = recipientInfo.address;

      // Convert amount to octas (1 MOVE = 100000000 octas)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);

      logger.info(`Sending payment: ${amountInOctas} octas from ${account.address().hex()} to ${recipientAddress}`);

      // Direct coin transfer - no smart contract needed
      const payload = {
        type: 'entry_function_payload',
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [
          recipientAddress,
          amountInOctas.toString(),
        ],
      };

      // Generate transaction with explicit gas parameters
      const txnRequest = await this.client.generateTransaction(account.address(), payload, {
        max_gas_amount: '200000',  // Set explicit gas limit
        gas_unit_price: '100',      // Gas price in octas
      });
      const signedTxn = await this.client.signTransaction(account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);

      logger.info(`Payment transaction submitted: ${transactionRes.hash}`);
      await this.client.waitForTransaction(transactionRes.hash);

      logger.info(`Payment sent successfully: ${transactionRes.hash}`);

      return {
        transactionHash: transactionRes.hash,
        sender: account.address().hex(),
        recipientAddress: recipientAddress,
        recipientPhone: recipientPhone,
        amount: amount,
        amountInOctas: amountInOctas,
      };
    } catch (error) {
      logger.error('Error sending payment:', error);
      logger.error('Payment details:', {
        sender: privateKeyHex ? 'has private key' : 'no private key',
        recipientPhone,
        amount,
        errorMessage: error.message,
        errorStack: error.stack
      });
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

      // Try to get the user address - if it exists, phone is registered
      const result = await this.client.view({
        function: `${this.contractAddress}::phone_registry::get_user`,
        type_arguments: [],
        arguments: [this.contractAddress, Array.from(phoneHash)],
      });

      // If we get an address back, the phone is registered
      return result && result[0] && result[0] !== '0x0';
    } catch (error) {
      // If get_user throws E_PHONE_NOT_FOUND error, phone is not registered
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
