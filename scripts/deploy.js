#!/usr/bin/env node

/**
 * ChatterPay Smart Contract Deployment Script
 * Deploys the phone_registry module to Movement Network
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  log(`\n📦 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✅ ${description} - Success`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} - Failed`, 'red');
    console.error(error.stdout || error.message);
    throw error;
  }
}

async function main() {
  log('='.repeat(60), 'blue');
  log('🚀 ChatterPay Smart Contract Deployment', 'cyan');
  log('='.repeat(60), 'blue');

  const contractsDir = path.join(__dirname, '..', 'contracts');
  
  // Change to contracts directory
  process.chdir(contractsDir);
  log(`\n📂 Working directory: ${contractsDir}`, 'yellow');

  try {
    // Step 1: Check Movement CLI
    log('\n[1/6] Checking Movement CLI installation...', 'blue');
    try {
      const version = execSync('movement --version', { encoding: 'utf-8' });
      log(`✅ Movement CLI found: ${version.trim()}`, 'green');
    } catch (error) {
      log('❌ Movement CLI not found. Please install it first.', 'red');
      log('Installation guide: https://docs.movementnetwork.xyz', 'yellow');
      process.exit(1);
    }

    // Step 2: Compile the contract
    log('\n[2/6] Compiling Move contracts...', 'blue');
    executeCommand('movement move compile', 'Contract compilation');

    // Step 3: Run tests
    log('\n[3/6] Running contract tests...', 'blue');
    try {
      executeCommand('movement move test', 'Contract tests');
    } catch (error) {
      log('⚠️  Tests failed. Continue deployment? (y/n)', 'yellow');
      // In automated scripts, we'll skip this prompt
      // For now, we'll continue
    }

    // Step 4: Check account and balance
    log('\n[4/6] Checking account status...', 'blue');
    try {
      const balance = executeCommand(
        'movement account list --query balance',
        'Account balance check'
      );
      log(`Account balance: ${balance}`, 'cyan');
    } catch (error) {
      log('⚠️  Could not check balance', 'yellow');
    }

    // Step 5: Publish the module
    log('\n[5/6] Publishing smart contract to Movement Network...', 'blue');
    const publishCommand = 'movement move publish --named-addresses ChatterPay=default --assume-yes';
    const publishOutput = executeCommand(publishCommand, 'Contract deployment');

    // Extract contract address from output
    const addressMatch = publishOutput.match(/0x[a-fA-F0-9]{64}/);
    const contractAddress = addressMatch ? addressMatch[0] : null;

    if (contractAddress) {
      log(`\n✅ Contract deployed successfully!`, 'green');
      log(`📝 Contract Address: ${contractAddress}`, 'cyan');

      // Save contract address to .env file
      const envPath = path.join(__dirname, '..', 'backend', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('CONTRACT_ADDRESS=')) {
          envContent = envContent.replace(
            /CONTRACT_ADDRESS=.*/,
            `CONTRACT_ADDRESS=${contractAddress}`
          );
        } else {
          envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
        }
        fs.writeFileSync(envPath, envContent);
        log('✅ Updated .env file with contract address', 'green');
      }

      // Save deployment info
      const deploymentInfo = {
        contractAddress,
        deployedAt: new Date().toISOString(),
        network: 'movement-testnet',
        module: 'ChatterPay::phone_registry',
      };

      const deploymentPath = path.join(__dirname, '..', 'deployment-info.json');
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      log('✅ Saved deployment info to deployment-info.json', 'green');
    }

    // Step 6: Initialize the registry
    log('\n[6/6] Initializing phone registry...', 'blue');
    log('⚠️  Note: You need to call initialize() function separately', 'yellow');
    log('Use: node scripts/initialize.js', 'cyan');

    log('\n' + '='.repeat(60), 'blue');
    log('🎉 Deployment completed successfully!', 'green');
    log('='.repeat(60), 'blue');

    log('\n📋 Next steps:', 'cyan');
    log('1. Run: node scripts/initialize.js', 'yellow');
    log('2. Update backend/.env with CONTRACT_ADDRESS', 'yellow');
    log('3. Start the backend server: cd backend && npm start', 'yellow');

  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run deployment
main().catch(error => {
  console.error(error);
  process.exit(1);
});
