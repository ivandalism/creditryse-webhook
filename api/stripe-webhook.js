const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let buf;

  try {
    buf = await new Promise((resolve, reject) => {
      const chunks = [];

      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
  } catch (err) {
    console.error("❌ Buffer error:", err);
    return res.status(500).send("Buffer read failed");
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Event received:", event.type);

  // handle safely (no assumptions yet)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💰 Checkout:", session.customer_details?.email);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    console.log("💰 Invoice paid:", invoice.customer_email);
  }

  return res.status(200).json({ received: true });
};
