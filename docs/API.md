# ChatterPay API Documentation

## Base URL
```
http://localhost:3000
https://api.chatterpay.app (Production)
```

## Authentication
Currently, the API uses private key authentication. In production, implement OAuth 2.0 or JWT tokens.

---

## Endpoints

### Health Check

#### `GET /`
Check if the server is running.

**Response:**
```json
{
  "status": "online",
  "service": "ChatterPay API",
  "version": "1.0.0",
  "timestamp": "2025-12-24T10:30:00.000Z",
  "network": "Movement Testnet"
}
```

---

### Register Phone Number

#### `POST /api/register`
Register a phone number to a blockchain address.

**Request Body:**
```json
{
  "privateKeyHex": "0xabc123...",
  "phone": "+1234567890"
}
```

**Parameters:**
- `privateKeyHex` (string, required): User's private key in hex format
- `phone` (string, required): Phone number in E.164 format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phone number registered successfully",
  "data": {
    "transactionHash": "0xdef456...",
    "address": "0x789abc...",
    "phoneHash": "a1b2c3..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid phone number format. Use E.164 format: +1234567890"
}
```

---

### Send Payment

#### `POST /api/send`
Send payment to a registered phone number.

**Request Body:**
```json
{
  "privateKeyHex": "0xabc123...",
  "recipientPhone": "+0987654321",
  "amount": "0.01"
}
```

**Parameters:**
- `privateKeyHex` (string, required): Sender's private key
- `recipientPhone` (string, required): Recipient's phone number
- `amount` (string, required): Amount in APT

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment sent successfully",
  "data": {
    "transactionHash": "0xghi789...",
    "sender": "0xjkl012...",
    "recipientPhone": "+0987654321",
    "amount": "0.01",
    "amountInOctas": 1000000
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Recipient phone number is not registered"
}
```

---

### Check Registration

#### `GET /api/check-registration/:phone`
Check if a phone number is registered.

**Parameters:**
- `phone` (string, required): Phone number to check

**Example:**
```
GET /api/check-registration/+1234567890
```

**Success Response (200):**
```json
{
  "success": true,
  "phone": "+1234567890",
  "isRegistered": true
}
```

---

### Get Balance

#### `GET /api/balance/:address`
Get account balance for an address.

**Parameters:**
- `address` (string, required): Blockchain address

**Example:**
```
GET /api/balance/0x789abc...
```

**Success Response (200):**
```json
{
  "success": true,
  "address": "0x789abc...",
  "balance": 100000000,
  "balanceFormatted": "1.00000000 APT"
}
```

---

### Get Transaction History

#### `GET /api/transactions/:address`
Get transaction count for an address.

**Parameters:**
- `address` (string, required): Blockchain address

**Example:**
```
GET /api/transactions/0x789abc...
```

**Success Response (200):**
```json
{
  "success": true,
  "address": "0x789abc...",
  "transactions": {
    "sent": 5,
    "received": 3
  }
}
```

---

## WhatsApp Integration

### Webhook Endpoint

#### `POST /webhook`
Receives WhatsApp messages from Twilio.

**Note:** This endpoint is called by Twilio and should not be called directly.

---

## WhatsApp Commands

### Available Commands

#### `HELP`
Display available commands.

**Response:**
```
🌟 ChatterPay Commands

📱 REGISTER - Register your phone
💰 BALANCE - Check your balance
💸 PAY <phone> <amount> - Send payment
📊 STATUS - Check status
❓ HELP - Show this message
```

#### `REGISTER`
Start the registration process.

#### `BALANCE`
Check your account balance.

**Response:**
```
💰 Your Balance

Balance: 1.50000000 APT
Address: 0x789abc...

📊 Transactions:
• Sent: 5
• Received: 3
```

#### `PAY <phone> <amount>`
Send payment to a phone number.

**Example:**
```
PAY +1234567890 0.01
```

**Response:**
```
⏳ Processing payment...
```

#### `STATUS`
Check your registration and account status.

**Response:**
```
✅ Account Status: Active

Phone: +1234567890
Address: 0x789abc...def
Balance: 1.50000000 APT
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input |
| 404  | Not Found - Resource doesn't exist |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response:** 429 Too Many Requests

---

## Data Formats

### Phone Numbers
Use E.164 format: `+[country code][number]`

**Examples:**
- US: `+1234567890`
- UK: `+441234567890`
- India: `+911234567890`

### Amounts
- Format: Decimal string
- Unit: APT
- Examples: `"0.01"`, `"1.5"`, `"100"`

### Addresses
- Format: Hex string with 0x prefix
- Length: 66 characters (0x + 64 hex digits)
- Example: `"0x789abc...def012"`

---

## Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Register phone
async function registerPhone() {
  const response = await axios.post('http://localhost:3000/api/register', {
    privateKeyHex: '0xYourPrivateKey',
    phone: '+1234567890'
  });
  console.log(response.data);
}

// Send payment
async function sendPayment() {
  const response = await axios.post('http://localhost:3000/api/send', {
    privateKeyHex: '0xYourPrivateKey',
    recipientPhone: '+0987654321',
    amount: '0.01'
  });
  console.log(response.data);
}
```

### Python

```python
import requests

# Register phone
def register_phone():
    response = requests.post('http://localhost:3000/api/register', json={
        'privateKeyHex': '0xYourPrivateKey',
        'phone': '+1234567890'
    })
    print(response.json())

# Send payment
def send_payment():
    response = requests.post('http://localhost:3000/api/send', json={
        'privateKeyHex': '0xYourPrivateKey',
        'recipientPhone': '+0987654321',
        'amount': '0.01'
    })
    print(response.json())
```

### cURL

```bash
# Register phone
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0xYourPrivateKey",
    "phone": "+1234567890"
  }'

# Send payment
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0xYourPrivateKey",
    "recipientPhone": "+0987654321",
    "amount": "0.01"
  }'

# Check registration
curl http://localhost:3000/api/check-registration/+1234567890

# Get balance
curl http://localhost:3000/api/balance/0x789abc...
```

---

## Best Practices

1. **Never expose private keys**
   - Store securely in environment variables
   - Never commit to version control
   - Use encryption for storage

2. **Validate inputs**
   - Check phone number format
   - Validate amounts before sending
   - Verify addresses

3. **Handle errors gracefully**
   - Implement retry logic
   - Show user-friendly error messages
   - Log errors for debugging

4. **Use HTTPS in production**
   - Never send private keys over HTTP
   - Implement SSL/TLS
   - Verify certificates

5. **Rate limiting**
   - Respect rate limits
   - Implement exponential backoff
   - Cache responses when possible

---

## Security Considerations

1. **Private Key Management**
   - Never log private keys
   - Use secure key storage (HSM, key vault)
   - Implement key rotation

2. **Phone Number Privacy**
   - Phone numbers are hashed on-chain
   - Original numbers never stored on blockchain
   - SHA-256 hashing used

3. **Transaction Security**
   - All transactions signed with private key
   - Cannot be replayed or modified
   - Verified on-chain

4. **API Security**
   - Implement authentication (JWT)
   - Use HTTPS only
   - Rate limiting enabled
   - Input validation

---

## Support

For API issues or questions:
- GitHub Issues: [Link]
- Email: support@chatterpay.app
- Discord: [Link]

---

*Last Updated: December 24, 2025*
*API Version: 1.0.0*
