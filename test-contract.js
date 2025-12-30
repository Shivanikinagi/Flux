const { AptosClient, AptosAccount, HexString } = require('aptos');
const crypto = require('crypto');

// Movement Network Testnet configuration
const MOVEMENT_NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0x7a9ea50052a16a735b75491d961ac61d9eae45584c1f789a4d93d99132c240a9';
const MODULE_NAME = 'phone_registry';

// Your account private key from .aptos/config.yaml
const PRIVATE_KEY = '0x74c2ac8ec286c81be43dfc3175ca9df543c3390c208d816d857db3704c375bf8';

const client = new AptosClient(MOVEMENT_NODE_URL);

// Hash phone number for privacy
function hashPhoneNumber(phoneNumber) {
  return crypto
    .createHash('sha256')
    .update(phoneNumber.toString())
    .digest();
}

async function testContract() {
  try {
    console.log('🚀 Testing Flux Contract on Movement Network\n');

    // Load account
    const account = new AptosAccount(new HexString(PRIVATE_KEY).toUint8Array());
    console.log(`Account Address: ${account.address().hex()}\n`);

    // Check account balance
    const balance = await client.getAccountResource(
      account.address(),
      '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    console.log(`Initial Balance: ${balance.data.coin.value / 100000000} MOVE\n`);

    // Test 1: Register a phone number
    console.log('📝 Test 1: Registering phone number...');
    const testPhone = '+1234567890';
    const phoneHash = Array.from(hashPhoneNumber(testPhone));
    
    const registerPayload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::register_user`,
      type_arguments: [],
      arguments: [CONTRACT_ADDRESS, phoneHash]
    };

    try {
      const registerTxn = await client.generateTransaction(account.address(), registerPayload);
      const signedRegisterTxn = await client.signTransaction(account, registerTxn);
      const registerResult = await client.submitTransaction(signedRegisterTxn);
      await client.waitForTransaction(registerResult.hash);
      console.log(`✅ User registered! Txn: ${registerResult.hash}\n`);
    } catch (error) {
      if (error.message.includes('E_PHONE_ALREADY_REGISTERED')) {
        console.log(`ℹ️  Phone already registered (expected if running multiple times)\n`);
      } else {
        throw error;
      }
    }

    // Test 2: Try to register same phone again (should fail)
    console.log('📝 Test 2: Trying to register same phone again (should fail)...');
    try {
      const registerTxn2 = await client.generateTransaction(account.address(), registerPayload);
      const signedRegisterTxn2 = await client.signTransaction(account, registerTxn2);
      const registerResult2 = await client.submitTransaction(signedRegisterTxn2);
      await client.waitForTransaction(registerResult2.hash);
      console.log('❌ Should have failed but succeeded!\n');
    } catch (error) {
      if (error.message.includes('ABORTED') || error.message.includes('E_PHONE_ALREADY_REGISTERED')) {
        console.log('✅ Correctly rejected duplicate registration\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // Test 3: Query user by phone hash (view function)
    console.log('📝 Test 3: Looking up user by phone hash...');
    try {
      const viewPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_user`,
        type_arguments: [],
        arguments: [CONTRACT_ADDRESS, phoneHash]
      };
      
      const result = await client.view(viewPayload);
      console.log(`✅ User found: ${result[0]}`);
      console.log(`   Matches deployer: ${result[0] === account.address().hex()}\n`);
    } catch (error) {
      console.log(`⚠️  View function error: ${error.message}\n`);
    }

    // Test 4: Update phone number
    console.log('📝 Test 4: Updating to new phone number...');
    const newTestPhone = '+9876543210';
    const newPhoneHash = Array.from(hashPhoneNumber(newTestPhone));
    
    const updatePayload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::update_user`,
      type_arguments: [],
      arguments: [CONTRACT_ADDRESS, newPhoneHash]
    };

    try {
      const updateTxn = await client.generateTransaction(account.address(), updatePayload);
      const signedUpdateTxn = await client.signTransaction(account, updateTxn);
      const updateResult = await client.submitTransaction(signedUpdateTxn);
      await client.waitForTransaction(updateResult.hash);
      console.log(`✅ Phone updated! Txn: ${updateResult.hash}\n`);

      // Verify new phone works
      const viewPayload = {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_user`,
        type_arguments: [],
        arguments: [CONTRACT_ADDRESS, newPhoneHash]
      };
      const result = await client.view(viewPayload);
      console.log(`✅ New phone verified: ${result[0]}\n`);
    } catch (error) {
      console.log(`⚠️  Update error: ${error.message}\n`);
    }

    // Test 5: Check final balance
    const finalBalance = await client.getAccountResource(
      account.address(),
      '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    console.log(`Final Balance: ${finalBalance.data.coin.value / 100000000} MOVE`);
    console.log(`Gas Used: ${(balance.data.coin.value - finalBalance.data.coin.value) / 100000000} MOVE\n`);

    console.log('✅ All tests completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`   - Network: Movement Bardock Testnet`);
    console.log(`   - Explorer: https://explorer.movementnetwork.xyz/?network=bardock+testnet`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testContract();
