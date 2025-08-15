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

[

## API Endpoints
Admin Management		
Method	Endpoint	Description
GET	/api/admin/is-admin	Check if the current user is an admin
GET	/api/admin/dashboard	Retrieve admin dashboard metrics
GET	/api/admin/all-shows	Get all shows
GET	/api/admin/all-bookings	Get all bookings in the system
		
Booking Management		
Method	Endpoint	Description
POST	/api/booking/create	Create a new booking
GET	/api/booking/seats/:showId	Get occupied seats for a given show
		
Show Management		
Method	Endpoint	Description
GET	/api/show/now-playing	Get now-playing movies (admin only)
POST	/api/show/add	Add a new show
GET	/api/show/all	Get all shows
GET	/api/show/:movieId	Get details for a specific movie show
		
User Management		
Method	Endpoint	Description
GET	/api/user/bookings	Get all bookings for the logged-in user
POST	/api/user/update-favorite	Update the user’s favourite movies
GET	/api/user/favorites	Get the user’s favourite movies list
		
System & Webhooks		
Method	Endpoint	Description
GET	/	Health check — returns "server is Live!"
POST	/api/stripe	Stripe webhook endpoint
Any	/api/inngest/*	Inngest event handler endpoints
		

]

---

## Webhooks

- Stripe webhooks are handled at `/api/stripe`  
  Ensure you use `express.raw({ type: 'application/json' })` middleware for this route.

---

