// server.js
const express =require( "express");
const { Polar, validateEvent, WebhookVerificationError } =require("@polar-sh/sdk");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
const corsOptions = {
  origin: '*',  // Only allow this domain
  methods: ['GET', 'POST'],  // Allow only these methods
};

app.use(cors(corsOptions));

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'sandbox'
});

app.post("/checkout", async (req, res) => {
  const productId = "942e603f-9f2b-4fde-a5ee-1d6e11e7d00a";  // make sure this is valid in your Polar dashboard
  try {
    const checkout = await polar.checkouts.create({
      products: [productId],          // must pass `products` as array of product IDs per docs :contentReference[oaicite:1]{index=1}
      successUrl: "http://localhost:3000",
      cancelUrl: "http://localhost:3000",
    });
    res.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ error: error.message });
  }
});


app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = validateEvent(
      req.body,
      req.headers,
      process.env.POLAR_WEBHOOK_SECRET
    );
    // Handle event (order created, subscription updated, etc)
    console.log("Webhook event:", event.type);
    res.status(200).send();
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return res.status(403).send();
    }
    console.error(error);
    res.status(500).send();
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000");
});
