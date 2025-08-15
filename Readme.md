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

{
  "Admin Management": [
    { "method": "GET", "endpoint": "/api/admin/is-admin", "description": "Check if the current user is an admin" },
    { "method": "GET", "endpoint": "/api/admin/dashboard", "description": "Retrieve admin dashboard metrics" },
    { "method": "GET", "endpoint": "/api/admin/all-shows", "description": "Get all shows" },
    { "method": "GET", "endpoint": "/api/admin/all-bookings", "description": "Get all bookings in the system" }
  ],
  "Booking Management": [
    { "method": "POST", "endpoint": "/api/booking/create", "description": "Create a new booking" },
    { "method": "GET", "endpoint": "/api/booking/seats/:showId", "description": "Get occupied seats for a given show" }
  ],
  "Show Management": [
    { "method": "GET", "endpoint": "/api/show/now-playing", "description": "Get now-playing movies (admin only)" },
    { "method": "POST", "endpoint": "/api/show/add", "description": "Add a new show" },
    { "method": "GET", "endpoint": "/api/show/all", "description": "Get all shows" },
    { "method": "GET", "endpoint": "/api/show/:movieId", "description": "Get details for a specific movie show" }
  ],
  "User Management": [
    { "method": "GET", "endpoint": "/api/user/bookings", "description": "Get all bookings for the logged-in user" },
    { "method": "POST", "endpoint": "/api/user/update-favorite", "description": "Update the user’s favourite movies" },
    { "method": "GET", "endpoint": "/api/user/favorites", "description": "Get the user’s favourite movies list" }
  ],
  "System & Webhooks": [
    { "method": "GET", "endpoint": "/", "description": "Health check — returns 'server is Live!'" },
    { "method": "POST", "endpoint": "/api/stripe", "description": "Stripe webhook endpoint" },
    { "method": "ANY", "endpoint": "/api/inngest/*", "description": "Inngest event handler endpoints" }
  ]
}


---

## Webhooks

- Stripe webhooks are handled at `/api/stripe`  
  Ensure you use `express.raw({ type: 'application/json' })` middleware for this route.

---

