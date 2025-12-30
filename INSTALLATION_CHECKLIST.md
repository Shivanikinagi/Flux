# Flux - Installation Checklist

Use this checklist to ensure you've completed all setup steps correctly.

## Pre-Installation

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Text editor ready (VS Code, Sublime, etc.)
- [ ] Terminal/Command Prompt access

## Movement Network Setup

- [ ] Movement CLI installed
- [ ] Movement CLI in PATH (`movement --version`)
- [ ] Movement account created (`movement init`)
- [ ] Account funded with testnet tokens
- [ ] Account balance verified (`movement account balance`)
- [ ] Private key saved securely
- [ ] Account address noted

## Twilio Account Setup

- [ ] Twilio account created
- [ ] Email verified
- [ ] Phone number verified
- [ ] Account SID copied
- [ ] Auth Token copied
- [ ] WhatsApp sandbox activated
- [ ] Sandbox phone number noted
- [ ] Sandbox join code noted

## Project Setup

- [ ] Repository cloned/downloaded
- [ ] Changed to project directory
- [ ] Backend dependencies installed (`npm install`)
- [ ] Scripts dependencies installed
- [ ] `.env` file created from `.env.example`
- [ ] No errors in installation

## Smart Contract Deployment

- [ ] Contracts compiled successfully
- [ ] All tests passed (8/8)
- [ ] Contract published to testnet
- [ ] Contract address copied
- [ ] Deployment info saved
- [ ] No compilation errors

## Environment Configuration

- [ ] `CONTRACT_ADDRESS` set in `.env`
- [ ] `SERVER_PRIVATE_KEY` set in `.env`
- [ ] `MOVEMENT_NODE_URL` configured
- [ ] `TWILIO_ACCOUNT_SID` set
- [ ] `TWILIO_AUTH_TOKEN` set
- [ ] `TWILIO_PHONE_NUMBER` set
- [ ] `PORT` configured (default: 3000)

## Contract Initialization

- [ ] Initialization script run
- [ ] Registry initialized successfully
- [ ] Transaction confirmed on-chain
- [ ] Initialization info saved
- [ ] Admin address verified

## Backend Server

- [ ] Server starts without errors
- [ ] Server running on correct port
- [ ] Health check endpoint works (`GET /`)
- [ ] API endpoints accessible
- [ ] Logs directory created
- [ ] Winston logger working

## Webhook Setup

- [ ] ngrok installed
- [ ] ngrok account created (if needed)
- [ ] ngrok started (`ngrok http 3000`)
- [ ] HTTPS URL copied
- [ ] Twilio webhook URL updated
- [ ] Webhook URL saved (changes on restart)

## Twilio WhatsApp Configuration

- [ ] Webhook URL configured in Twilio
- [ ] Webhook method set to POST
- [ ] Status callback configured
- [ ] Webhook saves successfully
- [ ] No validation errors

## Testing - Basic Functionality

- [ ] Server health check passes
- [ ] WhatsApp sandbox joined
- [ ] `HELP` command works
- [ ] Response received within 5 seconds
- [ ] Commands listed correctly

## Testing - Registration

- [ ] Registration API endpoint works
- [ ] Phone number format validated
- [ ] Transaction submitted successfully
- [ ] Transaction confirmed on-chain
- [ ] Response contains transaction hash
- [ ] `STATUS` command shows "Active"

## Testing - Balance Check

- [ ] Balance API endpoint works
- [ ] Balance returned in octas
- [ ] Balance formatted correctly
- [ ] `BALANCE` command via WhatsApp works
- [ ] Balance matches blockchain

## Testing - Payment

- [ ] Second test account created
- [ ] Second phone registered
- [ ] Payment API works
- [ ] Recipient validation works
- [ ] Transaction confirmed
- [ ] Balances updated correctly
- [ ] Both parties notified

## Error Handling

- [ ] Invalid phone format rejected
- [ ] Invalid amount rejected
- [ ] Unregistered recipient rejected
- [ ] Insufficient balance handled
- [ ] Self-transfer prevented
- [ ] Error messages clear

## Security Checks

