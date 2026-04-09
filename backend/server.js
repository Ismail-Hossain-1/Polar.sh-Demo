// server.js
const express = require("express");
const { Polar, validateEvent, WebhookVerificationError } = require("@polar-sh/sdk");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
const corsOptions = {
  origin: '*',  // Only allow this domain
  methods: ['GET', 'POST'],  // Allow only these methods
};

app.use(cors(corsOptions));

// ==================== INITIALIZATION ====================
console.log("🚀 Initializing Polar.sh SDK...");
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'sandbox'
});
console.log("✅ Polar.sh SDK initialized in SANDBOX mode");

// ==================== CHECKOUT ENDPOINT ====================
/**
 * POST /checkout
 * Creates a Polar checkout session
 * 
 * BEGINNER GUIDE:
 * - This endpoint creates a checkout URL that redirects users to Polar's hosted checkout
 * - The user completes payment on Polar's secure checkout page
 * - After payment, Polar sends a webhook to confirm the transaction
 * 
 * DATABASE STORAGE:
 * ✅ STORE: checkout_id, user_id, product_id, created_at, status (pending, completed, failed)
 * ❌ DON'T STORE: payment_method_details, card numbers, sensitive payment info (Polar handles this)
 */
app.post("/checkout", async (req, res) => {
  console.log("\n📦 [CHECKOUT] Request received from frontend");
  console.log("📦 [CHECKOUT] Request body:", JSON.stringify(req.body, null, 2));

  const productId = [
    "bc42309a-fd75-40bb-a863-f292ffa48491"
  ]; // make sure this is valid in your Polar dashboard

  console.log("📦 [CHECKOUT] Product ID to checkout:", productId);

  try {
    console.log("📦 [CHECKOUT] Creating checkout session with Polar...");

    const checkout = await polar.checkouts.create({
      products: productId,          // must pass `products` as array of product IDs per docs
      successUrl: "http://localhost:3000",
      cancelUrl: "http://localhost:3000",
    });

    console.log("✅ [CHECKOUT] Checkout session created successfully!");
    console.log("📊 [CHECKOUT] Checkout details:", {
      checkoutId: checkout.id,
      url: checkout.url,
      createdAt: checkout.created_at,
      status: checkout.status
    });

    // 💾 DATABASE: You should save this checkout record:
    // {
    //   checkout_id: checkout.id,
    //   user_id: req.user?.id (if authenticated),
    //   product_id: productId[0],
    //   checkout_url: checkout.url,
    //   status: 'pending',
    //   created_at: new Date(),
    //   expires_at: checkout.expires_at
    // }

    res.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      message: "Checkout session created. User will be redirected to Polar's checkout page."
    });

  } catch (error) {
    console.error("❌ [CHECKOUT] Error creating checkout:", error);
    console.error("❌ [CHECKOUT] Error details:", {
      message: error.message,
      status: error.status,
      code: error.code
    });

    res.status(500).json({
      error: error.message,
      message: "Failed to create checkout session"
    });
  }
});


// ==================== WEBHOOK ENDPOINT ====================
/**
 * POST /webhook
 * Receives events from Polar after payment completion
 * 
 * BEGINNER GUIDE:
 * - Polar sends webhooks to notify your server about payment events
 * - Events include: order.created, order.updated, subscription.created, subscription.updated, etc.
 * - Webhook validation ensures the event genuinely came from Polar (security)
 * - This is where you handle post-payment logic: activate subscriptions, send receipts, etc.
 * 
 * DATABASE STORAGE:
 * ✅ STORE: order_id, customer_id, amount, currency, status, product_info, created_at
 * ✅ STORE: subscription details (if recurring), renewal dates
 * ❌ DON'T STORE: Webhook signature, raw payment details, temporary tokens
 */
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  console.log("\n🔔 [WEBHOOK] Incoming webhook from Polar...");

  try {
    console.log("🔔 [WEBHOOK] Validating webhook signature...");
    console.log("🔔 [WEBHOOK] Headers received:", {
      'polar-signature': req.headers['polar-signature'] ? '***' : 'missing',
      'content-type': req.headers['content-type']
    });

    const event = validateEvent(
      req.body,
      req.headers,
      process.env.POLAR_WEBHOOK_SECRET
    );

    console.log("✅ [WEBHOOK] Webhook signature verified successfully!");
    console.log("📊 [WEBHOOK] Event type:", event.type);
    console.log("📊 [WEBHOOK] Full event data:", JSON.stringify(event, null, 2));

    // Handle different event types
    switch (event.type) {
      case 'order.created':
        handleOrderCreated(event);
        break;
      case 'order.updated':
        handleOrderUpdated(event);
        break;
      case 'subscription.created':
        handleSubscriptionCreated(event);
        break;
      case 'subscription.updated':
        handleSubscriptionUpdated(event);
        break;
      default:
        console.log(`⚠️  [WEBHOOK] Unhandled event type: ${event.type}`);
    }

    console.log("✅ [WEBHOOK] Event processed successfully");
    res.status(200).send();

  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error("❌ [WEBHOOK] SECURITY: Webhook signature verification failed!");
      console.error("❌ [WEBHOOK] This webhook may be fraudulent or tampered with");
      console.error("❌ [WEBHOOK] Rejecting webhook with 403 Forbidden");
      return res.status(403).send();
    }
    console.error("❌ [WEBHOOK] Error processing webhook:", error);
    console.error("❌ [WEBHOOK] Error details:", {
      message: error.message,
      code: error.code
    });
    res.status(500).send();
  }
});

