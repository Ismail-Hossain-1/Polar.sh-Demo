# 🔍 Console Log Guide - Understanding Each Step

## Overview

This guide explains what each console log means and what to look for when testing.

---

## 📍 Where to Find Logs

### Frontend Logs
- **Location:** Browser DevTools Console (F12)
- **Source:** `frontend/app/page.js`
- **Emoji prefix:** 💳 = Frontend, 🎉 = Server startup

### Backend Logs
- **Location:** Terminal/Command Prompt
- **Source:** `backend/server.js`
- **Emoji prefix:** 📦 = Checkout, 🔔 = Webhook

---

## 📦 CHECKOUT FLOW LOGS (When User Clicks Buy)

### Step 1️⃣ - Frontend: Button Click
```
💳 [FRONTEND] User clicked 'Buy Sample Product' button
💳 [FRONTEND] Loading state set to true
```
**What it means:** User interface is active, button was clicked  
**What to check:** This always comes first

---

### Step 2️⃣ - Frontend: Sending Request
```
💳 [FRONTEND] Sending checkout request to backend...
💳 [FRONTEND] Request details: {
  url: "http://localhost:4000/checkout",
  method: "POST",
  timestamp: "2026-04-09T14:30:45.123Z"
}
```
**What it means:** Frontend is communicating with backend  
**What to check:** URL is correct, timestamp is current

---

### Step 3️⃣ - Backend: Receiving Request
```
📦 [CHECKOUT] Request received from frontend
📦 [CHECKOUT] Request body: {}
📦 [CHECKOUT] Product ID to checkout: [ "bc42309a-fd75-40bb-a863-f292ffa48491" ]
```
**What it means:** Backend received the request from frontend  
**What to check:** Product ID matches your Polar dashboard  
**⚠️ If you see:** `"bc42309a-fd75-40bb-a863-f292ffa48491"` - Update this with YOUR product ID!

---

### Step 4️⃣ - Backend: Creating Checkout
```
📦 [CHECKOUT] Creating checkout session with Polar...
```
**What it means:** Backend is calling Polar API to create checkout  
**What to check:** No error appears next

---

### Step 5️⃣ - Backend: Success Response
```
✅ [CHECKOUT] Checkout session created successfully!
📊 [CHECKOUT] Checkout details: {
  checkoutId: "checkout_6bnr3k9m",
  url: "https://checkout.polar.sh/checkout_6bnr3k9m",
  createdAt: "2026-04-09T14:30:45.123Z",
  status: "open"
}
```
**What it means:** Polar API successfully created a checkout  
**What to check:**
- ✅ `checkoutId` is present (unique identifier)
- ✅ `url` starts with https://checkout.polar.sh/
- ✅ `status` is "open" (ready for payment)

---

### Step 6️⃣ - Frontend: Response Received
```
✅ [FRONTEND] Backend response received successfully!
✅ [FRONTEND] Response data: {
  checkoutUrl: "https://checkout.polar.sh/checkout_6bnr3k9m",
  checkoutId: "checkout_6bnr3k9m",
  message: "Checkout session created. User will be redirected to Polar's checkout page."
}
```
**What it means:** Frontend received the checkout URL from backend  
**What to check:** URL matches what backend sent

---

### Step 7️⃣ - Frontend: Redirect to Polar
```
✅ [FRONTEND] Redirecting user to Polar checkout page...
⏭️  [FRONTEND] After this point:
   - User will complete payment on Polar's site
   - Payment details are NOT sent to our backend
   - Polar handles all payment security
   - User will be redirected back after payment
   - Backend will receive webhook confirmation
💳 [FRONTEND] Loading state set to false
```
**What it means:** Payment flow is handed off to Polar  
**What to check:** Browser redirects to checkout.polar.sh  
**📝 Note:** Your backend doesn't see payment details - that's a GOOD THING!

---

## 🔴 ERROR LOGS - What Could Go Wrong