- [ ] Private keys not in git
- [ ] `.env` in `.gitignore`
- [ ] Rate limiting works
- [ ] CORS configured
- [ ] Helmet headers present
- [ ] Phone numbers hashed
- [ ] Input validation works

## Documentation Review

- [ ] README.md read
- [ ] GETTING_STARTED.md reviewed
- [ ] API.md understood
- [ ] DEPLOYMENT.md saved for later
- [ ] ROADMAP.md reviewed
- [ ] QUICK_REFERENCE.md bookmarked

## Optional Enhancements

- [ ] PM2 installed for production
- [ ] Nginx configured (production)
- [ ] SSL certificate obtained
- [ ] Domain name configured
- [ ] Monitoring setup
- [ ] Backup strategy planned

## Troubleshooting Verification

If any issues occurred:

- [ ] Error messages documented
- [ ] Logs checked (`logs/combined.log`)
- [ ] Blockchain transactions verified
- [ ] Twilio webhook logs checked
- [ ] Network connectivity verified
- [ ] Dependencies versions checked

## Final Verification

- [ ] Complete user flow tested:
  1. [ ] User joins WhatsApp sandbox
  2. [ ] User sends HELP command
  3. [ ] User registers via API
  4. [ ] User checks status (Active)
  5. [ ] User checks balance
  6. [ ] User sends payment
  7. [ ] Payment confirmed
  8. [ ] Both parties notified

- [ ] All API endpoints tested:
  - [ ] `GET /`
  - [ ] `GET /health`
  - [ ] `POST /api/register`
  - [ ] `POST /api/send`
  - [ ] `GET /api/check-registration/:phone`
  - [ ] `GET /api/balance/:address`
  - [ ] `GET /api/transactions/:address`

- [ ] All WhatsApp commands tested:
  - [ ] HELP
  - [ ] REGISTER
  - [ ] BALANCE
  - [ ] PAY
  - [ ] STATUS

## Post-Installation

- [ ] Installation notes saved
- [ ] Contract address documented
- [ ] Webhook URL saved
- [ ] Test accounts documented
- [ ] Admin credentials secured
- [ ] Backup plan in place

## Production Readiness (Future)

When ready for production deployment:

- [ ] Security audit completed
- [ ] Load testing done
- [ ] Mainnet contract deployed
- [ ] Production Twilio account
- [ ] Production server configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring enabled
- [ ] Backup systems ready
- [ ] Support system in place

---

## Quick Verification Script

Run these commands to verify your installation:

```bash
# 1. Check Node.js
node --version

# 2. Check Movement CLI
movement --version

# 3. Check account balance
movement account balance --account default

# 4. Check server
curl http://localhost:3000

# 5. Check registration endpoint
curl http://localhost:3000/api/check-registration/+1234567890

# 6. Send test message on WhatsApp
# Message: HELP
```

## Success Criteria

✅ You're ready to use Flux when:

1. Server starts without errors
2. Smart contract deployed and initialized
3. WhatsApp commands receive responses
4. Registration works via API
5. Payments complete successfully
6. Balances update correctly
7. All tests pass

---

## Getting Help

If you're stuck on any step:

1. **Check the documentation:**
   - [Getting Started Guide](GETTING_STARTED.md)
   - [Quick Reference](QUICK_REFERENCE.md)
   - [Troubleshooting](README.md#troubleshooting)

2. **Review logs:**
   ```bash
   tail -f backend/logs/combined.log
   ```

3. **Check Twilio webhook logs:**
   - Twilio Console → Messaging → Logs

4. **Verify blockchain transaction:**
   - Movement Network Explorer

5. **Contact support:**
   - GitHub Issues
   - Discord Community
   - Email: support@Flux.app

---

## Checklist Summary

**Total Items:** ~120+  
**Critical Items:** ~40  
**Nice-to-Have Items:** ~20  

**Minimum to Start:**
- ✅ Contract deployed
- ✅ Server running
- ✅ Twilio configured
- ✅ Registration working
- ✅ Basic commands responding

---

*Print this checklist and mark items as you complete them!*

*Last Updated: December 24, 2025*
*Version: 1.0*
