const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const movementService = require('./movementService');
const twilioService = require('./twilioService');
const nameMappingService = require('./nameMappingService');
const networkManager = require('../config/networkManager');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static('../frontend'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  const networkInfo = networkManager.getNetworkInfo();
  res.json({
    status: 'online',
    service: 'ChatterPay API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: networkInfo.name,
    chainId: networkInfo.chainId,
    currency: networkInfo.currency,
  });
});

app.get('/health', (req, res) => {
  const networkInfo = networkManager.getNetworkInfo();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    network: networkInfo,
  });
});

// API Routes
const apiRouter = express.Router();

// Network management endpoints
apiRouter.get('/networks', (req, res) => {
  try {
    const networks = networkManager.getAllNetworks();
    res.json({
      success: true,
      networks,
      active: networkManager.getActiveNetwork().key
    });
  } catch (error) {
    logger.error('Error fetching networks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/networks/active', (req, res) => {
  try {
    const network = networkManager.getActiveNetwork();
    res.json({
      success: true,
      network
    });
  } catch (error) {
    logger.error('Error fetching active network:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/networks/switch', (req, res) => {
  try {
    const { networkKey } = req.body;
    
    if (!networkKey) {
      return res.status(400).json({
        success: false,
        error: 'networkKey is required'
      });
    }

    const network = networkManager.switchNetwork(networkKey);
    
    // Update movement service with new network URL
    process.env.MOVEMENT_RPC_URL = network.rpcUrl;
    
    res.json({
      success: true,
      message: `Switched to ${network.name}`,
      network
    });
  } catch (error) {
    logger.error('Error switching network:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all registered users
apiRouter.get('/users', async (req, res) => {
  try {
    const users = await nameMappingService.getAllMappings();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users',
    });
  }
});

// Generate new wallet
apiRouter.post('/generate-wallet', async (req, res) => {
  try {
    const wallet = await movementService.generateNewWallet();
    
    res.json({
      success: true,
      address: wallet.address,
      privateKey: wallet.privateKey,
      message: 'Wallet generated successfully. Keep your private key safe!',
    });
  } catch (error) {
    logger.error('Wallet generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Wallet generation failed',
    });
  }
});

// Fund account via faucet
apiRouter.post('/fund-account', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: address',
      });
    }

    logger.info(`Funding account: ${address}`);

    const result = await movementService.fundAccount(address);

    res.json({
      success: true,
      message: 'Account funded successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Funding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Funding failed',
    });
  }
});

// Register phone number
apiRouter.post('/register', async (req, res) => {
  try {
    const { privateKey, phone, name, address } = req.body;

    if (!privateKey || !phone || !name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: privateKey, phone, name, address',
      });
    }

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use E.164 format: +1234567890',
      });
    }

    // Validate name
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Name must be between 2 and 50 characters',
      });
    }

    logger.info(`Registration request for phone: ${phone}, name: ${name}, address: ${address}`);

    // Try to register on blockchain (will use update if already registered)
    let result;
    try {
      result = await movementService.registerPhone(privateKey, phone, name);
    } catch (error) {
      // If already registered, try updating instead
      if (error.message && error.message.includes('PHONE_ALREADY_REGISTERED')) {
        logger.info(`Phone already registered, updating instead`);
        result = await movementService.updatePhone(privateKey, phone, name);
      } else {
        throw error;
      }
    }

    // Store name mapping WITH private key
    await nameMappingService.saveMapping(name, phone, address, privateKey);
    logger.info(`Name mapping saved: ${name} -> ${phone} -> ${address} (with private key)`);

    res.json({
      success: true,
      message: 'Phone number registered successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

// Send payment to phone number
apiRouter.post('/send', async (req, res) => {
  try {
    const { privateKeyHex, recipientPhone, amount } = req.body;

    if (!privateKeyHex || !recipientPhone || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: privateKeyHex, recipientPhone, amount',
      });
    }

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(recipientPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use E.164 format: +1234567890',
      });
    }

    // Validate amount
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be a positive number',
      });
    }

    logger.info(`Payment request: ${amount} to ${recipientPhone}`);

    const result = await movementService.sendPaymentToPhone(
      privateKeyHex,
      recipientPhone,
      amount
    );

    res.json({
      success: true,
      message: 'Payment sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment failed',
    });
  }
});

// Check if phone is registered
apiRouter.get('/check-registration/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const isRegistered = await movementService.isPhoneRegistered(phone);

    res.json({
      success: true,
      phone: phone,
      isRegistered: isRegistered,
    });
  } catch (error) {
    logger.error('Check registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Check failed',
    });
  }
});

// Get account balance
apiRouter.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const balance = await movementService.getBalance(address);

    res.json({
      success: true,
      address: address,
      balance: balance,
      balanceFormatted: `${balance / 100000000} APT`,
    });
  } catch (error) {
    logger.error('Balance check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Balance check failed',
    });
  }
});

// Get transaction history
apiRouter.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const transactions = await movementService.getTransactionHistory(address);

    res.json({
      success: true,
      address: address,
      transactions: transactions,
    });
  } catch (error) {
    logger.error('Transaction history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction history',
    });
  }
});

app.use('/api', apiRouter);

// WhatsApp webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    logger.info('Webhook received', { body: req.body });

    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.status(400).send('Invalid webhook data');
    }

    // Process WhatsApp message
    await twilioService.handleIncomingMessage(From, Body);

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Twilio status callback endpoint
app.post('/status', (req, res) => {
  logger.info('Status callback received', { body: req.body });
  res.status(200).send('OK');
});

// Test Twilio connection
app.get('/test-twilio', async (req, res) => {
  try {
    const result = await twilioService.sendMessage(
      process.env.TWILIO_PHONE_NUMBER,
      'Test message from ChatterPay!'
    );

    res.json({
      success: true,
      message: 'Test message sent',
      sid: result,
    });
  } catch (error) {
    logger.error('Twilio test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test Twilio endpoint to check if limits reset
app.post('/api/test-twilio', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    // Send test message via Twilio
    const result = await twilioService.sendMessage(to, message);
    
    res.json({
      success: true,
      sid: result.sid,
      status: result.status,
      message: 'Twilio is working! Daily limit has reset.'
    });
  } catch (error) {
    logger.error('Twilio test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 ChatterPay server running on port ${PORT}`);
  logger.info(`📡 Network: Movement Testnet`);
  logger.info(`📝 Contract: ${process.env.CONTRACT_ADDRESS || 'Not configured'}`);
  logger.info(`📱 Twilio: ${process.env.TWILIO_PHONE_NUMBER || 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
