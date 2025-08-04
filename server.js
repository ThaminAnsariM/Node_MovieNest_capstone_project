import express from 'express'
import cors from 'cors';
import dotenv from "dotenv"
dotenv.config();
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest,functions } from './inngest/index.js';
import showRouters from './router/showRouters.js';
import bookingRouter from './router/bookingRouts.js';
import adminRouter from './router/adminRouts.js';
import userRouter from './router/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = 3000;
await connectDB();

// Use middleware that should apply to all routes EXCEPT webhooks
app.use(cors())
app.use(clerkMiddleware())

// Standard JSON parsing for normal routes (but NOT for webhook route)
app.use(express.json());

// Add your API routes
app.get('/',(req,res)=> res.json('server is Live!'))
app.use('/api/inngest/',serve({client: inngest, functions}))
app.use('/api/show',showRouters)
app.use('/api/booking',bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)

// Stripe webhook route - with raw body parser specifically for this route
// Change to app.post instead of app.use for a more specific route handler
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`))


