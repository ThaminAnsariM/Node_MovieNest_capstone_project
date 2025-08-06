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
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2c3e50;">🎉 Booking Confirmed!</h2>
      <p>Hi ${booking.user.name},</p>
      
      <p>Thank you for your payment. Your booking for <strong>${booking.show.movie.title}</strong> has been successfully confirmed.</p>
      
      <h3> Booking Details:</h3>
      <ul>
        <li><strong>Movie:</strong> ${booking.show.movie.title}</li>
        <li><strong>Date:</strong> ${booking.show.date}</li>
        <li><strong>Time:</strong> ${booking.show.time}</li>
        <li><strong>Theatre:</strong> ${booking.show.theatre.name}</li>
        <li><strong>Seats:</strong> ${booking.seats.join(', ')}</li>
        <li><strong>Total Paid:</strong> ₹${booking.totalAmount}</li>
      </ul>

      <p>If you have any questions or need support, feel free to reach out.</p>

      <p style="margin-top: 20px;">Enjoy your show! </p>

      <p>— Team MovieNest</p>
    </div>
  `
});

  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  sendBookingConfirmationEmail,
];
