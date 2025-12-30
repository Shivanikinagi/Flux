# Flux Testing Guide

## ✅ What's Been Fixed

1. **No More Auto-Display**: Frontend no longer automatically shows "Already Registered" on page load
2. **Name Mapping**: Backend now stores name → phone → address mappings
3. **Payment by Name**: WhatsApp commands now support sending payments using names (e.g., "PAY Pavan 10")
4. **Clean Registration Flow**: Users can now properly register with name, phone, and wallet address

## 🧪 Testing Steps

### Step 1: Register First User (You)

1. Open browser to: `http://localhost:3000`
2. Fill in the registration form:
   - **Name**: Pavan (or your name)
   - **Phone**: +919545296699 (your WhatsApp number)
   - **Wallet Address**: Leave empty (will create new)
   - **Private Key**: Leave empty
3. Click "Create Wallet & Register"
4. **SAVE YOUR PRIVATE KEY** - you'll see it displayed after registration
5. Wait for success message

### Step 2: Register Second User (Test Friend)

1. Refresh the page (it should show empty form now!)
2. Fill in different details:
   - **Name**: Shivani (or test friend name)
   - **Phone**: +1234567890 (different test number)
   - **Wallet Address**: Leave empty
   - **Private Key**: Leave empty
3. Click "Create Wallet & Register"
4. Save the wallet details

### Step 3: Test WhatsApp Commands

#### Test HELP Command
- Send to WhatsApp: `whatsapp:+14155238886`
- Message: `HELP`
- Should receive: List of commands including updated PAY syntax

#### Test Payment by Name
- Message: `PAY Pavan 10`
- Should receive: "Processing payment of 10 MOVE to Pavan..."
- System will look up Pavan's phone number and wallet address automatically

#### Test Payment by Phone
- Message: `PAY +919545296699 5`
- Should receive: "Processing payment of 5 MOVE to Pavan..."
- System recognizes phone and displays name if available

### Step 4: Verify Name Mappings

Check the mappings file:
```bash
cat backend/data/name_mappings.json
```

Should see:
```json
{
  "pavan": {
    "phone": "+919545296699",
    "address": "0x...",
    "name": "Pavan"
  },
  "shivani": {
    "phone": "+1234567890",
    "address": "0x...",
    "name": "Shivani"
  }
}
```

## 🎯 Expected Behavior

### Registration Flow
✅ **Before**: Page showed "Already Registered" immediately on load
✅ **Now**: Clean form, ready for user input

### Payment Commands
✅ **Before**: Only `PAY +1234567890 10` worked
✅ **Now**: Both `PAY Pavan 10` and `PAY +1234567890 10` work

### Name Resolution
✅ Names are case-insensitive (Pavan, pavan, PAVAN all work)
✅ Phone numbers resolve to names in responses
✅ System checks both phone and name registries

## 🔍 Debugging

### Check Backend Logs
```bash
# Look for these log messages:
- "Saved mapping: [name] -> [phone] -> [address]"
- "Registration request for phone: [phone], name: [name], address: [address]"
```

### Test Name Lookup Directly
Create test file `backend/test_names.js`:
```javascript
const nameMappingService = require('./src/nameMappingService');

async function test() {
    await nameMappingService.initialize();
    
    const info = await nameMappingService.getUserInfo('Pavan');
    console.log('Found:', info);
    
    const address = await nameMappingService.getAddressByName('Pavan');
    console.log('Address:', address);
}

test();
```

Run: `node backend/test_names.js`

## 📝 Notes

- Names are stored in lowercase internally for case-insensitive lookup
- Original name case is preserved for display
- Phone numbers must be in E.164 format (+[country][number])
- Each registration creates a new wallet unless existing wallet is provided
- Name mappings persist in `backend/data/name_mappings.json`

## 🎉 Success Criteria

✅ Can register multiple users with different names and phone numbers
✅ Frontend doesn't show cached data on refresh
✅ Can send WhatsApp message: "PAY Pavan 10"
✅ System correctly resolves name to phone and address
✅ Mappings file is created and updated correctly

## 🚀 Next Steps

1. Implement actual payment execution (currently just shows "processing")
2. Add secure private key storage for automatic payments
3. Add transaction history by name
4. Add balance inquiry by name: "BALANCE Pavan"
