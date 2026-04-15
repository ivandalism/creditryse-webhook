import Stripe from "stripe";

export default async function handler(req, res) {
  console.log("🔥 Webhook hit");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // ✅ FIXED: use Buffer instead of string
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks);

    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Event received:", event.type);

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
