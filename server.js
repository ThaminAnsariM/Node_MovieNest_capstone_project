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

// Stripe webhooks route
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// middleware

app.use(express.json());
app.use(cors())
app.use(clerkMiddleware())


// API Routes

app.get('/',(req,res)=> res.json('server is Live!'))
app.use('/api/inngest/',serve({client: inngest, functions}))
app.use('/api/show',showRouters)
app.use('/api/booking',bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)

app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`))