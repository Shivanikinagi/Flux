#!/usr/bin/env node

/**
 * ChatterPay Registry Initialization Script
 * Initializes the phone registry smart contract
 */

const { AptosClient, AptosAccount, TxnBuilderTypes, BCS } = require('aptos');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔧 ChatterPay Registry Initialization', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // Load configuration
    const nodeUrl = process.env.MOVEMENT_NODE_URL || 'https://testnet.movementnetwork.xyz/v1';
    const privateKeyHex = process.env.SERVER_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!privateKeyHex) {
      log('❌ SERVER_PRIVATE_KEY not found in .env file', 'red');
      process.exit(1);
    }

    if (!contractAddress) {
      log('❌ CONTRACT_ADDRESS not found in .env file', 'red');
      log('Please deploy the contract first: node scripts/deploy.js', 'yellow');
      process.exit(1);
    }

    log(`\n📡 Connecting to: ${nodeUrl}`, 'cyan');
    const client = new AptosClient(nodeUrl);

    // Create account from private key
    log('🔑 Loading admin account...', 'cyan');
    const privateKeyBytes = Buffer.from(privateKeyHex.replace('0x', ''), 'hex');
    const account = new AptosAccount(privateKeyBytes);
    
    log(`✅ Admin address: ${account.address().hex()}`, 'green');

    // Check account balance
    log('\n💰 Checking account balance...', 'cyan');
    try {
      const resources = await client.getAccountResources(account.address());
      const coinResource = resources.find(r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
      if (coinResource) {
        const balance = (coinResource.data as any).coin.value;
        log(`Balance: ${balance / 100000000} APT`, 'green');
        
        if (parseInt(balance) < 1000000) { // Less than 0.01 APT
          log('⚠️  Warning: Low balance. You may need more APT for transactions', 'yellow');
        }
      }
    } catch (error) {
      log('⚠️  Could not fetch balance', 'yellow');
    }

    // Initialize the registry
    log('\n🚀 Initializing phone registry...', 'cyan');
    
    const payload = {
      type: 'entry_function_payload',
      function: `${contractAddress}::phone_registry::initialize`,
      type_arguments: [],
      arguments: [],
    };

    try {
      const txnRequest = await client.generateTransaction(account.address(), payload);
      const signedTxn = await client.signTransaction(account, txnRequest);
      const transactionRes = await client.submitTransaction(signedTxn);
      
      log(`📝 Transaction hash: ${transactionRes.hash}`, 'cyan');
      log('⏳ Waiting for transaction confirmation...', 'yellow');
      
      await client.waitForTransaction(transactionRes.hash);
      
      log('✅ Registry initialized successfully!', 'green');

      // Verify initialization
      log('\n🔍 Verifying initialization...', 'cyan');
      try {
        const registryResources = await client.getAccountResources(account.address());
        const phoneRegistry = registryResources.find(r => 
          r.type.includes('phone_registry::PhoneRegistry')
        );
        
        if (phoneRegistry) {
          log('✅ PhoneRegistry resource found on chain', 'green');
          log(`Total users: ${(phoneRegistry.data as any).total_users}`, 'cyan');
        } else {
          log('⚠️  PhoneRegistry resource not found (may need to wait)', 'yellow');
        }
      } catch (error) {
        log('⚠️  Could not verify initialization', 'yellow');
      }

      // Save initialization info
      const initInfo = {
        initializedAt: new Date().toISOString(),
        adminAddress: account.address().hex(),
        contractAddress: contractAddress,
        transactionHash: transactionRes.hash,
        network: 'movement-testnet',
      };

      const initPath = path.join(__dirname, '..', 'initialization-info.json');
      fs.writeFileSync(initPath, JSON.stringify(initInfo, null, 2));
      log('✅ Saved initialization info to initialization-info.json', 'green');

    } catch (error: any) {
      if (error.message && error.message.includes('ALREADY_INITIALIZED')) {
        log('ℹ️  Registry is already initialized', 'yellow');
      } else {
        throw error;
      }
    }

    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 Initialization completed!', 'green');
    log('='.repeat(60), 'cyan');

    log('\n📋 Next steps:', 'cyan');
    log('1. Start the backend server: cd backend && npm start', 'yellow');
    log('2. Setup ngrok for webhooks: ngrok http 3000', 'yellow');
    log('3. Configure Twilio webhook URL', 'yellow');

  } catch (error) {
    log('\n❌ Initialization failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