### ❌ Error: POLAR_ACCESS_TOKEN Missing
```
❌ [CHECKOUT] Error creating checkout: Error: accessToken is required
❌ [CHECKOUT] Error details: {
  message: "accessToken is required",
  status: undefined,
  code: undefined
}
```
**Solution:**
- Create `.env` file in `backend/` folder
- Add: `POLAR_ACCESS_TOKEN=pol_test_xxxxx`
- Restart backend server

---

### ❌ Error: Invalid Product ID
```
❌ [CHECKOUT] Error creating checkout: Error: invalid product_id
❌ [CHECKOUT] Error details: {
  message: "Product not found",
  status: 404,
  code: "PRODUCT_NOT_FOUND"
}
```
**Solution:**
- Go to Polar Dashboard → Products
- Find your product and copy the exact ID
- Update `server.js` line with correct ID:
  ```javascript
  const productId = ["YOUR_ACTUAL_PRODUCT_ID_HERE"]
  ```

---

### ❌ Error: Network Failed (Frontend)
```
❌ [FRONTEND] Checkout request failed!
❌ [FRONTEND] Error details: {
  message: "Network Error",
  code: "ERR_NETWORK",
  status: undefined
}
```
**Solution:**
- Backend server is NOT running
- Start backend: `cd backend && node server.js`
- Check terminal shows "Server listening on port 4000"

---

## 🔔 WEBHOOK FLOW LOGS (After Payment Completes)

### ⚠️ Important Notes About Webhooks
- In **local development**, webhooks won't arrive automatically
- You need **ngrok** to tunnel requests from Polar to localhost
- See QUICK_START.md for ngrok setup
- For production, webhooks work automatically

### Step 1️⃣ - Backend: Webhook Arrives
```
🔔 [WEBHOOK] Incoming webhook from Polar...
🔔 [WEBHOOK] Validating webhook signature...
🔔 [WEBHOOK] Headers received: {
  'polar-signature': '***',
  'content-type': 'application/json'
}
```
**What it means:** Polar sent a webhook to your backend  
**What to check:** Headers are properly formatted

---

### Step 2️⃣ - Backend: Verify Signature
```
✅ [WEBHOOK] Webhook signature verified successfully!
```
**What it means:** Webhook genuinely came from Polar (security check)  
**What to check:** Never proceeds without this!

**⚠️ If you see instead:**
```
❌ [WEBHOOK] SECURITY: Webhook signature verification failed!
❌ [WEBHOOK] This webhook may be fraudulent or tampered with
```
**Check:**
- `POLAR_WEBHOOK_SECRET` in `.env` is correct
- Webhook body hasn't been modified
- Middleware isn't changing request

---

### Step 3️⃣ - Backend: Event Details
```
📊 [WEBHOOK] Event type: order.created
📊 [WEBHOOK] Full event data: {
  type: "order.created",
  data: {
    id: "ord_abc123def456",
    customer: {
      id: "cus_xyz789",
      email: "buyer@example.com"
    },
    amounts: {
      total: { amount: 1999, currency: "USD" }
    },
    status: "completed",
    created_at: "2026-04-09T14:35:20.123Z"
  }
}
```
**What it means:** Full payment event details from Polar  
**What to check:**
- ✅ `type` matches expected event (`order.created`)
- ✅ `customer.email` is valid
- ✅ `amounts.total.amount` is in cents (1999 = $19.99)
- ✅ `status` is "completed"

---

### Step 4️⃣ - Backend: Event Handler
```
💳 [EVENT: order.created] Processing order creation...
💳 [EVENT: order.created] Order data: {
  orderId: "ord_abc123def456",
  customerId: "cus_xyz789",
  customerEmail: "buyer@example.com",
  amount: 1999,
  currency: "USD",
  status: "completed",
  createdAt: "2026-04-09T14:35:20.123Z"
}
```
**What it means:** Backend is processing the payment  
**What to check:**
- Order ID is unique
- Customer ID is present
- Amount is correctly formatted

---

### Step 5️⃣ - Backend: Database Notes
```
💳 [EVENT: order.created] TODO: Activate user access to product
💳 [EVENT: order.created] TODO: Send order confirmation email
💳 [EVENT: order.created] TODO: Update inventory/stock
```
**What it means:** Suggestions for what to do next  
**What to do:**
- Create user access record in database
- Send thank you email to customer
- Update your product inventory

