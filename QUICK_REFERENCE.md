# Flux - Quick Reference

## 🚀 Quick Commands

### Setup & Deployment
```bash
# Install dependencies
cd backend && npm install

# Deploy contract
cd ../contracts
movement move compile
movement move test
movement move publish --named-addresses Flux=default

# Initialize registry
cd ..
node scripts/initialize.js

# Start server
cd backend
npm start

# Setup webhook (new terminal)
ngrok http 3000
```

### Testing
```bash
# Test smart contracts
movement move test

# Test integration
node scripts/test-integration.js

# Test API
curl http://localhost:3000
curl http://localhost:3000/api/check-registration/+1234567890
```

---

## 📱 WhatsApp Commands

| Command | Description | Example |
|---------|-------------|---------|
| `HELP` | Show all commands | `HELP` |
| `REGISTER` | Register phone number | `REGISTER` |
| `BALANCE` | Check account balance | `BALANCE` |
| `PAY` | Send payment | `PAY +1234567890 0.01` |
| `STATUS` | Check account status | `STATUS` |

---

## 🔌 API Endpoints

### Register Phone
```bash
POST /api/register
Content-Type: application/json

{
  "privateKeyHex": "0x...",
  "phone": "+1234567890"
}
```

### Send Payment
```bash
POST /api/send
Content-Type: application/json

{
  "privateKeyHex": "0x...",
  "recipientPhone": "+0987654321",
  "amount": "0.01"
}
```

### Check Registration
```bash
GET /api/check-registration/:phone
```

### Get Balance
```bash
GET /api/balance/:address
```

### Get Transactions
```bash
GET /api/transactions/:address
```

---

## 🔧 Environment Variables

```env
# Movement Network
MOVEMENT_NODE_URL=https://testnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0x...
SERVER_PRIVATE_KEY=0x...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Server
PORT=3000
NODE_ENV=development
```

---

## 📂 Project Structure

```
whatsapp_movement/
├── contracts/              # Smart contracts
│   ├── sources/
│   │   └── phone_registry.move
│   ├── tests/
│   │   └── phone_registry_tests.move
│   └── Move.toml
├── backend/               # Backend server
│   ├── src/
│   │   ├── server.js
│   │   ├── movementService.js
│   │   ├── twilioService.js
│   │   └── utils/
│   ├── package.json
│   └── .env
├── scripts/              # Deployment scripts
│   ├── deploy.js
│   ├── initialize.js
│   └── test-integration.js
└── docs/                 # Documentation
    ├── API.md
    ├── ROADMAP.md
    ├── DEPLOYMENT.md
    └── GETTING_STARTED.md
```

---

## ⚠️ Common Issues

### Contract not initialized
```bash
node scripts/initialize.js
```

### Webhook not working
```bash
# Restart ngrok and update Twilio webhook URL
ngrok http 3000
```

### Transaction failed
```bash
# Check balance
movement account balance --account default

# Fund account
movement account fund --account default
```

### Phone not registered
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"privateKeyHex":"0x...","phone":"+1234567890"}'
```

---

## 📊 Gas Costs

| Operation | Estimated Gas |
|-----------|---------------|
| Initialize | ~500 units |
| Register | ~200 units |
| Send Payment | ~300 units |
| Update Phone | ~250 units |
| Unregister | ~150 units |

---

## 🔐 Security Checklist

- [x] Phone numbers hashed (SHA-256)
- [x] Rate limiting enabled
- [x] Input validation
- [x] HTTPS for production
- [ ] External security audit
- [ ] Key management system
- [ ] 2FA implementation

---

## 📚 Documentation Links

- [Getting Started](docs/GETTING_STARTED.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Full Roadmap](docs/ROADMAP.md)
- [Contract Details](contracts/README.md)
- [Project Summary](PROJECT_SUMMARY.md)

---

## 🆘 Emergency Contacts

- **GitHub Issues:** [Repository Issues]
- **Email:** support@Flux.app
- **Discord:** [Community Server]

---

## 💡 Quick Tips

1. **Always use testnet first**
   ```bash
   MOVEMENT_NODE_URL=https://testnet.movementnetwork.xyz/v1
   ```

2. **Keep private keys secure**
   - Never commit to git
   - Use environment variables
   - Encrypt in production

3. **Monitor gas costs**
   ```bash
   movement account balance --account default
   ```

4. **Test thoroughly**
   ```bash
   movement move test --verbose
   ```

5. **Check logs regularly**
   ```bash
   tail -f backend/logs/combined.log
   ```

---

*Quick Reference Guide v1.0 - December 24, 2025*
