import Stripe from "stripe";

export default async function handler(req, res) {
  console.log("🔥 Webhook hit");

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // ✅ Read raw body as Buffer (REQUIRED for Stripe)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // ✅ Verify Stripe signature
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Event received:", event.type);

    // 🎯 HANDLE SUCCESSFUL PAYMENT
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      const email = invoice.customer_email;

      console.log("💰 Paid user:", email);

      if (email) {
        const response = await fetch(
          `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify({
              email: email,
              full_name: "",
              avatar_url: "",
              plan: "pro"
            })
          }
        );

        const data = await response.text();

        console.log("📡 Supabase response:", data);
        console.log("✅ User upserted into profiles");
      } else {
        console.log("⚠️ No email found on invoice");
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
