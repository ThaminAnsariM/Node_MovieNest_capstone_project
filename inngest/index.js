import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/Nodemailer.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import QRCode from "qrcode";
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

    // Set private metadata for role: "admin"
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

    // Proceed with MongoDB user creation
    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

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
  async ({ event }) => {
    console.log("📩 Sending booking confirmation email for bookingId:", event.data.bookingId);

    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    console.log("✅ Booking fetched:", {
      user: booking?.user?.email,
      movie: booking?.show?.movie?.title,
      seats: booking?.bookedSeats,
    });

    // Generate QR code data
    const qrData = JSON.stringify({
      bookingId: booking._id,
      userId: booking.user._id,
      showId: booking.show._id,
      seats: booking.bookedSeats,
      movie: booking.show.movie.title,
      date: booking.show.showDateTime,
    });

    console.log("ℹ️ QR Data to encode:", qrData);

    // Create QR as buffer for attachment
    const qrCodeBuffer = await QRCode.toBuffer(qrData);
    console.log("📷 QR Code buffer generated (length):", qrCodeBuffer.length);

    const posterUrl = `https://image.tmdb.org/t/p/original${booking?.show?.movie?.poster_path || ""}`;
    console.log("🎞 Poster URL:", posterUrl);

    const emailHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
  <h2 style="color: #19f412ff;">🎟️ Booking Confirmed!</h2>

  <p>Hi <strong>${booking?.user?.name || "Guest"}</strong>,</p>

  <p>Your ticket for <strong style="color: #19f412ff;">"${
    booking?.show?.movie?.title || "Movie"
  }"</strong> is confirmed. Please find your booking details below:</p>

  <!-- Movie Poster -->
  <div style="text-align: center; margin: 20px 0;">
    <img src="${posterUrl}" alt="Movie Poster" style="max-width: 100%; border-radius: 10px;" />
  </div>

  <!-- Show Details -->
  <div style="background-color: #f9f9f9; padding: 15px 20px; border-radius: 10px; margin-bottom: 20px;">
    <p><strong>🎬 Movie:</strong> ${booking?.show?.movie?.title || "Movie"}</p>
    <p><strong>📅 Date:</strong> ${new Date(
      booking?.show?.showDateTime
    ).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</p>
    <p><strong>⏰ Time:</strong> ${new Date(
      booking?.show?.showDateTime
    ).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}</p>
    <p><strong>💺 Seat(s):</strong> ${booking?.bookedSeats?.join(", ") || "N/A"}</p>
  </div>

  <!-- QR Code -->
  <div style="text-align: center; margin: 20px 0;">
    <p style="margin-bottom: 8px;">Scan at the entrance</p>
    <img src="cid:qrCodeImage" alt="QR Code" style="width: 150px; height: 150px;" />
  </div>

  <p>Enjoy your movie experience! 🍿</p>

  <p style="margin-top: 20px;">Thanks for booking with <strong>MovieNest</strong>!<br />– The MovieNest Team</p>
</div>
    `;

    // Send email with QR code attached as CID
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      html: emailHtml,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrCodeBuffer,
          cid: "qrCodeImage", // same as in HTML
        },
      ],
    });

    console.log("✅ Booking confirmation email sent to:", booking.user.email);
  }
);




export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  sendBookingConfirmationEmail,
];
