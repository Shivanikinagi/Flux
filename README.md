# Flux: WhatsApp-based Crypto Payments on Movement Network

![Flux Banner](https://via.placeholder.com/1200x300/4A90E2/FFFFFF?text=Flux+%7C+WhatsApp+Crypto+Payments)

## 📱 Overview

Flux is a WhatsApp-based cryptocurrency payment system built on the **Movement Network**. It enables users to send and receive MOVE tokens using simple WhatsApp commands, without needing to know blockchain addresses.

### Key Features:

- 💬 Send crypto payments via WhatsApp messages
- 📞 Register phone numbers to blockchain addresses
- 🔐 Secure phone number hashing for privacy
- 🌐 RESTful API for programmatic integration
- ⚡ Real-time transaction confirmations
- 🔒 Privacy-focused phone-to-address mapping

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
                                            │  Movement Network │
                                            │  Smart Contract   │
                                            └──────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Movement CLI installed and configured
- Twilio account with WhatsApp sandbox
- Movement testnet account with MOVE tokens
- ngrok (for local webhook testing)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/Flux.git
cd Flux
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Movement CLI**

```bash
# For Linux/macOS
curl -fsSL "https://raw.githubusercontent.com/movementlabsxyz/movement/main/scripts/install.sh" | bash

# For Windows (via WSL or PowerShell)
# Follow Movement Network documentation
```

4. **Environment Setup**

Create a `.env` file in the backend directory:

```bash
# Movement Network Configuration
MOVEMENT_NODE_URL=https://testnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0x_your_deployed_contract_address
SERVER_PRIVATE_KEY=your_server_private_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🔑 Twilio WhatsApp Setup

1. **Create Twilio Account**
   - Sign up at [Twilio Console](https://console.twilio.com/)
   - Navigate to "Messaging" → "Try it out" → "Send a WhatsApp message"

2. **WhatsApp Sandbox Setup**
   - Get your sandbox WhatsApp number
   - Configure webhook URL: `https://your-domain.com/webhook`
   - For local development, use ngrok: `ngrok http 3000`

3. **Get Twilio Credentials**
   - Account SID and Auth Token from Twilio Console Dashboard
   - WhatsApp sandbox phone number

## 🚀 Smart Contract Deployment

1. **Setup Movement Account**

```bash
movement init
# Select testnet when prompted
```

2. **Fund Your Account**

```bash
movement account fund --account default
```

3. **Deploy the Contract**

```bash
cd contracts

# Compile the contract
movement move compile

# Test the contract
movement move test

# Deploy to testnet
movement move publish --named-addresses Flux=default
```

4. **Update Configuration**

After deployment, update the `CONTRACT_ADDRESS` in your `.env` file.

## 🏃‍♂️ Running the Application

### Start the Backend Server

```bash
cd backend
npm start
```

The server will start on `http://localhost:3000`

### Setup Local Webhook (Development)

```bash
# In a new terminal
ngrok http 3000

# Copy the https URL and configure it in Twilio Console
# Webhook URL: https://your-ngrok-url.ngrok.io/webhook
```

## 📱 Using Flux via WhatsApp

1. **Join Twilio WhatsApp Sandbox**
   - Send the join code to your Twilio WhatsApp number
   - Example: Send "join [your-code]" to `+1 415 523 8886`

2. **Register Your Phone Number**
   ```
   REGISTER
   ```

3. **Send Payments via WhatsApp**
   ```
   PAY +1234567890 0.01
   ```

4. **Check Balance**
   ```
   BALANCE
   ```

5. **Get Help**
   ```
   HELP
   ```

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
├── contracts/              # Move smart contracts
│   ├── sources/
│   │   ├── phone_registry.move
│   │   └── payment_system.move
│   ├── tests/
│   │   └── tests.move
│   ├── Move.toml
│   └── README.md
├── backend/               # Node.js/Express server
│   ├── src/
│   │   ├── server.js
│   │   ├── movementService.js
│   │   ├── twilioService.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── scripts/              # Deployment and utility scripts
│   ├── deploy.js
│   ├── initialize.js
│   └── test-integration.js
├── docs/                 # Documentation
│   ├── ROADMAP.md
│   ├── API.md
│   └── ARCHITECTURE.md
├── .gitignore
└── README.md
```

## 🔒 Security Considerations

- ✅ Private keys never committed to version control
- ✅ Phone numbers hashed before storage
- ✅ Environment variables for sensitive data
- ✅ Rate limiting on API endpoints
- ✅ Webhook signature verification
- ⚠️ Testnet only - additional security needed for mainnet

## 🚀 Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for detailed development phases.

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using Movement Network and Twilio
