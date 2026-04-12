import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let rawBody = "";

  try {
    for await (const chunk of req) {
      rawBody += chunk;
    }
  } catch (err) {
    console.error("❌ Error reading body:", err);
    return res.status(500).send("Failed to read body");
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Event received:", event.type);

  return res.status(200).json({ received: true });
}
