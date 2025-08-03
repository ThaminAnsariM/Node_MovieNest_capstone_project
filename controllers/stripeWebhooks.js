import Stripe from "stripe";
import Booking from "../models/booking.js";
import dotenv from "dotenv";
dotenv.config();

export const stripeWebhooks = async (request, response) => {
  console.log("🔑 STRIPE_WEBHOOKS_SECRET:", process.env.STRIPE_WEBHOOKS_SECRET);

  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOKS_SECRET
    );
  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}${process.env.STRIPE_WEBHOOKS_SECRET}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const payment_intent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: payment_intent.id,
        });
        const session = sessionList.data[0];

        const { bookingId } = session.metadata;
        console.log("💳 Payment succeeded for Booking ID:", bookingId);

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isPaid: true,
            paymentLink: "",
          },
          { new: true }
        );

        console.log("✅ Booking updated:", updatedBooking);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    response.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    response.status(500).send("Internal Server Error");
  }
};
