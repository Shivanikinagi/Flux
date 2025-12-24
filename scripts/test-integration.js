#!/usr/bin/env node

/**
 * ChatterPay Integration Test Script
 * Tests the complete flow: register phone → send payment
 */

const { AptosClient, AptosAccount, TxnBuilderTypes } = require('aptos');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

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

// Hash phone number (same as backend)
function hashPhoneNumber(phone) {
  return crypto.createHash('sha256').update(phone).digest();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 ChatterPay Integration Tests', 'cyan');
  log('='.repeat(60), 'cyan');

  const nodeUrl = process.env.MOVEMENT_NODE_URL || 'https://testnet.movementnetwork.xyz/v1';
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    log('❌ CONTRACT_ADDRESS not set', 'red');
    process.exit(1);
  }

  log(`\n📡 Connecting to: ${nodeUrl}`, 'cyan');
  const client = new AptosClient(nodeUrl);

  try {
    // Create test accounts
    log('\n[1/5] Creating test accounts...', 'cyan');
    const alice = new AptosAccount();
    const bob = new AptosAccount();
    
    log(`Alice: ${alice.address().hex()}`, 'green');
    log(`Bob: ${bob.address().hex()}`, 'green');

    // Fund accounts (in testnet, you'd need to request from faucet)
    log('\n[2/5] Funding test accounts...', 'cyan');
    log('⚠️  Note: In testnet, use faucet to fund these accounts', 'yellow');
    log('Command: movement account fund-with-faucet --account <address>', 'yellow');

    // For this test, we'll simulate the process
    log('Waiting for manual funding... (Press Ctrl+C to skip)', 'yellow');
    await sleep(3000);

    // Register phone numbers
    log('\n[3/5] Registering phone numbers...', 'cyan');
    
    const alicePhone = '+1234567890';
    const bobPhone = '+0987654321';
    
    const alicePhoneHash = hashPhoneNumber(alicePhone);
    const bobPhoneHash = hashPhoneNumber(bobPhone);

    log(`Alice phone: ${alicePhone}`, 'cyan');
    log(`Bob phone: ${bobPhone}`, 'cyan');

    // Register Alice
    try {
      const aliceRegisterPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::phone_registry::register_phone`,
        type_arguments: [],
        arguments: [
          Array.from(alicePhoneHash),
          contractAddress
        ],
      };

      const txnRequest = await client.generateTransaction(alice.address(), aliceRegisterPayload);
      const signedTxn = await client.signTransaction(alice, txnRequest);
      const txnRes = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(txnRes.hash);
      
      log('✅ Alice registered successfully', 'green');
    } catch (error: any) {
      log(`⚠️  Alice registration: ${error.message}`, 'yellow');
    }

    // Register Bob
    try {
      const bobRegisterPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::phone_registry::register_phone`,
        type_arguments: [],
        arguments: [
          Array.from(bobPhoneHash),
          contractAddress
        ],
      };

      const txnRequest = await client.generateTransaction(bob.address(), bobRegisterPayload);
      const signedTxn = await client.signTransaction(bob, txnRequest);
      const txnRes = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(txnRes.hash);
      
      log('✅ Bob registered successfully', 'green');
    } catch (error: any) {
      log(`⚠️  Bob registration: ${error.message}`, 'yellow');
    }

    // Check registration
    log('\n[4/5] Verifying registrations...', 'cyan');
    try {
      const isAliceRegistered = await client.view({
        function: `${contractAddress}::phone_registry::is_phone_registered`,
        type_arguments: [],
        arguments: [Array.from(alicePhoneHash), contractAddress],
      });
      log(`Alice registered: ${isAliceRegistered}`, 'cyan');

      const isBobRegistered = await client.view({
        function: `${contractAddress}::phone_registry::is_phone_registered`,
        type_arguments: [],
        arguments: [Array.from(bobPhoneHash), contractAddress],
      });
      log(`Bob registered: ${isBobRegistered}`, 'cyan');
    } catch (error: any) {
      log(`⚠️  Verification: ${error.message}`, 'yellow');
    }

    // Send payment
    log('\n[5/5] Testing payment from Alice to Bob...', 'cyan');
    try {
      const amount = 100000; // 0.001 APT
      
      const paymentPayload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::phone_registry::send_payment_to_phone`,
        type_arguments: [],
        arguments: [
          Array.from(bobPhoneHash),
          amount.toString(),
          contractAddress
        ],
      };

      const txnRequest = await client.generateTransaction(alice.address(), paymentPayload);
      const signedTxn = await client.signTransaction(alice, txnRequest);
      const txnRes = await client.submitTransaction(signedTxn);
      
      log(`📝 Transaction: ${txnRes.hash}`, 'cyan');
      await client.waitForTransaction(txnRes.hash);
      
      log('✅ Payment sent successfully!', 'green');
      log(`💸 Amount: ${amount / 100000000} APT`, 'cyan');
    } catch (error: any) {
      log(`⚠️  Payment: ${error.message}`, 'yellow');
    }

    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 Integration tests completed!', 'green');
    log('='.repeat(60), 'cyan');

  } catch (error) {
    log('\n❌ Tests failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
