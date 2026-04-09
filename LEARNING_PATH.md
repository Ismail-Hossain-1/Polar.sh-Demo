# 📚 Polar.sh Learning Path - Complete Guide for Beginners

Welcome! This guide walks you through understanding the payment integration step by step.

---

## 🎯 Learning Objectives

By the end of this guide, you'll understand:
1. ✅ How payment flows work (frontend → backend → Polar → webhook)
2. ✅ What data to store in your database
3. ✅ How to read and debug console logs
4. ✅ How to build related features (receipts, access control, etc.)

---

## 📖 Step-by-Step Learning Path

### Phase 1: Foundation (30 minutes)

**Goal:** Understand what Polar.sh is and how it works

#### 1.1 Concept: What is Polar.sh?
Polar.sh is a payment processor. Think of it as a secure middleman:
- You have a product to sell
- Customer wants to buy it
- Polar handles the payment securely
- Polar tells you when payment is done

**Why use Polar.sh?**
- Handles all payment security (PCI compliance)
- You don't store credit cards = less risk
- Can handle subscriptions
- Provides webhooks for post-payment actions

#### 1.2 Concept: Payment Flow
```
Your App (Frontend)
        ↓
Your Server (Backend)
        ↓
Polar.sh Checkout Page
        ↓
[User enters payment details HERE on Polar - not your server]
        ↓
Polar processes payment
        ↓
Polar sends WEBHOOK to your backend
        ↓
Your backend gets order confirmation
        ↓
You can activate access, send emails, etc.
```

#### 1.3 Read: [QUICK_START.md](./QUICK_START.md)
Focus on sections:
- "Prerequisites"
- "What Each File Does"
- "🎓 Key Concepts for Beginners"

---

### Phase 2: Environment Setup (15 minutes)

**Goal:** Get the code running locally

#### 2.1 Create Environment File
In your `backend/` folder, create `.env`:
```
POLAR_ACCESS_TOKEN=pol_test_YOUR_KEY
POLAR_WEBHOOK_SECRET=whsec_test_YOUR_SECRET
```

Get these from:
1. Polar Dashboard → Settings → API Keys (for token)
2. Polar Dashboard → Settings → Webhooks (for secret)

#### 2.2 Start the Servers
```bash
# Terminal 1: Backend
cd backend
npm install
node server.js

# Terminal 2: Frontend  
cd frontend
npm install
npm run dev
```

#### 2.3 Verify It's Running
- Backend: Should show "Server listening on port 4000"
- Frontend: Should show NextJS ready message

---

### Phase 3: Read the Code (1 hour)

**Goal:** Understand what each piece does

#### 3.1 Read Backend Code
Open [backend/server.js](./backend/server.js)

Read and understand:
1. **Initialization section** - Setting up Polar
2. **Checkout endpoint** - Creating checkout sessions
3. **Webhook endpoint** - Receiving payment confirmations
4. **Event handlers** - Processing different event types

**Key things to notice:**
- Comments starting with 💾 DATABASE explain what to store
- Each section has console.log statements
- Error handling with detailed logging

#### 3.2 Read Frontend Code
Open [frontend/app/page.js](./frontend/app/page.js)

Read and understand:
1. **Payment Flow Guide** - Top comment explains the full flow
2. **handleCheckout function** - Sends request to backend
3. **Console logs** - What happens at each step
4. **UI Components** - How to show error and info boxes

**Key things to notice:**
- Logs tell the story of what's happening
- Only the checkout URL is sent back to frontend
- Actual payment happens on Polar's page

---

### Phase 4: First Test (30 minutes)

**Goal:** Complete a test purchase and see all the logs

#### 4.1 Open the App
```
Browser → http://localhost:3000
```

#### 4.2 Open Developer Tools
```
Press F12 or Ctrl+Shift+I
Click "Console" tab
```

#### 4.3 Click "Buy Sample Product"
Watch the logs flow:
- Frontend logs appear in browser console
- Backend logs appear in terminal

#### 4.4 Complete Payment
When redirected to Polar:
- Use test card: `4242 4242 4242 4242`
- Any future expiration: `12/25`
- Any 3-digit CVC: `123`
- Click "Complete Order"

#### 4.5 Check Both Logs
- **Browser console** → Should show success message
- **Backend terminal** → Should show webhook received

#### 4.6 Read the Logs
Open [CONSOLE_LOG_GUIDE.md](./CONSOLE_LOG_GUIDE.md) and find the exact logs you saw.

---

### Phase 5: Database Design (1 hour)

**Goal:** Understand what to store and why

