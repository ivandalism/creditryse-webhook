import crypto from "crypto";

export default async function handler(req, res) {
  console.log("🔥 Webhook hit");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let rawBody = "";

  for await (const chunk of req) {
    rawBody += chunk;
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ Missing signature");
    return res.status(400).send("Missing signature");
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const elements = sig.split(",");
    const signature = elements.find(e => e.startsWith("v1="))?.split("=")[1];

    const expectedSignature = crypto
      .createHmac("sha256", endpointSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    console.log("✅ Signature verified");

    const event = JSON.parse(rawBody);

    console.log("✅ Event type:", event.type);

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ FULL ERROR:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
