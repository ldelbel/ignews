import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { stripe } from "../../services/stripe";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // we can't identify user using useSession here, but we can use cookies
    const session = await getSession({ req }) // this gets the session from cookies

    // we need to create a customer on stripe here. For now we have it only in FaunaDB
    //We'll use the data next-auth put in cookies when logged in 
    const stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      //metadata     
    })

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id, // id of the customer ON STRIPE
      payment_method_types: ['card'],
      billing_address_collection: 'required', // or 'auto', which is the default
      line_items: [
        { price: 'price_1IcsSlKWOdgt4GQk3VisAJAP', quantity: 1 }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL
    })

    return res.status(200).json({ sessionId: stripeCheckoutSession.id })
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
}
  