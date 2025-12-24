# 🔧 ChatterPay Setup Checklist

## ✅ What You Have:
- [x] Twilio Account SID: AC9e0ab174606d7cdacbf2e794b5c57fd7
- [x] Twilio Auth Token: Configured
- [x] WhatsApp Sandbox Number: whatsapp:+14155238886
- [x] Your WhatsApp: whatsapp:+919545296699
- [x] Backend Server: RUNNING on port 3000
- [x] Smart Contract: Deployed on Movement Network

## ⚠️ What's Missing:

### 1. **WEBHOOK URL NOT CONFIGURED** ⚠️

**This is why Twilio can't send messages to your backend!**

**Action Required:**
1. Open: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Scroll to **"Sandbox Configuration"**
3. Under **"WHEN A MESSAGE COMES IN"**, you'll need to enter:
   - For local testing: Use ngrok URL (next step)
   - For production: Use your deployed backend URL

### 2. **NGROK NOT RUNNING**

You need ngrok to expose localhost:3000 to the internet so Twilio can send webhooks.

**Once ngrok installs, run:**
```bash
ngrok http 3000
```

This will give you a URL like: `https://abc123.ngrok.io`

Then update Twilio webhook to: `https://abc123.ngrok.io/webhook`

---

## 🚀 Quick Testing WITHOUT Webhook (Local Only):

Since webhook isn't configured yet, test the API directly:

### Test 1: Register User
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "privateKeyHex": "0x74c2ac8ec286c81be43dfc3175ca9df543c3390c208d816d857db3704c375bf8",
    "phoneNumber": "+919545296699"
  }'
```

### Test 2: Check Registration
```bash
curl http://localhost:3000/api/check-registration/+919545296699
```

### Test 3: Get Balance
```bash
curl http://localhost:3000/api/balance/0x7a9ea50052a16a735b75491d961ac61d9eae45584c1f789a4d93d99132c240a9
```

---

## 📱 For Full WhatsApp Testing:

1. ✅ Join sandbox: Send "join wide-barn" to +1 415 523 8886
2. ⏳ Install ngrok
3. ⏳ Run: `ngrok http 3000`
4. ⏳ Copy the ngrok URL (https://xxxxx.ngrok.io)
5. ⏳ Go to Twilio → WhatsApp Sandbox → Set webhook URL
6. ✅ Test by sending "HELP" to the WhatsApp number

---

## 🎯 Current Status:
- Backend: ✅ RUNNING
- Twilio: ✅ CONFIGURED  
- Webhook: ❌ NOT SET
- Ngrok: 🔄 INSTALLING

**Next Step:** Wait for ngrok to finish installing, then I'll help you set it up!
