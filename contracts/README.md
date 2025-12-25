# ChatterPay Smart Contracts

This directory contains the Move smart contracts for ChatterPay, deployed on the Movement Network.

## 📁 Structure

```
contracts/
├── sources/
│   └── phone_registry.move      # Main contract module
├── tests/
│   └── phone_registry_tests.move # Contract tests
├── Move.toml                     # Project configuration
└── README.md                     # This file
```

## 📝 Contract Overview

### phone_registry.move

The `phone_registry` module manages the core functionality of ChatterPay:

#### Key Features:
- **Phone Number Registration**: Maps hashed phone numbers to blockchain addresses
- **Privacy-Preserving**: Phone numbers are hashed (SHA-256) before storage
- **Payment Routing**: Send payments using phone numbers instead of addresses
- **Transaction History**: Track sent and received transactions
- **User Management**: Register, update, and unregister phone numbers

#### Main Functions:

**Entry Functions (Require Signer):**

```move
public entry fun initialize(admin: &signer)
```
Initialize the phone registry. Must be called once by contract deployer.

```move
public entry fun register_phone(
    user: &signer,
    phone_hash: vector<u8>,
    registry_address: address
)
```
Register a phone number (hashed) to the signer's address.

```move
public entry fun send_payment_to_phone(
    sender: &signer,
    recipient_phone_hash: vector<u8>,
    amount: u64,
    registry_address: address
)
```
Send APT tokens to a phone number.

```move
public entry fun update_phone(
    user: &signer,
    old_phone_hash: vector<u8>,
    new_phone_hash: vector<u8>,
    registry_address: address
)
```
Update registered phone number.

```move
public entry fun unregister_phone(
    user: &signer,
    phone_hash: vector<u8>,
    registry_address: address
)
```
Remove phone number registration.

**View Functions (Read-Only):**

```move
#[view]
public fun get_address_from_phone(
    phone_hash: vector<u8>,
    registry_address: address
): address
```
Get blockchain address from phone hash.

```move
#[view]
public fun is_phone_registered(
    phone_hash: vector<u8>,
    registry_address: address
): bool
```
Check if phone number is registered.

```move
#[view]
public fun get_total_users(
    registry_address: address
): u64
```
Get total number of registered users.

```move
#[view]
public fun get_transaction_count(
    user_addr: address
): (u64, u64)
```
Get transaction count (sent, received) for an address.

#### Data Structures:

**PhoneRegistry:**
```move
struct PhoneRegistry has key {
    phone_to_address: Table<vector<u8>, address>,
    address_to_phone: SimpleMap<address, vector<u8>>,
    total_users: u64,
    admin: address,
}
```

**TransactionRecord:**
```move
struct TransactionRecord has store, copy, drop {
    from: address,
    to: address,
    amount: u64,
    timestamp: u64,
    phone_hash: vector<u8>,
}
```

**UserTransactions:**
```move
struct UserTransactions has key {
    sent: vector<TransactionRecord>,
    received: vector<TransactionRecord>,
}
```

#### Error Codes:

| Code | Constant | Description |
|------|----------|-------------|
| 1 | E_NOT_INITIALIZED | Registry not initialized |
| 2 | E_ALREADY_INITIALIZED | Registry already initialized |
| 3 | E_PHONE_NOT_REGISTERED | Phone number not registered |
| 4 | E_PHONE_ALREADY_REGISTERED | Phone already registered |
| 5 | E_INSUFFICIENT_BALANCE | Insufficient balance |
| 6 | E_INVALID_AMOUNT | Invalid amount (must be > 0) |
| 7 | E_UNAUTHORIZED | Unauthorized operation |
| 8 | E_SELF_TRANSFER | Cannot send to self |

## 🧪 Testing

### Run All Tests

```bash
movement move test
```

### Run Specific Test

```bash
movement move test test_register_phone
```

### Run with Verbose Output

```bash
movement move test --verbose
```

### Test Coverage

The test suite includes:
- ✅ Registry initialization
- ✅ Phone registration (single and duplicate)
- ✅ Payment to phone number
- ✅ Self-transfer prevention
- ✅ Phone number update
- ✅ Phone unregistration
- ✅ Transaction counting
- ✅ Balance verification

## 🚀 Deployment

### 1. Compile

```bash
movement move compile
```

