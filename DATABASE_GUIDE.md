# 📚 Polar.sh Payment - Database Guide for Beginners

## Overview

This guide explains what data to store in your database when using Polar.sh, and why certain information should NOT be stored.

---

## ⚠️ Security First: What NOT to Store

### ❌ NEVER Store These:
- **Payment method details** (card numbers, expiration dates, CVV)
- **Stripe/Polar payment tokens** (temporary tokens)
- **Customer authentication tokens from Polar**
- **Webhook signatures** or raw request bodies
- **Passwords or private keys**

**Why?** Polar securely stores all sensitive payment information. Your database doesn't need it, and storing it would create security risks and compliance headaches (PCI-DSS).

---

## ✅ Recommended Database Schema

### 1. CUSTOMERS Table
Store basic customer information that you collect or receive from Polar.

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  polar_customer_id VARCHAR(255) UNIQUE NOT NULL,  -- ID from Polar
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Why these fields:**
- `polar_customer_id`: Links your DB to Polar's customer
- `email`: For communication & tracking
- `name`: For personalization
- `created_at/updated_at`: Track when customer was added

**Example data after webhook:**
```json
{
  "polar_customer_id": "cus_123abc",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

### 2. ORDERS Table
Store one-time purchase information.

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(255) UNIQUE NOT NULL,  -- ID from Polar
  customer_id INT NOT NULL,  -- References customers.id
  product_id VARCHAR(255) NOT NULL,  -- ID from Polar
  amount INT NOT NULL,  -- In CENTS (e.g., 1999 = $19.99)
  currency VARCHAR(3) NOT NULL,  -- 'USD', 'EUR', etc.
  status VARCHAR(50) NOT NULL,  -- 'pending', 'completed', 'refunded', 'failed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

**Data from Polar webhook (order.created):**
```json
{
  "order_id": "ord_abc123",
  "polar_customer_id": "cus_123abc",
  "product_id": "prod_xyz789",
  "amount": 1999,
  "currency": "USD",
  "status": "completed"
}
```

**What to do with this:**
1. Look up `customer_id` using `polar_customer_id`
2. Insert the order record
3. Activate user access to the product
4. Send order confirmation email

---

### 3. SUBSCRIPTIONS Table
For recurring/subscription products.

```sql
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subscription_id VARCHAR(255) UNIQUE NOT NULL,  -- ID from Polar
  customer_id INT NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,  -- 'active', 'paused', 'canceled'
  current_period_start DATETIME,
  current_period_end DATETIME,
  renewal_date DATETIME,  -- When subscription auto-renews
  cancel_at DATETIME,  -- When cancellation takes effect (if canceling)
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

**Data from Polar webhook (subscription.created):**
```json
{
  "subscription_id": "sub_xyz789",
  "polar_customer_id": "cus_123abc",
  "product_id": "prod_recurring",
  "status": "active",
  "current_period_start": "2026-04-09T00:00:00Z",
  "current_period_end": "2026-05-09T00:00:00Z",
  "renewal_date": "2026-05-09T00:00:00Z"
}
```

**What to do with this:**
1. Create subscription record
2. Grant access until `current_period_end`
3. Schedule renewal emails before `renewal_date`
4. On `subscription.updated` webhook: update status and dates

---

### 4. ORDER_ITEMS Table (Optional)
If your orders contain multiple products.

```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(255),
  product_name VARCHAR(255),
  quantity INT,
  unit_price INT,  -- In CENTS
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

### 5. WEBHOOKS_LOG Table (Recommended for Development)
Log all incoming webhooks for debugging.

```sql
CREATE TABLE webhooks_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(100),  -- 'order.created', 'subscription.updated', etc.
  event_id VARCHAR(255),  -- Unique ID from Polar
  status VARCHAR(50),  -- 'received', 'processed', 'failed'
  payload JSON,  -- Full webhook data for debugging
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Why:** Great for debugging! You can replay webhooks or check what data arrived.

---

## 🔄 Data Flow with Database

### When User Clicks "Buy":

