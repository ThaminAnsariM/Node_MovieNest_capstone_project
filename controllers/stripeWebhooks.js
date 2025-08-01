import srtipe, { Stripe } from "stripe"
import Booking from '../models/booking.js'
export const stripeWebhooks = async (request, response) =>{
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOKS_SECRET)
    } catch (error) {
        return response.status(400).send(`Webhooks Error: ${error.message}`);
    }

    try {

        switch(event.type){
            case "payment_intent.succeeded":{
                const paymentintent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentintent.id
                })
                const sessions = sessionList.data[0];
                const { bookingId } = sessions.metadata;

                await Booking.findByIdAndUpdate(bookingId,{
                    isPaid: true,
                    paymentLink:""
                })
                break;
            }
            

            default:
                console.log('Unhandled event type:',event.type)
        }
        response.json({recevied:true})
    } catch (error) {
        console.error("webhook processing error:",error);
        response.status(500).send("Internal Server Error")
    }
}
    
    