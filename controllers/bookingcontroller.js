import { inngest } from "../inngest/index.js"; 
import Booking from "../models/booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";
import QRCode from "qrcode";

// to fectch seat availablety

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;
    const occupiedSeats = showData.occupiedSeats;
    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);
    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};


export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected Seats are not available.",
      });
    }

    const showData = await Show.findById(showId).populate("movie");

    const booking = new Booking({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    selectedSeats.forEach((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");
    await showData.save();

    const qrData = JSON.stringify({
      bookingId: booking._id,
      userId,
      show: showData._id,
      seats: selectedSeats,
      movie: showData.movie.title,
      date: showData.date,
      time: showData.startTime,
    });

    booking.qrCode = await QRCode.toDataURL(qrData);

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const line_items = [
      {
        price_data: {
          currency: "inr",
          product_data: { name: showData.movie.title },
          unit_amount: Math.floor(booking.amount) * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/bookings`,
      cancel_url: `${origin}/bookings`,
      line_items,
      mode: "payment",
      metadata: { bookingId: booking._id.toString() },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    booking.paymentLink = session.url;
    await booking.save(); // ✅ Save with qrCode and paymentLink

    // 🔔 Trigger Inngest after save
    await inngest.send({
      name: "app/show.booked",
      data: { bookingId: booking._id.toString() },
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.status(200).json({ success: true, occupiedSeats });
  } catch (error) {
    console.log(error.message);
    res.starus(500).json({ success: false, message: error.message });
  }
};
