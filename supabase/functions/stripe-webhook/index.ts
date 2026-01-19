import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Received Stripe event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get metadata from the session
      const userId = session.metadata?.user_id;
      const itemsJson = session.metadata?.items;

      if (!userId || !itemsJson) {
        console.error("Missing user_id or items in session metadata");
        return new Response("Missing metadata", { status: 400 });
      }

      const items = JSON.parse(itemsJson) as Array<{
        productId: string;
        sellerId: string;
        price: number;
        quantity: number;
      }>;

      // Use service role to insert purchases (bypasses RLS)
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Insert each purchase - this will trigger notify_seller_on_purchase()
      for (const item of items) {
        const { error } = await supabaseAdmin.from("purchases").insert({
          user_id: userId,
          product_id: item.productId,
          seller_id: item.sellerId,
          price_paid: item.price * item.quantity,
          quantity: item.quantity,
        });

        if (error) {
          console.error("Error inserting purchase:", error);
        } else {
          console.log(`Purchase recorded: ${item.productId} for user ${userId}`);
        }
      }

      console.log(`Successfully processed ${items.length} purchase(s) for session ${session.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