#### 5.1 Read: [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

Focus on sections:
1. "⚠️ Security First: What NOT to Store"
   - Understand why NOT to store payment details
2. "✅ Recommended Database Schema"
   - Look at CUSTOMERS table structure
   - Look at ORDERS table structure
3. "📝 Example Webhook Handler with DB Operations"
   - See how to connect Polar data to your database

#### 5.2 Key Concepts

**Never store these:**
- ❌ Credit card numbers
- ❌ Card expiration dates
- ❌ CVC codes
- ❌ Temporary tokens

**Always store these:**
- ✅ Customer email
- ✅ Order ID from Polar
- ✅ Amount and currency
- ✅ Order status
- ✅ Timestamps

#### 5.3 Create Your Schema

Use the SQL examples in DATABASE_GUIDE.md to create:
```sql
CREATE TABLE customers (...)
CREATE TABLE orders (...)
CREATE TABLE subscriptions (...)
CREATE TABLE webhooks_log (...)
```

---

### Phase 6: Connect Backend to Database (2 hours)

**Goal:** Make the backend actually save data

#### 6.1 Choose a Database
Options:
- **SQLite** - Easiest for learning (file-based)
- **PostgreSQL** - Production-ready
- **MySQL** - Also production-ready

For learning, SQLite is easiest:
```bash
npm install sqlite3
```

#### 6.2 Update Webhook Handler

Modify `server.js` webhook section to:
1. Extract customer ID from webhook
2. Find or create customer in DB
3. Insert order record
4. Update user access

Example structure:
```javascript
function handleOrderCreated(event) {
  // 1. Get customer from Polar webhook
  const {customer, line_items, amount, currency, id: orderId} = event.data;
  
  // 2. Find or create customer in your DB
  let dbCustomer = db.customers.findByEmail(customer.email);
  if (!dbCustomer) {
    dbCustomer = db.customers.create({
      polar_customer_id: customer.id,
      email: customer.email,
      name: customer.name
    });
  }
  
  // 3. Save order to DB
  db.orders.create({
    order_id: orderId,
    customer_id: dbCustomer.id,
    amount: amount,
    currency: currency,
    status: 'completed'
  });
  
  // 4. Activate access
  db.user_access.grant(dbCustomer.id, line_items[0].product.id);
  
  // 5. Send email
  sendEmail(customer.email, 'Order Confirmation', {...});
}
```

#### 6.3 Test Database Integration
1. Complete another test purchase
2. Check your database
3. Verify order was saved
4. Verify customer was created

---

### Phase 7: Add Features (3-4 hours)

Once the basics work, add these features:

#### 7.1 Receipt Emails
Trigger when `order.created` webhook arrives:
```javascript
function sendReceiptEmail(email, order) {
  console.log(`📧 Sending receipt to ${email}`);
  // Send email with order details
  // Include: Order ID, Amount, Date, Product Name
}
```