```
1. Frontend Call
   └─ User clicks "Buy" button
   └─ Frontend sends: POST /checkout

2. Backend Creates Checkout
   └─ No DB operation needed yet!
   └─ Backend calls: polar.checkouts.create()
   └─ Polar returns: checkout.url & checkout.id
   └─ (Optional) Save checkout_id to DB with status="pending"

3. User Redirected to Polar
   └─ Polar handles ALL payment processing
   └─ User never interacts with your backend
   └─ Payment details stay on Polar's servers

4. Payment Success
   └─ User redirected back to your site
   └─ Polar sends: POST /webhook (order.created event)

5. Backend Processes Webhook
   ├─ Verify webhook signature (SECURITY!)
   ├─ Extract order data from webhook
   ├─ Look up customer by polar_customer_id
   ├─ INSERT into orders table
   ├─ UPDATE customers table (last_purchase_date, etc.)
   ├─ Activate user access (update users table)
   ├─ Send confirmation email
   └─ Respond with 200 OK
```

---

## 📝 Example Webhook Handler with DB Operations

```javascript
function handleOrderCreated(event) {
  const order = event.data;
  
  // 1. Find or create customer
  const customer = findOrCreateCustomer({
    polar_customer_id: order.customer.id,
    email: order.customer.email,
    name: order.customer.name
  });
  
  // 2. Save order to DB
  const orderRecord = db.orders.insert({
    order_id: order.id,
    customer_id: customer.id,  // Use LOCAL customer ID
    product_id: order.line_items[0].product.id,
    amount: order.amount,
    currency: order.currency,
    status: 'completed',
    created_at: order.created_at
  });
  
  // 3. Activate access
  db.user_access.insert({
    customer_id: customer.id,
    product_id: order.line_items[0].product.id,
    access_granted_at: new Date(),
    expires_at: null  // Permanent access for one-time purchase
  });
  
  // 4. Send email (don't store confirmation in webhook handler)
  sendOrderConfirmationEmail(customer.email, orderRecord);
}
```

---

## 🎯 Database Best Practices

### ✅ DO:
- Store `polar_customer_id` as a foreign key to link records
- Store payment amounts in the smallest currency unit (cents)
- Keep `created_at` and `updated_at` timestamps for all records
- Store order status so you can track refunds, cancellations
- Use transactions when inserting multiple related records
- Log all webhook events for debugging

### ❌ DON'T:
- Store payment method information
- Store card tokens or temporary payment data
- Store webhook signatures
- Store raw webhook body (unless for logging/debugging)
- Tie user access directly to a payment event (use status field)
- Assume webhook was processed; check your DB before processing again

---

## 🔍 Debugging Checklist

When something goes wrong, check these:

1. **Checkout endpoint** - Is `productId` valid in your Polar dashboard?
2. **Webhook endpoint** - Is `POLAR_WEBHOOK_SECRET` correct in `.env`?
3. **Webhook URL** - Is it publicly accessible for Polar to reach?
4. **Database connection** - Can your backend connect?
5. **Customer lookup** - Are you matching `polar_customer_id` correctly?
6. **Order unique constraints** - Are you re-inserting duplicate `order_id`?

---

## 📊 SQL Queries You'll Need

### Get all orders from a customer:
```sql
SELECT o.* FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.polar_customer_id = 'cus_123abc';
```

### Get active subscriptions:
```sql
SELECT * FROM subscriptions
WHERE status = 'active' AND current_period_end > NOW();
```

### Find customers with cancelled subscriptions:
```sql
SELECT DISTINCT c.* FROM customers c
JOIN subscriptions s ON c.id = s.customer_id
WHERE s.status = 'canceled';
```

### Track total revenue:
```sql
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as order_count,
  currency
FROM orders
WHERE status = 'completed'
GROUP BY currency;
```

---

## 🚀 Next Steps

1. **Create the database schema** above
2. **Test with sandbox mode** (your backend is already set to sandbox)
3. **Watch the console logs** (check browser DevTools and terminal)
4. **Verify DB inserts** after completing a test checkout
5. **Set up webhook logging** to debug webhook events
6. **Move to production** with production Polar API keys when ready

---

## 📚 Additional Resources

- **Polar.sh Docs:** https://docs.polar.sh
- **Webhook Events:** Check the webhook event types in server.js
- **Console Logs:** Run locally and check both frontend and backend logs
- **Database Design:** Normalize your schema and use foreign keys

Happy building! 🎉