---

### Step 6️⃣ - Backend: Success
```
✅ [WEBHOOK] Event processed successfully
```
**What it means:** Webhook was successfully handled  
**What to check:** 200 OK response was sent to Polar

---

## 📊 Subscription Flow Logs

### When User Subscribes:
```
🔁 [EVENT: subscription.created] Processing subscription creation...
🔁 [EVENT: subscription.created] Subscription data: {
  subscriptionId: "sub_abc123",
  customerId: "cus_xyz789",
  productId: "prod_recurring",
  status: "active",
  currentPeriodStart: "2026-04-09T00:00:00Z",
  currentPeriodEnd: "2026-05-09T00:00:00Z",
  renewalDate: "2026-05-09T00:00:00Z"
}
```
**What to store in database:**
```sql
INSERT INTO subscriptions (
  subscription_id, customer_id, product_id, status,
  current_period_start, current_period_end, renewal_date
) VALUES (
  'sub_abc123', <customer_id>, 'prod_recurring', 'active',
  '2026-04-09', '2026-05-09', '2026-05-09'
)
```

---

### When Subscription Renews:
```
🔄 [EVENT: subscription.updated] Processing subscription update...
🔄 [EVENT: subscription.updated] Updated subscription data: {
  subscriptionId: "sub_abc123",
  status: "active",
  cancelAt: null,
  renewalDate: "2026-06-09T00:00:00Z",
  updatedAt: "2026-05-09T00:00:00Z"
}
🔄 [EVENT: subscription.updated] TODO: Renew/extend subscription access
```
**What to do:**
- Update `renewal_date` to new date
- Extend user access until new period end
- Send renewal confirmation email

---

### When Subscription Cancels:
```
🔄 [EVENT: subscription.updated] Processing subscription update...
🔄 [EVENT: subscription.updated] Updated subscription data: {
  subscriptionId: "sub_abc123",
  status: "canceled",
  cancelAt: "2026-05-09T00:00:00Z",
  renewalDate: null,
  updatedAt: "2026-05-09T00:00:00Z"
}
🔄 [EVENT: subscription.updated] TODO: Remove subscription access
🔄 [EVENT: subscription.updated] TODO: Send cancellation confirmation
```
**What to do:**
- Mark subscription as inactive
- Remove user access
- Send goodbye email

---

## 🎯 Perfect Log Sequence (Happy Path)

When everything works correctly, you should see:

```
[FRONTEND]
💳 User clicked 'Buy Sample Product' button
💳 Sending checkout request to backend...
✅ Backend response received successfully!
✅ Redirecting user to Polar checkout page...

[BACKEND]
📦 Request received from frontend
📦 Creating checkout session with Polar...
✅ Checkout session created successfully!
📊 Checkout details: {...}

[USER redirects to Polar, enters payment details]

[BACKEND - after payment]
🔔 Incoming webhook from Polar...
✅ Webhook signature verified successfully!
📊 Event type: order.created
💳 [EVENT: order.created] Processing order creation...
✅ Event processed successfully
```

---

## ✅ Quick Checklist

When testing, verify you see these:

- [ ] 💳 Button click log
- [ ] 📦 Checkout request received
- [ ] ✅ Checkout session created
- [ ] 🔔 Webhook received (if using ngrok)
- [ ] ✅ Webhook signature verified
- [ ] 💳 Order event processing (if webhook reached)

---

## 🆘 Troubleshooting Summary

| Issue | Logs to Check | Solution |
|-------|---------------|----------|
| No backend logs | Backend terminal | Is server running? |
| "accessToken" error | Backend: Error message | Create `.env` with token |
| Invalid product | Backend: 404 error | Update product ID in server.js |
| Network error | Frontend: ERR_NETWORK | Start backend server |
| No webhook logs | Backend terminal | Use ngrok for local testing |
| Signature failed | Backend: WebhookVerificationError | Check POLAR_WEBHOOK_SECRET |

---

Happy debugging! 🧡
