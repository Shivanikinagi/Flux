// Fund Aptos Testnet Account
const https = require('https');

const address = '0x7a9ea50052a16a735b75491d961ac61d9eae45584c1f789a4d93d99132c240a9';

// Try multiple faucet options
async function fundAccount() {
  console.log(`Funding account: ${address}`);
  
  // Option 1: Try aptoslabs.com faucet API
  try {
    const response = await fetch(`https://faucet.testnet.aptoslabs.com/mint?amount=100000000&address=${address}`, {
      method: 'POST'
    });
    const data = await response.text();
    console.log('Faucet response:', data);
  } catch (error) {
    console.error('Error funding account:', error.message);
  }
  
  console.log('\nIf automated funding failed, please visit:');
  console.log('https://aptosfaucet.com');
  console.log(`And paste this address: ${address}`);
}

fundAccount();