#### 7.2 User Access Control
Create an `access` table:
```sql
CREATE TABLE user_access (
  id INT,
  user_id INT,
  product_id VARCHAR(255),
  granted_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

Check access when user tries to use product:
```javascript
function hasAccess(userId, productId) {
  const access = db.user_access.find({
    user_id: userId,
    product_id: productId,
    expires_at: {$gt: new Date()}  // Not expired
  });
  return !!access;
}
```

#### 7.3 Subscription Renewal Tracking
Track renewals from `subscription.updated` webhooks:
```javascript
function handleSubscriptionRenewal(subscription) {
  // Update renewal date
  db.subscriptions.update(subscription.id, {
    renewal_date: subscription.renewal_date,
    status: subscription.status
  });
  
  // Extend user access
  const endDate = new Date(subscription.current_period_end);
  db.user_access.update({
    subscription_id: subscription.id
  }, {
    expires_at: endDate
  });
}
```

#### 7.4 Cancellation Handling
When user cancels subscription:
```javascript
function handleSubscriptionCanceled(subscription) {
  // Update subscription
  db.subscriptions.update(subscription.id, {
    status: 'canceled',
    canceled_at: new Date()
  });
  
  // Remove access
  db.user_access.delete({
    subscription_id: subscription.id
  });
  
  // Send goodbye email
  sendCancellationEmail(subscription.customer.email);
}
```

#### 7.5 Dashboard / Admin Panel
Create pages to see:
- Recent orders
- Active subscriptions
- Revenue by month
- Customer list

```sql
SELECT 
  DATE(o.created_at) as date,
  COUNT(*) as order_count,
  SUM(o.amount) as revenue,
  o.currency
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at)
ORDER BY o.created_at DESC;
```

---

## 🗺️ Project Structure After Learning

After completing all phases, your project should look like:
```
backend/
  ├── server.js              (Main server - you've read this✓)
  ├── .env                   (Credentials)
  ├── database.js            (NEW: DB connection)
  ├── handlers/
  │   ├── checkout.js        (NEW: Checkout logic)
  │   ├── webhooks.js        (NEW: Webhook processors)
  │   └── email.js           (NEW: Email sending)
  ├── middleware/
  │   └── auth.js            (NEW: Check user access)
  └── package.json

frontend/
  ├── app/
  │   ├── page.js            (Main buy button - you've read this✓)
  │   ├── success.js         (NEW: After payment success)
  │   ├── dashboard.js       (NEW: User orders)
  │   └── globals.css
  └── package.json
```

---

## 📚 Reference Documents

Keep these handy:

| Document | When to Use |
|----------|-----------|
| [QUICK_START.md](./QUICK_START.md) | Getting started, troubleshooting setup |
| [CONSOLE_LOG_GUIDE.md](./CONSOLE_LOG_GUIDE.md) | Understanding what each log means |
| [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) | Database design, SQL examples |
| [Polar Docs](https://docs.polar.sh) | Official API reference |

---

## ✅ Final Checklist

Before you're done learning:

- [ ] Read all 4 guide files
- [ ] Run the code locally
- [ ] Complete a test payment
- [ ] Understand the console logs
- [ ] Design a database schema
- [ ] Connect webhook to database
- [ ] Send test receipt email
- [ ] Implement one additional feature

---

## 🎓 Key Takeaways

### Architecture
- Payment flow: Frontend → Backend → Polar → Webhook → Backend
- Polar handles: Payment processing, security, subscriptions
- You handle: Data storage, user access, notifications

### Security
- Never store payment details
- Always verify webhook signatures
- Keep API keys in `.env`, not in code
- Test with sandbox before production

### Database
- Store order info, not payment method
- Link orders to customers via Polar customer ID
- Track subscription status and expiration
- Log webhooks for debugging

### Debugging
- Check console logs first
- Backend errors usually in terminal
- Frontend errors usually in browser console
- References in CONSOLE_LOG_GUIDE.md for each log

---

## 🚀 Next Steps After Learning

1. **Deploy to production**
   - Replace sandbox API keys with production keys
   - Deploy backend to cloud (Heroku, Railway, Vercel)
   - Deploy frontend to Vercel or similar
   - Set webhook URL to production domain

2. **Add analytics**
   - Track revenue over time
   - Monitor subscription churn
   - See which products sell best

3. **Improve UX**
   - Show order history
   - Allow account creation
   - Implement email preferences
   - Add discount codes

4. **Learn related skills**
   - Email templates (SendGrid, Resend)
   - Authentication (NextAuth, Auth0)
   - Analytics (Mixpanel, Amplitude)
   - Monitoring (Sentry, LogRocket)

---

## 💡 Pro Tips

1. **Always log everything** - Logs are your best debugging tool
2. **Test with sandbox first** - Always use sandbox mode during development
3. **Keep webhooks idempotent** - Handle duplicate webhooks gracefully
4. **Monitor for failures** - Set up alerts for failed payments
5. **Document your schema** - Future you will thank you

---

## ❓ Common Questions

### Q: What if my webhook never gets triggered?
**A:** In local dev, Polar can't reach `localhost`. Use ngrok (see QUICK_START.md).

### Q: Should I show the payment details to the user?
**A:** Store and show Order ID, Amount, Date, Product. Not payment method.

### Q: How do I handle refunds?
**A:** Polar sends `order.updated` webhook with status='refunded'. Handle it like this:
```javascript
if (event.data.status === 'refunded') {
  db.orders.update(event.data.id, {status: 'refunded'});
  db.user_access.revoke(userId, productId);
  sendRefundEmail(customer.email);
}
```

### Q: Can I test subscriptions locally?
**A:** Yes! Create a subscription product in Polar dashboard, use that in checkout.

### Q: How do I handle failures?
**A:** Log everything and retry. Most errors are temporary. Implement retry logic for critical actions.

---

## 📞 Getting Help

1. **Check the logs** - 80% of issues visible in console
2. **Read the guides** - Answers to most questions are here
3. **Polar docs** - https://docs.polar.sh for API details
4. **GitHub** - Search for similar issues in Polar SDK repo

---

Happy learning! 🎉

Start with Phase 1 & 2, then work through at your own pace.
