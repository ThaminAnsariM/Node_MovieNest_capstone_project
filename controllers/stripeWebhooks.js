import Stripe from "stripe";
import Booking from "../models/booking.js";
import dotenv from "dotenv";

// Ensure dotenv is configured
dotenv.config();

// Create a middleware function that handles the raw body
export const stripeWebhooks = async (request, response) => {
  console.log("⚡ Webhook request received");
  
  // Check for environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ Missing STRIPE_SECRET_KEY environment variable");
    return response.status(500).send("Server configuration error: Missing Stripe secret key");
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable");
    return response.status(500).send("Server configuration error: Missing webhook secret");
  }
  
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];
  
  if (!sig) {
    console.error("❌ Missing Stripe-Signature header");
    return response.status(400).send("Webhook Error: No Stripe signature found");
  }

  console.log("🔍 Processing webhook with signature:", sig.substring(0, 15) + "...");
  
  let event;

  try {
    // Verify the webhook signature
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      whsec_EQgPvQpzMUUYgcJUIYnunJpDaZeJBBUu
    );
    console.log("✅ Webhook signature verified successfully");
  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error.message);
    // Don't expose the webhook secret in errors
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  console.log("📣 Received event type:", event.type);

  try {
    // Handle different event types
    switch (event.type) {
   
      
  case "payment_intent.succeeded": {
  const paymentIntent = event.data.object;
  console.log("💳 Payment intent succeeded:", paymentIntent.id);

  try {
    // Fetch the session associated with this payment intent
    const sessions = await stripeInstance.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1, // Narrow the results
    });

    if (sessions.data.length === 0) {
      console.warn("⚠️ No Checkout Session found for PaymentIntent:", paymentIntent.id);
      break;
    }

    const session = sessions.data[0];

    console.log("🔎 Retrieved session:", session.id);
    console.log("🧾 Metadata:", session.metadata);

    const { bookingId } = session.metadata || {};

    if (!bookingId) {
      console.error("❌ No bookingId found in session metadata");
      break;
    }

    console.log("🎟️ Processing payment for booking:", bookingId);

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        isPaid: true,
        paymentLink: "",
      },
      { new: true }
    );

    if (!updatedBooking) {
      console.error(`❌ Booking not found with ID: ${bookingId}`);
    } else {
      console.log("✅ Booking updated successfully:", updatedBooking._id);
    }

  } catch (retrieveError) {
    console.error("❌ Error retrieving session data:", retrieveError);
  }

  break;
}

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    // Always acknowledge receipt of the event
    return response.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    // Still return a 200 to acknowledge receipt
    return response.status(200).send("Event received with processing errors");
  }
};