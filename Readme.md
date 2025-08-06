# MovieNest Server

This is the backend server for the **MovieNest** movie ticket booking application.  
It provides REST APIs for user management, movie shows, bookings, Stripe payments, and email notifications.

---

## Features

- User authentication and management (Clerk)
- Movie show listing and seat selection
- Booking creation and payment (Stripe)
- Email notifications (Brevo/Sendinblue)
- Webhook handling for payment confirmation
- Admin and user roles

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- Stripe API
- Clerk (Authentication)
- Inngest (Background jobs)
- Nodemailer (Brevo/Sendinblue SMTP)

---

## Environment Variables

Create a `.env` file in the `server` directory with all required keys for MongoDB, Clerk, Inngest, TMDB, Stripe, and SMTP.  
**Do not share your actual secret keys publicly.**

---

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```
   or
   ```bash
   node server.js
   ```

3. **Environment:**
   - Make sure MongoDB and all third-party services are configured and accessible.

---

## API Endpoints

- `POST /api/auth/*` - User authentication
- `GET /api/show/now-playing` - Get now playing movies
- `POST /api/booking` - Create a booking
- `GET /api/booking/occupied-seats/:showId` - Get occupied seats for a show
- `POST /api/stripe/webhook` - Stripe webhook endpoint

---

## Webhooks

- Stripe webhooks are handled at `/api/stripe/webhook`  
  Ensure you use `express.raw({ type: 'application/json' })` middleware for this route.

---

