import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/Nodemailer.js";

export const inngest = new Inngest({ id: "Movie-ticket-booking" });

// Create user
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log("🔔 Clerk user.created event received");

    const data = event.data;
    if (!data) {
      console.error("❌ No data received");
      return;
    }

    const { id, first_name, last_name, email_addresses, image_url } = data;

    // Proceed with MongoDB user creation
    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    try {
      await clerkClient.users.updateUser(id, {
        privateMetadata: {
          role: "admin",
        },
      });
      console.log("✅ Metadata updated for user:", id);
    } catch (error) {
      console.error("❌ Failed to update metadata:", error.message);
    }

    await User.create(userData);
  }
);

// Delete user
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const data = event.data;
    if (!data) {
      console.error("No data received in user.deleted");
      return;
    }

    const { id } = data;
    await User.findByIdAndDelete(id);
  }
);

// Update user
const syncUserUpdate = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const data = event.data;
    if (!data) {
      console.error("No data received in user.updated");
      return;
    }

    const { id, first_name, last_name, email_addresses, image_url } = data;

    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData);
  }
);

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: `
  <div style="font-family: Arial, sans-serif; line-height: 1.5">
    <h2>Hi ${booking.user.name},</h2>
    <p>Your booking for 
      <strong style="color: #F84565;">"${
        booking.show.movie.title
      }"</strong> is confirmed.
    </p>
    <p>
      <strong>Date:</strong> ${new Date(
        booking.show.showDateTime
      ).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}<br/>
      <strong>Time:</strong> ${new Date(
        booking.show.showDateTime
      ).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}
    </p>
    <p>Enjoy the show!</p>
    <p>Thanks for booking with us!<br/>– MovieNest Team</p>
  </div>
`,
    });
  }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate,sendBookingConfirmationEmail,];