// ==================== WEBHOOK EVENT HANDLERS ====================

/**
 * Handle order.created event
 * This is triggered when a customer completes a one-time purchase
 */
function handleOrderCreated(event) {
  console.log("\n💳 [EVENT: order.created] Processing order creation...");

  const order = event.data;
  console.log("💳 [EVENT: order.created] Order data:", {
    orderId: order.id,
    customerId: order.customer?.id,
    customerEmail: order.customer?.email,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    createdAt: order.created_at
  });

  // 💾 DATABASE: Save order information
  // {
  //   order_id: order.id,
  //   customer_id: order.customer.id,
  //   customer_email: order.customer.email,
  //   amount: order.amount,
  //   currency: order.currency,
  //   status: order.status,
  //   products: order.line_items,
  //   created_at: order.created_at,
  //   metadata: order.metadata  // Store any custom data you added
  // }

  // TODO: Add these actions
  console.log("💳 [EVENT: order.created] TODO: Activate user access to product");
  console.log("💳 [EVENT: order.created] TODO: Send order confirmation email");
  console.log("💳 [EVENT: order.created] TODO: Update inventory/stock");
}

/**
 * Handle order.updated event
 * This can be triggered when order status changes (e.g., payment confirmed, refunded)
 */
function handleOrderUpdated(event) {
  console.log("\n🔄 [EVENT: order.updated] Processing order update...");

  const order = event.data;
  console.log("🔄 [EVENT: order.updated] Updated order data:", {
    orderId: order.id,
    status: order.status,
    updatedAt: order.updated_at
  });

  // 💾 DATABASE: Update order status
  // UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?

  console.log("🔄 [EVENT: order.updated] TODO: Handle status changes (refunded, cancelled, etc.)");
}

/**
 * Handle subscription.created event
 * This is triggered when a customer subscribes to a recurring product
 */
function handleSubscriptionCreated(event) {
  console.log("\n🔁 [EVENT: subscription.created] Processing subscription creation...");

  const subscription = event.data;
  console.log("🔁 [EVENT: subscription.created] Subscription data:", {
    subscriptionId: subscription.id,
    customerId: subscription.customer?.id,
    productId: subscription.product?.id,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    renewalDate: subscription.renewal_date
  });

  // 💾 DATABASE: Save subscription information
  // {
  //   subscription_id: subscription.id,
  //   customer_id: subscription.customer.id,
  //   product_id: subscription.product.id,
  //   status: subscription.status,
  //   current_period_start: subscription.current_period_start,
  //   current_period_end: subscription.current_period_end,
  //   renewal_date: subscription.renewal_date,
  //   cancel_at: null (initially),
  //   created_at: subscription.created_at
  // }

  console.log("🔁 [EVENT: subscription.created] TODO: Grant subscription access");
  console.log("🔁 [EVENT: subscription.created] TODO: Send welcome email");
  console.log("🔁 [EVENT: subscription.created] TODO: Schedule renewal reminders");
}

/**
 * Handle subscription.updated event
 * This is triggered when subscription status changes (renewed, cancelled, updated)
 */
function handleSubscriptionUpdated(event) {
  console.log("\n🔄 [EVENT: subscription.updated] Processing subscription update...");

  const subscription = event.data;
  console.log("🔄 [EVENT: subscription.updated] Updated subscription data:", {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAt: subscription.cancel_at,
    renewalDate: subscription.renewal_date,
    updatedAt: subscription.updated_at
  });

  // 💾 DATABASE: Update subscription status
  // UPDATE subscriptions SET status = ?, renewal_date = ?, cancel_at = ?, updated_at = ? WHERE subscription_id = ?

  if (subscription.status === 'canceled') {
    console.log("🔄 [EVENT: subscription.updated] TODO: Remove subscription access");
    console.log("🔄 [EVENT: subscription.updated] TODO: Send cancellation confirmation");
  } else if (subscription.status === 'active') {
    console.log("🔄 [EVENT: subscription.updated] TODO: Renew/extend subscription access");
  }
}

// ==================== SERVER STARTUP ====================
app.listen(4000, () => {
  console.log("🎉 ========================================");
  console.log("🎉 Server listening on http://localhost:4000");
  console.log("🎉 ========================================");
  console.log("\n📝 Endpoints:");
  console.log("   POST /checkout - Create payment checkout");
  console.log("   POST /webhook  - Receive Polar webhook events");
  console.log("\n✅ Ready to handle payments!\n");
});
