const express = require("express");
const { Polar, validateEvent, WebhookVerificationError } = require("@polar-sh/sdk");
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*', // Allow all headers including polar-signature
  credentials: false
};

app.use(cors(corsOptions));

// ==================== WEBHOOK ENDPOINT (BEFORE JSON PARSER) ====================
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  console.log("\n🔔 [WEBHOOK] ====================================");
  console.log("🔔 [WEBHOOK] Incoming webhook from Polar...");
  console.log("🔔 [WEBHOOK] Body is Buffer:", Buffer.isBuffer(req.body));

  // Polar uses Svix-style webhook headers (not polar-signature)
  const signature = req.headers['webhook-signature'];
  const webhookId = req.headers['webhook-id'];
  const webhookTimestamp = req.headers['webhook-timestamp'];

  console.log("🔔 [WEBHOOK] Signature header:", signature ? '✅ present' : '❌ MISSING');
  console.log("🔔 [WEBHOOK] Webhook ID:", webhookId ? '✅ present' : '❌ MISSING');
  console.log("🔔 [WEBHOOK] Timestamp:", webhookTimestamp ? '✅ present' : '❌ MISSING');

  if (!signature || !webhookId || !webhookTimestamp) {
    console.error("❌ [WEBHOOK] Missing required webhook headers!");
    return res.status(401).send("Missing webhook headers");
  }

  if (!process.env.POLAR_WEBHOOK_SECRET) {
    console.error("❌ [WEBHOOK] POLAR_WEBHOOK_SECRET not in .env!");
    return res.status(500).send("Missing webhook secret");
  }

  try {
    console.log("🔔 [WEBHOOK] Validating webhook with Svix format...");

    // For Svix-style webhooks, we need to verify the signature manually
    const crypto = require('crypto');

    // Svix signature format: "v1,<signature>"
    const [sigVersion, sigValue] = signature.split(',');

    if (sigVersion !== 'v1') {
      console.error("❌ [WEBHOOK] Unknown signature version:", sigVersion);
      return res.status(403).send("Invalid signature version");
    }

    // Create the signed content: "{timestamp}.{payload}"
    const bodyString = req.body.toString('utf-8');
    const signedContent = `${webhookId}.${webhookTimestamp}.${bodyString}`;

    // Compute HMAC-SHA256 using the secret
    const expectedSig = crypto
      .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET)
      .update(signedContent)
      .digest('base64');

    console.log("🔔 [WEBHOOK] Expected signature:", expectedSig.substring(0, 30) + "...");
    console.log("🔔 [WEBHOOK] Received signature:", sigValue.substring(0, 30) + "...");

    if (sigValue !== expectedSig) {
      console.error("❌ [WEBHOOK] Signature verification FAILED!");
      console.error("❌ [WEBHOOK] The signatures don't match!");
      return res.status(403).send("Invalid signature");
    }

    console.log("✅ [WEBHOOK] Webhook signature verified successfully!");

    // Now parse the body as JSON
    const event = JSON.parse(bodyString);

    console.log("📊 [WEBHOOK] Event type:", event.type);
    // console.log("📊 [WEBHOOK] Full event data:", JSON.stringify(event, null, 2));

    switch (event.type) {
      case 'order.created':
        handleOrderCreated(event);
        break;
      case 'order.paid':
        handleOrderPaid(event);
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

    console.log("✅ [WEBHOOK] Event processed successfully", event.type);
    return res.status(200).send("OK");

  } catch (error) {
    console.error("❌ [WEBHOOK] Error:", error.message);
    return res.status(500).send();
  }
});

// ⚠️ NOW apply JSON parser to everything else
app.use(express.json());

// ==================== CHECKOUT ENDPOINT ====================
app.post("/checkout", async (req, res) => {
  console.log("\n📦 [CHECKOUT] Request received from frontend");

  const productId = ["bc42309a-fd75-40bb-a863-f292ffa48491"];

  try {
    console.log("📦 [CHECKOUT] Creating checkout session with Polar...");

    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: 'sandbox'
    });

    const checkout = await polar.checkouts.create({
      products: productId,
      successUrl: "http://localhost:3000/success",
      cancelUrl: "http://localhost:3000/cancel",
    });

    console.log("✅ [CHECKOUT] Checkout session created successfully!");
    console.log("📊 [CHECKOUT] Checkout details:", {
      checkoutId: checkout.id,
      url: checkout.url,
      createdAt: checkout.created_at,
      status: checkout.status
    });

    res.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      message: "Checkout session created."
    });

  } catch (error) {
    console.error("❌ [CHECKOUT] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEBHOOK EVENT HANDLERS ====================
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
  console.log("💳 [EVENT: order.created] TODO: Activate user access to product");
  console.log("💳 [EVENT: order.created] TODO: Send order confirmation email");
}

function handleOrderPaid(event) {
  console.log("\n💰 [EVENT: order.paid] Processing payment confirmation...");
  const order = event.data;
  console.log("💰 [EVENT: order.paid] Order data:", {
    orderId: order.id,
    customerId: order.customer?.id,
    customerEmail: order.customer?.email,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    paidAt: order.paid_at
  });
  console.log("💰 [EVENT: order.paid] TODO: Send payment receipt");
  console.log("💰 [EVENT: order.paid] TODO: Mark order as paid in database");
}

function handleOrderUpdated(event) {
  // console.log("\n🔄 [EVENT: order.updated] Processing order update...");
  // const order = event.data;
  // console.log("🔄 [EVENT: order.updated] Updated order data:", {
  //   orderId: order.id,
  //   status: order.status,
  //   updatedAt: order.updated_at
  // });
}

function handleSubscriptionCreated(event) {
  // console.log("\n🔁 [EVENT: subscription.created] Processing subscription creation...");
  // const subscription = event.data;
  // console.log("🔁 [EVENT: subscription.created] Subscription data:", {
  //   subscriptionId: subscription.id,
  //   customerId: subscription.customer?.id,
  //   productId: subscription.product?.id,
  //   status: subscription.status
  // });
}

function handleSubscriptionUpdated(event) {
  // console.log("\n🔄 [EVENT: subscription.updated] Processing subscription update...");
  // const subscription = event.data;
  // console.log("🔄 [EVENT: subscription.updated] Updated subscription data:", {
  //   subscriptionId: subscription.id,
  //   status: subscription.status
  // });
}

// ==================== SERVER STARTUP ====================
app.listen(4000, () => {
  console.log("🎉 ========================================");
  console.log("🎉 Server listening on http://localhost:4000");
  console.log("🎉 ========================================");
  console.log("\n✅ Webhook endpoint: POST /webhook");
  console.log("✅ CORS enabled for all origins");
  console.log("✅ Ready to receive webhooks!\n");
});