### 2. Test

```bash
movement move test
```

### 3. Deploy to Testnet

```bash
movement move publish --named-addresses ChatterPay=default
```

### 4. Deploy to Mainnet

```bash
movement move publish \
  --named-addresses ChatterPay=<your-address> \
  --network mainnet
```

## 📊 Gas Costs (Estimated)

| Operation | Gas Cost |
|-----------|----------|
| Initialize | ~500 units |
| Register Phone | ~200 units |
| Send Payment | ~300 units |
| Update Phone | ~250 units |
| Unregister | ~150 units |

*Note: Actual gas costs may vary based on network conditions*

## 🔒 Security Considerations

### Phone Number Privacy
- Phone numbers are hashed using SHA-256 before storage
- Original phone numbers are never stored on-chain
- Hashes are one-way (cannot be reversed)

### Access Control
- Only phone owner can update/unregister their phone
- Admin controls registry initialization only
- No admin control over user funds

### Transaction Security
- Self-transfers are prevented
- Amount validation (must be > 0)
- Balance checks before transfer
- Atomic operations (all-or-nothing)

### Best Practices
1. Always initialize registry after deployment
2. Test on testnet first
3. Verify contract address before use
4. Keep private keys secure
5. Monitor gas costs

## 🔧 Development

### Local Testing

```bash
# Compile
movement move compile

# Test
movement move test

# Test with coverage
movement move test --coverage

# View coverage report
movement coverage summary
```

### Debugging

Add `debug::print()` statements in your code:

```move
use std::debug;

debug::print(&b"Debug message");
debug::print(&some_variable);
```

Run with:
```bash
movement move test --verbose
```

## 📖 Examples

### Register Phone (JavaScript)

```javascript
const { AptosClient, AptosAccount } = require('aptos');

const client = new AptosClient('https://testnet.movementnetwork.xyz/v1');
const account = new AptosAccount(privateKeyBytes);
const phoneHash = crypto.createHash('sha256').update('+1234567890').digest();

const payload = {
  type: 'entry_function_payload',
  function: `${contractAddress}::phone_registry::register_phone`,
  type_arguments: [],
  arguments: [Array.from(phoneHash), contractAddress],
};

const txn = await client.generateTransaction(account.address(), payload);
const signed = await client.signTransaction(account, txn);
const result = await client.submitTransaction(signed);
await client.waitForTransaction(result.hash);
```

### Send Payment (JavaScript)

```javascript
const recipientPhoneHash = crypto.createHash('sha256')
  .update('+0987654321').digest();
const amountInOctas = 100000000; // 1 APT

const payload = {
  type: 'entry_function_payload',
  function: `${contractAddress}::phone_registry::send_payment_to_phone`,
  type_arguments: [],
  arguments: [
    Array.from(recipientPhoneHash),
    amountInOctas.toString(),
    contractAddress
  ],
};

const txn = await client.generateTransaction(account.address(), payload);
const signed = await client.signTransaction(account, txn);
const result = await client.submitTransaction(signed);
```

### Check Registration (View Function)

```javascript
const phoneHash = crypto.createHash('sha256').update('+1234567890').digest();

const isRegistered = await client.view({
  function: `${contractAddress}::phone_registry::is_phone_registered`,
  type_arguments: [],
  arguments: [Array.from(phoneHash), contractAddress],
});

console.log('Registered:', isRegistered[0]);
```

## 🐛 Common Issues

### Issue: "ALREADY_INITIALIZED"
**Cause:** Trying to initialize registry twice
**Solution:** Registry only needs initialization once after deployment

### Issue: "PHONE_NOT_REGISTERED"
**Cause:** Recipient phone not registered
**Solution:** Recipient must register their phone first

### Issue: "INSUFFICIENT_BALANCE"
**Cause:** Sender doesn't have enough APT
**Solution:** Fund account with more APT

### Issue: "SELF_TRANSFER"
**Cause:** Trying to send payment to own phone
**Solution:** Use different recipient

## 📚 References

- [Move Language Book](https://move-book.com)
- [Movement Network Docs](https://docs.movementnetwork.xyz)
- [Aptos Framework](https://github.com/aptos-labs/aptos-core)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Write tests
4. Submit pull request

## 📄 License

MIT License

---

*For questions about the smart contracts, open an issue on GitHub.*
