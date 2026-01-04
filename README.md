# Flux: WhatsApp-based Crypto Payments on Movement Network

![Flux Banner](https://via.placeholder.com/1200x300/4A90E2/FFFFFF?text=Flux+%7C+WhatsApp+Crypto+Payments)

## 📱 Overview

Flux is a WhatsApp-based cryptocurrency payment system built on the **Aptos blockchain**. It enables users to send and receive crypto tokens using simple WhatsApp commands, without needing to know blockchain addresses.

### Key Features:

- 💬 Send crypto payments via WhatsApp messages
- 📞 Register phone numbers to blockchain addresses
- 🔐 Secure phone number hashing for privacy
- 🌐 RESTful API for programmatic integration
- ⚡ Real-time transaction confirmations
- 🔒 Privacy-focused phone-to-address mapping
- 🌍 Multi-network support (Aptos, Movement)

## ⚡ Quick Start (5 Minutes)

### Fastest Way to Get Started:

```bash
# 1. Clone and install
git clone https://github.com/Shivanikinagi/Flux.git
cd Flux/backend
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Get Aptos testnet account
aptos init
aptos account fund-with-faucet --account default

# 4. Deploy contract
cd ../contracts
aptos move publish --named-addresses ChatterPay=default

# 5. Update .env with your contract address
# Copy your account address to CONTRACT_ADDRESS in .env

# 6. Start server
cd ../backend
npm start
```

**What You Need:**
1. ✅ Twilio account (free) → Get credentials
2. ✅ Aptos CLI installed → Generate wallet
3. ✅ ngrok (for testing) → Expose localhost

**Next:** Follow detailed setup below for Twilio configuration.

## 🏗️ Architecture

Flux consists of three main components:

1. **Smart Contract**: Move language contract on Movement Network for phone registry and payments
2. **Backend Server**: Node.js/Express server handling API requests and WhatsApp webhooks
3. **WhatsApp Interface**: Twilio integration for messaging and commands

```
┌─────────────┐      ┌──────────────┐      ┌──────────────────┐
│   WhatsApp  │◄────►│    Twilio    │◄────►│  Backend Server  │
│    User     │      │   Webhook    │      │   (Node.js)      │
└─────────────┘      └──────────────┘      └──────────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  Aptos Blockchain │
                                            │  Smart Contract   │
                                            └──────────────────┘
```

### Technical Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Web3.js integration

**Backend:**
- Node.js v18+
- Express.js
- Twilio WhatsApp API
- Aptos SDK

**Blockchain:**
- Aptos/Movement Network
- Move smart contracts
- Multi-network support

**Security:**
- Helmet.js
- Rate limiting
- JWT authentication
- Environment variables

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Aptos CLI installed and configured
- Twilio account with WhatsApp sandbox
- Aptos testnet account with MOVE/APT tokens
- ngrok (for local webhook testing)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Shivanikinagi/Flux.git
cd Flux
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Aptos CLI**

```bash
# For Linux/macOS
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# For Windows (via PowerShell)
iwr "https://aptos.dev/scripts/install_cli.py" -useb | py

# Verify installation
aptos --version
```

4. **Environment Setup**

Create a `.env` file in the `backend` directory based on `.env.example`:

```bash
# Movement/Aptos Network Configuration
MOVEMENT_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
CONTRACT_ADDRESS=0x_your_deployed_contract_address_here
SERVER_PRIVATE_KEY=0x_your_server_private_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 🔑 Required API Keys and Configuration

#### 1. **Aptos/Movement Network Setup**

**Generate Private Key:**
```bash
# Initialize Aptos CLI
aptos init

# This creates a new account and private key
# Location: ~/.aptos/config.yaml
```

**Get Testnet Funds:**
```bash
# Fund your account with testnet tokens
aptos account fund-with-faucet --account default

# Or use web faucet:
# https://aptoslabs.com/testnet-faucet
```

**Export Private Key:**
```bash
# View your private key
cat ~/.aptos/config.yaml

# Copy the private key value (starts with 0x)
# Add to .env as SERVER_PRIVATE_KEY
```

#### 2. **Twilio WhatsApp Setup**

**Step 1: Create Twilio Account**
- Sign up at [Twilio Console](https://console.twilio.com/us1/account/keys-credentials/api-keys)
- Complete email verification

**Step 2: Get Account Credentials**
```
1. Go to: https://console.twilio.com/
2. From Dashboard, copy:
   - Account SID (ACxxxxxxxxxxxxxxxxx)
   - Auth Token (click "Show" to reveal)
3. Add to .env:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
```

**Step 3: Setup WhatsApp Sandbox**
```
1. Navigate to: Messaging > Try it out > Send a WhatsApp message
2. Follow instructions to join sandbox:
   - Send "join [code]" to WhatsApp number (e.g., +1 415 523 8886)
3. Copy sandbox phone number:
   TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

**Step 4: Configure Webhook**
```
1. In Twilio Console, go to: Messaging > Settings > WhatsApp sandbox settings
2. Set webhook URL:
   - For local development: https://your-ngrok-url.ngrok.io/webhook
   - For production: https://your-domain.com/webhook
3. HTTP Method: POST
4. Save configuration
```

#### 3. **JWT Secret Generation**

Generate a secure random string for JWT tokens:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64

# Add to .env as JWT_SECRET
```

#### 4. **Network Configuration**

The system supports multiple networks. Edit `backend/config/networks.json`:

```json
{
  "networks": {
    "aptos-testnet": {
      "name": "Aptos Testnet",
      "rpcUrl": "https://fullnode.testnet.aptoslabs.com/v1",
      "faucetUrl": "https://faucet.testnet.aptoslabs.com",
      "chainId": "2",
      "explorerUrl": "https://explorer.aptoslabs.com/?network=testnet",
      "currency": "APT",
      "type": "aptos",
      "active": true
    }
  }
}
```

Set `"active": true` for your preferred network.

## 🔑 Twilio WhatsApp Setup

**Detailed Step-by-Step Guide:**

### Step 1: Create Twilio Account
1. Visit [Twilio Sign Up](https://www.twilio.com/try-twilio)
2. Complete registration with email and phone verification
3. Skip trial upgrade (free tier works for testing)

### Step 2: Access WhatsApp Sandbox
1. Log in to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. You'll see the sandbox configuration page

### Step 3: Get Your Credentials
```
Account SID: Found on Console Dashboard (starts with AC...)
Auth Token: Click "Show" to reveal on Dashboard
Sandbox Number: Listed in WhatsApp Sandbox (e.g., +1 415 523 8886)
Join Code: Unique code shown in sandbox (e.g., "join happy-cat")
```

### Step 4: Join Sandbox (Required)
```
1. From your personal WhatsApp:
2. Send this message to the sandbox number:
   join [your-join-code]
   
Example: "join happy-cat" to +1 415 523 8886

3. You'll receive confirmation message
```

### Step 5: Configure Webhook
```
1. In WhatsApp Sandbox Settings, set:
   
   When a message comes in:
   URL: https://your-ngrok-url.ngrok.io/webhook
   Method: HTTP POST

2. Save configuration
```

### Step 6: Local Development Setup (ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Start your server
cd backend
npm start

# In new terminal, expose local server
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update Twilio webhook with: https://abc123.ngrok.io/webhook
```

## 🚀 Smart Contract Deployment

### Step 1: Setup Aptos Account

```bash
# Initialize Aptos CLI (creates .aptos/config.yaml)
aptos init

# Select network when prompted:
# Choose: testnet
# Press Enter to generate new key or paste existing private key
```

### Step 2: Fund Your Account

**Option A: Using CLI**
```bash
aptos account fund-with-faucet --account default
```

**Option B: Using Web Faucet**
1. Visit: https://aptoslabs.com/testnet-faucet
2. Paste your account address
3. Click "Fund Account"
4. Wait for confirmation

**Verify Balance:**
```bash
aptos account list --account default
```

### Step 3: Prepare Contract

```bash
cd contracts

# View contract configuration
cat Move.toml

# Ensure your address is set
# [addresses]
# ChatterPay = "your_address_here"
```

### Step 4: Compile Contract

```bash
# Compile the Move contract
aptos move compile --named-addresses ChatterPay=default

# Expected output:
# {
#   "Result": [
#     "Success"
#   ]
# }
```

### Step 5: Test Contract (Optional but Recommended)

```bash
# Run contract tests
aptos move test --named-addresses ChatterPay=default

# All tests should pass
```

### Step 6: Deploy to Testnet

```bash
# Publish contract to Aptos testnet
aptos move publish --named-addresses ChatterPay=default

# Confirm when prompted
# Expected output: Transaction committed successfully
```

### Step 7: Get Contract Address

```bash
# Your contract address is your account address
aptos account list --account default

# Copy the address (starts with 0x)
# Example: 0x1a2b3c4d5e6f...
```

### Step 8: Update Backend Configuration

```bash
# Update .env file in backend directory
CONTRACT_ADDRESS=0x_your_contract_address_from_step_7
```

### Verify Deployment

```bash
# Check contract on explorer
# Visit: https://explorer.aptoslabs.com/account/YOUR_ADDRESS?network=testnet

# You should see:
# - Modules: phone_registry
# - Resources: Your contract data
```

## 🏃‍♂️ Running the Application

### Complete Startup Checklist

**Before Starting:**
- [ ] `.env` file created with all required keys
- [ ] Smart contract deployed and address updated
- [ ] Twilio WhatsApp sandbox configured
- [ ] Dependencies installed (`npm install`)

### Start Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server is running on port 3000
📱 WhatsApp webhook endpoint: http://localhost:3000/webhook
✅ Connected to Aptos Testnet
✅ Contract loaded: 0x...
```

### Setup Local Webhook (Development Only)

**Terminal 1 - Start Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Start ngrok:**
```bash
# Expose local server to internet
ngrok http 3000

# Copy the https forwarding URL
# Example: https://a1b2c3d4.ngrok.io
```

**Update Twilio Webhook:**
1. Go to [Twilio WhatsApp Sandbox Settings](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox)
2. When a message comes in: `https://a1b2c3d4.ngrok.io/webhook`
3. HTTP POST
4. Save

### Test the Setup

**Method 1: API Test**
```bash
# Health check
curl http://localhost:3000/

# Expected: { "status": "ok", "message": "ChatterPay Backend is running" }
```

**Method 2: WhatsApp Test**
```
1. Open WhatsApp
2. Send to your Twilio sandbox number: "HELP"
3. Should receive bot response with available commands
```

### View Logs

```bash
# Backend logs location
cd backend/logs

# View today's logs
cat combined-YYYY-MM-DD.log

# Follow logs in real-time
tail -f combined-*.log
```

### Troubleshooting Common Issues

**Issue: "Contract not found"**
```bash
# Verify contract address in .env
echo $CONTRACT_ADDRESS

# Check contract exists
aptos account list --account YOUR_CONTRACT_ADDRESS
```

**Issue: "Twilio authentication failed"**
```bash
# Verify credentials
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Test Twilio API
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

**Issue: "Webhook not receiving messages"**
```bash
# Check ngrok is running
# Verify webhook URL in Twilio matches ngrok URL
# Ensure server is running on port 3000
```

## 📱 Using Flux via WhatsApp

### First-Time Setup

**1. Join WhatsApp Sandbox**
```
Send to Twilio number (e.g., +1 415 523 8886):
"join happy-cat"

✅ Response: "You've joined the sandbox!"
```

**2. Register Your Wallet**
```
Send: REGISTER

✅ Response: "Your phone number has been registered!"
🔑 Stores: phone → blockchain address mapping
```

### Available Commands

#### Check Balance
```
Send: BALANCE
or
Send: BAL

Response: "Your balance: 5.42 APT"
```

#### Send Payment
```
Format: PAY <phone_number> <amount>

Examples:
PAY +1234567890 0.5
PAY +919876543210 1.25

Response: "Payment sent! Hash: 0x..."
```

#### Get Help
```
Send: HELP

Response: Lists all available commands
```

#### Check Status
```
Send: STATUS

Response: Shows registration status and network info
```

### Example Conversation Flow

```
You: REGISTER
Bot: ✅ Registration successful! Your phone +1234567890 
     is now linked to address 0x1a2b3c...

You: BALANCE
Bot: 💰 Your balance: 10.5 APT

You: PAY +19876543210 2.5
Bot: ⏳ Processing payment of 2.5 APT to +19876543210...
Bot: ✅ Payment successful! 
     Transaction: 0xabc123def456...
     Explorer: https://explorer.aptoslabs.com/txn/0xabc...

You: BALANCE  
Bot: 💰 Your balance: 7.95 APT
     (8.0 APT - 2.5 sent - 0.05 gas)
```

### Payment Notes

**Minimum Amount:** 0.001 APT
**Maximum Amount:** No limit (subject to balance)
**Transaction Time:** 2-5 seconds
**Gas Fees:** ~0.01-0.05 APT per transaction

### Recipient Requirements

⚠️ **Important:** Recipient MUST be registered first

```
❌ Wrong Flow:
You: PAY +1999999999 1.0
Bot: ❌ Recipient not registered

✅ Correct Flow:
1. Recipient sends: REGISTER
2. You send: PAY +1999999999 1.0
3. Bot: ✅ Payment successful!
```

### Error Messages

| Message | Meaning | Solution |
|---------|---------|----------|
| "Not registered" | Your phone not in system | Send REGISTER |
| "Recipient not found" | Recipient not registered | Ask them to REGISTER |
| "Insufficient funds" | Balance too low | Get testnet funds |
| "Invalid amount" | Amount format wrong | Use: PAY +1234567890 1.5 |
| "Invalid phone number" | Wrong phone format | Include country code: +1234567890 |

## 🔍 API Documentation

### Endpoints

#### `GET /`
Health check endpoint

#### `POST /api/register`
Register a phone number with blockchain address
```json
{
  "privateKeyHex": "0x...",
  "phone": "+1234567890"
}
```

#### `POST /api/send`
Send MOVE tokens to a phone number
```json
{
  "privateKeyHex": "0x...",
  "recipientPhone": "+1234567890",
  "amount": "0.01"
}
```

#### `POST /webhook`
Twilio WhatsApp webhook (used by Twilio)

## 📊 Project Structure

```
Flux/
├── contracts/                      # Move smart contracts
│   ├── sources/
│   │   └── phone_registry.move    # Main contract
│   ├── build/                     # Compiled contracts
│   ├── Move.toml                  # Contract manifest
│   └── README.md
│
├── backend/                       # Node.js backend
│   ├── src/
│   │   ├── server.js             # Express server
│   │   ├── movementService.js    # Blockchain interaction
│   │   ├── twilioService.js      # WhatsApp integration
│   │   ├── nameMappingService.js # Phone mapping
│   │   └── utils/
│   │       ├── helpers.js        # Utility functions
│   │       └── logger.js         # Logging service
│   ├── config/
│   │   ├── networkManager.js     # Network switching
│   │   └── networks.json         # Network configs
│   ├── data/
│   │   └── name_mappings.json    # Name-to-address mapping
│   ├── logs/                     # Application logs
│   ├── package.json
│   └── .env.example
│
├── frontend/                      # Web interface
│   ├── index.html                # Main page
│   ├── register.html             # Registration page
│   ├── networks.html             # Network selector
│   └── app.js                    # Frontend logic
│
├── scripts/                       # Utility scripts
│   ├── deploy.js                 # Deployment script
│   ├── initialize.js             # Initialization
│   ├── test-integration.js       # Integration tests
│   └── package.json
│
├── docs/                         # Documentation
│   ├── API.md                    # API reference
│   ├── ARCHITECTURE_DIAGRAMS.md  # System diagrams
│   ├── DEPLOYMENT.md             # Deploy guide
│   ├── GETTING_STARTED.md        # Setup guide
│   └── ROADMAP.md                # Future plans
│
├── test-contract.js              # Contract testing
├── fund-account.js               # Account funding
├── TESTING_GUIDE.md              # Test documentation
├── REFLECTION.md                 # Project reflection
├── PROJECT_SUMMARY.md            # Project overview
├── .gitignore
└── README.md                     # This file
```

## 🔒 Security Considerations

### Implemented Security Measures

- ✅ **Environment Variables**: All sensitive data stored in `.env`
- ✅ **Phone Number Hashing**: SHA-256 hashing before blockchain storage
- ✅ **Private Key Management**: Never logged or exposed in responses
- ✅ **Rate Limiting**: 100 requests per 15 minutes per IP
- ✅ **Webhook Verification**: Validates Twilio request signatures
- ✅ **CORS Protection**: Configured origin restrictions
- ✅ **Helmet.js**: Security headers enabled
- ✅ **Input Validation**: Sanitizes all user inputs
- ✅ **Git Security**: `.env` in `.gitignore`, never committed

### Security Best Practices

**For Development:**
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use strong JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Rotate keys regularly
# Keep ngrok URLs temporary
```

**For Production:**
```bash
# Use environment variables, not .env file
export TWILIO_AUTH_TOKEN=xxx

# Enable HTTPS only
# Use secrets manager (AWS Secrets Manager, Azure Key Vault)
# Implement additional authentication
# Enable transaction limits
# Add 2FA for critical operations
```

### Known Limitations (Testnet Only)

⚠️ **This is a TESTNET implementation**

Before mainnet deployment:
- [ ] Security audit required
- [ ] Multi-signature wallet implementation
- [ ] Transaction amount limits
- [ ] User authentication beyond phone
- [ ] Backup and recovery mechanisms
- [ ] Insurance fund for lost transactions
- [ ] Legal compliance review

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: What is Flux?**
A: Flux is a WhatsApp bot that lets you send cryptocurrency using just phone numbers, no wallet addresses needed.

**Q: Is this free to use?**
A: Yes, on testnet. You'll pay network gas fees (~$0.01-0.05) on mainnet.

**Q: Which blockchains are supported?**
A: Currently Aptos and Movement networks. More chains planned.

**Q: Do I need a crypto wallet?**
A: The system manages wallets for you. Advanced users can connect existing wallets.

### Setup Questions

**Q: I can't install Aptos CLI, what do I do?**
A: Try using Docker: `docker pull aptoslabs/tools:latest`

**Q: Where do I get testnet tokens?**
A: Use the faucet: https://aptoslabs.com/testnet-faucet

**Q: My ngrok URL keeps changing, is that normal?**
A: Yes, free ngrok gives random URLs. Upgrade for permanent URLs or deploy to cloud.

**Q: How do I know my contract deployed successfully?**
A: Check explorer: https://explorer.aptoslabs.com/account/YOUR_ADDRESS?network=testnet

### Usage Questions

**Q: Can I send to any phone number?**
A: No, recipient must register first with REGISTER command.

**Q: What's the minimum amount I can send?**
A: 0.001 APT (may vary by network)

**Q: How long do transactions take?**
A: 2-5 seconds on average.

**Q: Can I cancel a transaction?**
A: No, blockchain transactions are irreversible.

### Error Solutions

**Q: "Contract not found" error?**
```bash
# Check contract address in .env matches deployed address
aptos account list --account default
# Copy address to .env CONTRACT_ADDRESS
```

**Q: "Twilio authentication failed"?**
```bash
# Verify credentials are correct
# No extra spaces in .env file
# Auth token not expired
```

**Q: "Webhook not receiving messages"?**
```bash
# 1. Check server is running (port 3000)
# 2. Check ngrok is running
# 3. Verify webhook URL in Twilio matches ngrok URL exactly
# 4. Check server logs: tail -f backend/logs/combined*.log
```

**Q: "Insufficient funds" but I have balance?**
A: You need gas fees too. Keep at least 0.1 APT for gas.

### Development Questions

**Q: Can I use this in production?**
A: Not yet. Requires security audit and additional features.

**Q: How do I add a new blockchain?**
A: Edit `backend/config/networks.json` and add network configuration.

**Q: Can I modify the smart contract?**
A: Yes! Edit `contracts/sources/phone_registry.move` and redeploy.

**Q: How do I debug webhook issues?**
A: Check logs in `backend/logs/` or add console.log in `server.js`

## 🚀 Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for detailed development phases.

**Planned Features:**
- Multi-currency support (BTC, ETH, USDC)
- Transaction history and receipts
- Recurring payments and subscriptions
- Payment requests and invoices
- Group payments and bill splitting
- Native mobile app
- Hardware wallet integration
- DeFi features (staking, lending)

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Server Won't Start

**Problem:** `Error: Cannot find module 'express'`
```bash
# Solution: Install dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Problem:** `Port 3000 already in use`
```bash
# Solution: Change port or kill process
# Option 1: Change PORT in .env
PORT=3001

# Option 2: Kill process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Kill process (Mac/Linux)
lsof -ti:3000 | xargs kill -9
```

#### 2. Contract Deployment Issues

**Problem:** `Account does not exist`
```bash
# Solution: Fund account first
aptos account fund-with-faucet --account default
```

**Problem:** `Module verification failed`
```bash
# Solution: Clean and recompile
cd contracts
rm -rf build/
aptos move compile --named-addresses ChatterPay=default
aptos move publish --named-addresses ChatterPay=default
```

#### 3. Twilio/WhatsApp Issues

**Problem:** Bot doesn't respond
```bash
# Checklist:
1. ✅ Server running?
2. ✅ ngrok running?
3. ✅ Webhook URL updated in Twilio?
4. ✅ Phone joined sandbox?
5. ✅ Check logs: tail -f backend/logs/combined*.log
```

**Problem:** "Invalid webhook URL"
```bash
# Ensure webhook URL:
- Uses HTTPS (ngrok provides this)
- Ends with /webhook
- Example: https://abc123.ngrok.io/webhook
```

#### 4. Transaction Failures

**Problem:** "Insufficient funds for gas"
```bash
# Get more testnet tokens
aptos account fund-with-faucet --account default
```

**Problem:** "Recipient not found"
```bash
# Recipient must register first
# Ask them to send: REGISTER
```

### Debug Mode

Enable verbose logging:

```bash
# In .env file
LOG_LEVEL=debug

# Restart server
npm start

# Watch logs
tail -f logs/combined*.log
```

### Getting Help

1. **Check Logs:** `backend/logs/error-*.log`
2. **Review Documentation:** See `docs/` folder
3. **Test API:** Use Postman/curl to test endpoints
4. **Check Network:** Verify blockchain network is operational
5. **GitHub Issues:** https://github.com/Shivanikinagi/Flux/issues

## 📚 Additional Resources

### Official Documentation
- [Aptos Documentation](https://aptos.dev/)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Move Language](https://move-language.github.io/move/)
- [Express.js Guide](https://expressjs.com/)

### Useful Links
- [Aptos Testnet Faucet](https://aptoslabs.com/testnet-faucet)
- [Aptos Explorer](https://explorer.aptoslabs.com/)
- [Twilio Console](https://console.twilio.com/)
- [ngrok Documentation](https://ngrok.com/docs)

### Related Projects
- See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for project overview
- See [REFLECTION.md](REFLECTION.md) for development insights
- See [TESTING_GUIDE.md](TESTING_GUIDE.md) for test documentation

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2026 Flux Contributors

## 👥 Team & Contact

**Project:** Flux (ChatterPay)
**Repository:** https://github.com/Shivanikinagi/Flux
**Issues:** https://github.com/Shivanikinagi/Flux/issues

### Support
- 📧 Email: Open an issue for support
- 💬 Discord: Coming soon
- 🐦 Twitter: Coming soon

## 🙏 Acknowledgments

- **Aptos Foundation** - Blockchain infrastructure
- **Movement Labs** - Network support
- **Twilio** - WhatsApp API
- **Open Source Community** - Various libraries and tools

---

**⭐ If you find this project useful, please star it on GitHub!**

Built with ❤️ using Aptos, Movement Network, and Twilio

*Last Updated: January 4, 2026*
