# 🚀 Quick Start Guide - Polar.sh Payment Integration

## Prerequisites

Make sure you have:
- Node.js installed
- Polar.sh account (create at https://polar.sh)
- Your Polar API key (from Polar dashboard)

---

## 🛠️ Environment Setup

### 1. Backend - Create `.env` file

Create `.env` in your `backend/` folder:

```bash
# Get this from your Polar Dashboard
POLAR_ACCESS_TOKEN=pol_test_YOUR_KEY_HERE

# Get this from Polar Dashboard > Settings > Webhooks
POLAR_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE
```

### 2. Install Dependencies

#### Backend:
```bash
cd backend
npm install express @polar-sh/sdk cors dotenv
```

#### Frontend:
```bash
cd frontend
npm install
```

---

## 🎮 Running the Application

### Terminal 1 - Start Backend:
```bash
cd backend
node server.js
```

You should see:
```
🎉 ========================================
🎉 Server listening on http://localhost:4000
🎉 ========================================
```

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
> next dev
Ready in 3.45s
```

---

## 🧪 How to Test

### 1. Open Browser
Go to http://localhost:3000

### 2. Open Developer Console
Press `F12` or `Ctrl+Shift+I` to open DevTools

### 3. Go to Console Tab
This is where you'll see all the logs

### 4. Click "Buy Sample Product" Button
Watch the console logs as they flow:

**Frontend Logs:**
```
💳 [FRONTEND] User clicked 'Buy Sample Product' button
💳 [FRONTEND] Sending checkout request to backend...
✅ [FRONTEND] Backend response received successfully!
✅ [FRONTEND] Redirecting user to Polar checkout page...
```

**Backend Logs (in Terminal 1):**
```
📦 [CHECKOUT] Request received from frontend
📦 [CHECKOUT] Creating checkout session with Polar...
✅ [CHECKOUT] Checkout session created successfully!
📊 [CHECKOUT] Checkout details: {
  checkoutId: "checkout_abc123",
  url: "https://checkout.polar.sh/...",
  createdAt: "2026-04-09T..."
}
```

### 5. You'll Be Redirected to Polar Checkout
This is where payment happens (on Polar's secure server)

### 6. Test Payment Details
Use Polar's test card:
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

### 7. After Payment Completes
Look for **Webhook Logs** in your backend terminal:

```
🔔 [WEBHOOK] Incoming webhook from Polar...
🔔 [WEBHOOK] Validating webhook signature...
✅ [WEBHOOK] Webhook signature verified successfully!
📊 [WEBHOOK] Event type: order.created
📊 [WEBHOOK] Full event data: {
  id: "ord_xyz789",
  customer: {
    id: "cus_123abc",
    email: "customer@example.com"
  },
  amount: 1999,
  currency: "USD",
  status: "completed"
}
💳 [EVENT: order.created] Processing order creation...
```

---

## 📊 Understanding the Logs

### Frontend Logs (Browser Console)

| Log | Meaning |
|-----|---------|
| 💳 | Frontend action (button click, API call) |
| ✅ | Success (response received) |
| ❌ | Error (something failed) |
| ⏳ | Loading/waiting |

### Backend Logs (Terminal)

| Log | Meaning |
|-----|---------|
| 📦 | Checkout process |
| 🔔 | Webhook received |
| 💳 | Payment event |
| 🔄 | Subscription update |
| ✅ | Success |
| ❌ | Error/Security issue |
| 📊 | Important data |

---

## 🐛 Common Issues & Solutions

### ❌ "Error: POLAR_ACCESS_TOKEN is not defined"
**Solution:** Your `.env` file is not being read.
- Check `.env` is in the `backend/` folder
- Make sure server is restarted after creating `.env`
- Check you have `require('dotenv').config();` at the top of server.js

### ❌ "Webhook signature verification failed"
**Solution:** Your `POLAR_WEBHOOK_SECRET` is wrong.
- Copy it again from Polar Dashboard
- Make sure there are no extra spaces
- Webhook Secret is different from API Token!

### ❌ "Failed to create checkout session"
**Solution:** Your product ID might be invalid.
- Go to your Polar Dashboard
- Find your product and copy the exact ID
- Replace the ID in the `productId` array in `server.js`

### ❌ "Cannot POST to http://localhost:4000/checkout"
**Solution:** Backend is not running.
- Make sure backend server is running on port 4000
- Check for errors in terminal
- Try running `node server.js` again

### ❌ No webhook logs in backend terminal
**Solution:** Polar doesn't know where to send webhooks.
- In local development, Polar can't reach localhost
- You need a tool like **ngrok** to tunnel requests
- Or configure webhook URL in Polar Dashboard to point to your ngrok URL

---

## 🌐 For Local Testing: Using ngrok

When testing locally, Polar.sh can't access `localhost:4000`. Use **ngrok**:

### Install ngrok:
```bash
# Download from https://ngrok.com/download
# Or use npm:
npm install -g ngrok
```

### Run ngrok:
```bash
ngrok http 4000
```

You'll see:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        us (United States)
Forwarding                    https://abc123.ngrok.io -> http://localhost:4000
```

### Update Polar Webhook URL:
1. Go to Polar Dashboard > Settings > Webhooks
2. Set webhook URL to: `https://abc123.ngrok.io/webhook`
3. Copy the webhook secret to your `.env`

Now when you test payments, Polar can reach your local backend!

---

## 📋 Testing Checklist

- [ ] Backend is running on port 4000
- [ ] Frontend is running on port 3000
- [ ] `.env` file exists in `backend/` folder
- [ ] `POLAR_ACCESS_TOKEN` is set correctly
- [ ] `POLAR_WEBHOOK_SECRET` is set correctly (if testing webhooks)
- [ ] Open browser to http://localhost:3000
- [ ] Open DevTools Console (F12)
- [ ] Click "Buy Sample Product"
- [ ] Check console logs on both frontend and backend
- [ ] Complete test payment with test card
- [ ] Verify webhook logs appear in backend terminal

---

## 📚 What Each File Does

### Backend Files

**`server.js`** - Main server
- Handles `/checkout` endpoint
- Handles `/webhook` endpoint
- Includes detailed console logs and comments
- Explains what should/shouldn't go in DB

### Frontend Files

**`page.js`** - React component
- Shows buy button
- Sends checkout request to backend
- Includes payment flow explanation
- Shows detailed console logs

---

## 🎓 Key Concepts for Beginners

### Checkout Flow:
1. **User clicks buy** → Frontend sends request to backend
2. **Backend creates checkout** → Backend calls Polar API
3. **Frontend gets URL** → Polar returns checkout page URL
4. **User redirected** → User goes to Polar's secure page
5. **Payment processed** → User enters card details on Polar
6. **Success** → Polar sends webhook to your backend
7. **Activate access** → Backend processes the order

### Why This Architecture:
- **Payment details never touch your server** = More secure
- **Polar handles all payment logic** = Less code, fewer bugs
- **Webhooks confirm payment** = Asynchronous & reliable
- **You get all event data** = Can trigger other actions

---

## 🔒 Security Notes

✅ **Good:**
- Payment details are entered on Polar's site, not yours
- Webhook signature is verified before processing
- Test mode for safe development
- API key stored in `.env`, not in code

❌ **Avoid:**
- Storing card numbers in your DB
- Committing `.env` to git
- Using API key in frontend code
- Trusting webhook without signature verification

---

## 📞 Need Help?

1. Check the **console logs** - they tell you exactly what's happening
2. Read the **comments in the code** - they explain each step
3. Check your **environment variables** - 90% of issues
4. Refer to **DATABASE_GUIDE.md** for schema examples
5. See **Polar.sh Docs** - https://docs.polar.sh

Happy coding! 🎉
