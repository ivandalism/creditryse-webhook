const Stripe = require("stripe");

module.exports = async (req, res) => {
  console.log("🔥 Webhook hit");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let rawBody = "";

    for await (const chunk of req) {
      rawBody += chunk;
    }

    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Event:", event.type);

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};
