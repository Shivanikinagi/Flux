# Flux - Step by Step Setup Guide

This guide will walk you through setting up Flux from scratch.

---

## Prerequisites Installation

### 1. Install Node.js

**Windows:**
1. Download from [nodejs.org](https://nodejs.org/)
2. Run installer
3. Verify: `node --version` and `npm --version`

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Git

**Windows:** Download from [git-scm.com](https://git-scm.com/)

**macOS:** `brew install git`

**Linux:** `sudo apt-get install git`

### 3. Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for free account
3. Complete verification

---

## Project Setup

### Step 1: Clone or Download

```bash
# Option 1: Clone repository
git clone https://github.com/yourusername/Flux.git
cd Flux

# Option 2: Or use the files provided
cd whatsapp_movement
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required packages (may take a few minutes).

### Step 3: Setup Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Open `.env` in a text editor

3. We'll fill this in as we go through the setup

---

## Movement Network Setup

### Step 1: Install Movement CLI

**For Linux/macOS:**
```bash
curl -fsSL "https://raw.githubusercontent.com/movementlabsxyz/movement/main/scripts/install.sh" | bash

# Add to PATH
export PATH="$HOME/.movement/bin:$PATH"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**For Windows:**
Use WSL (Windows Subsystem for Linux) or follow Movement Network's Windows installation guide.

### Step 2: Initialize Movement Account

```bash
movement init
```

Follow the prompts:
- Choose profile name: `default`
- Select network: `testnet`
- Choose to create new account: `yes`

This creates your account and saves it in `~/.movement/config.yaml`

### Step 3: Get Your Private Key

```bash
# View your account info
movement account list

# Get private key (keep this secret!)
cat ~/.movement/config.yaml
```

Look for your private key and save it securely.

### Step 4: Fund Your Account

```bash
movement account fund --account default
```

Or visit the Movement testnet faucet website to request tokens.

Verify balance:
```bash
movement account balance --account default
```

---

## Smart Contract Deployment

### Step 1: Navigate to Contracts

```bash
cd ../contracts
```

### Step 2: Compile Contract

```bash
movement move compile
```

You should see: "BUILDING Flux"

### Step 3: Run Tests

```bash
movement move test
```

All tests should pass ✅

### Step 4: Deploy Contract

```bash
movement move publish --named-addresses Flux=default
```

When prompted:
- Confirm: `yes`

**IMPORTANT:** Copy the contract address from the output!
It looks like: `0x8541b65e57d7744df2e81ace0c3e23fe598f77063fc8d2829a62726a8a7a29df`

### Step 5: Update .env File

Edit `backend/.env`:
```env
CONTRACT_ADDRESS=0xYourContractAddressHere
SERVER_PRIVATE_KEY=0xYourPrivateKeyHere
```

---

## Twilio Setup

### Step 1: Get Twilio Credentials

1. Log into [Twilio Console](https://console.twilio.com)
2. Copy your **Account SID** and **Auth Token**
3. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**

### Step 2: WhatsApp Sandbox Setup

1. In Twilio Console, go to WhatsApp Sandbox
2. Note your sandbox number (e.g., `+1 415 523 8886`)
3. Note your sandbox code (e.g., `join abc-def`)

### Step 3: Update .env File

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

---

## Initialize the Contract

### Step 1: Run Initialization Script

```bash
cd ..
node scripts/initialize.js
```

This registers your server's address as the registry admin.

Wait for confirmation: "✅ Registry initialized successfully!"

---

## Start the Server

### Step 1: Start Backend

```bash
cd backend
npm start
```

You should see:
```
🚀 Flux server running on port 3000
📡 Network: Movement Testnet
📝 Contract: 0x...
```

### Step 2: Test the Server

Open another terminal and run:
```bash
curl http://localhost:3000
```

You should get a JSON response showing the server is online.

---

## Setup Webhook

### Step 1: Install ngrok

Download from [ngrok.com](https://ngrok.com/)

**Windows:** Extract and run `ngrok.exe`

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
snap install ngrok
```

### Step 2: Start ngrok

In a new terminal:
```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL!**

### Step 3: Configure Twilio Webhook

1. Go to Twilio Console
2. Navigate to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
3. Set **When a message comes in**: `https://your-ngrok-url.ngrok.io/webhook`
4. **Save**

---

## Test the System

### Step 1: Join WhatsApp Sandbox

1. Open WhatsApp on your phone
2. Add the Twilio sandbox number as a contact
3. Send the join code (e.g., `join abc-def`)

You should get a confirmation message.

### Step 2: Test Commands

Send these messages to test:

**Test HELP:**
```
HELP
```

You should receive a list of commands.

**Test STATUS:**
```
STATUS
```

Should show "Not Registered" initially.

### Step 3: Register via API

In a terminal:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0xYourPrivateKey",
    "phone": "+YourPhoneNumber"
  }'
```

Replace:
- `0xYourPrivateKey` with your actual private key
- `+YourPhoneNumber` with your phone (include country code)

### Step 4: Check Registration

Send via WhatsApp:
```
STATUS
```

Should now show "Account Status: Active" ✅

### Step 5: Test Balance

```
BALANCE
```

Should show your account balance.

---

## Register a Second User (for Testing)

### Step 1: Create Second Account

```bash
movement account create --account test-user
movement account fund --account test-user
```

### Step 2: Register Second Phone

Use a friend's phone or another number:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0xSecondUserPrivateKey",
    "phone": "+SecondPhoneNumber"
  }'
```

### Step 3: Test Payment

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0xYourPrivateKey",
    "recipientPhone": "+SecondPhoneNumber",
    "amount": "0.01"
  }'
```

Check both balances to confirm the transfer!

---

## Common Issues & Solutions

### Issue: "CONTRACT_ADDRESS not set"
**Solution:** Make sure you updated `.env` with your deployed contract address

### Issue: "Twilio not configured"
**Solution:** Double-check your Twilio credentials in `.env`

### Issue: "ngrok not working"
**Solution:**
- Ensure ngrok is running
- Use the HTTPS URL (not HTTP)
- Update Twilio webhook with new URL if ngrok restarts

### Issue: "Transaction failed"
**Solution:**
- Check you have sufficient balance
- Verify contract address is correct
- Check server logs for details

### Issue: "Phone not registered"
**Solution:**
- Make sure registration was successful
- Check phone number format (+1234567890)
- Verify on-chain with STATUS command

---

## Next Steps

1. **Read the Documentation:**
   - [API Documentation](API.md)
   - [Deployment Guide](DEPLOYMENT.md)
   - [Roadmap](ROADMAP.md)

2. **Explore the Code:**
   - Smart contracts in `contracts/sources/`
   - Backend services in `backend/src/`
   - Scripts in `scripts/`

3. **Customize:**
   - Add new WhatsApp commands
   - Implement additional features
   - Create a web dashboard

4. **Deploy to Production:**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Get Twilio production access
   - Deploy to a VPS or cloud provider

---

## Getting Help

If you run into issues:

1. **Check the logs:**
   ```bash
   cd backend
   cat logs/combined.log
   ```

2. **Check GitHub Issues**

3. **Join our Discord** (link)

4. **Email:** support@Flux.app

---

## Summary Checklist

- [ ] Node.js installed
- [ ] Movement CLI installed
- [ ] Movement account funded
- [ ] Smart contract deployed
- [ ] Contract initialized
- [ ] Twilio account created
- [ ] WhatsApp sandbox configured
- [ ] Backend .env configured
- [ ] Server running
- [ ] ngrok running
- [ ] Webhook configured
- [ ] Tested registration
- [ ] Tested payment

---

**Congratulations! 🎉**

You now have a fully functional Flux system running locally!

*Last Updated: December 24, 2025*
