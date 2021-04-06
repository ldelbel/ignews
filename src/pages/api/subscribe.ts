import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from "faunadb";
import { getSession } from "next-auth/client";
import { stripe } from "../../services/stripe";
import { fauna } from "../../services/fauna";

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // we can't identify user using useSession here, but we can use cookies
    const session = await getSession({ req }); // this gets the session from cookies

    const user = await fauna.query<User>(
      q.Get(q.Match(q.Index("user_by_email"), q.Casefold(session.user.email)))
    );

    let customerId = user.data.stripe_customer_id;

    if (!customerId) {
      // we need to create a customer on stripe here. For now we have it only in FaunaDB
      //We'll use the data next-auth put in cookies when logged in
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        //metadata
      });

      // add stripe id to fauna so we can avoid creating duplicates on stripe later
      await fauna.query(
        q.Update(q.Ref(q.Collection("users"), user.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );
      customerId = stripeCustomer.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId, // id of the customer ON STRIPE
      payment_method_types: ["card"],
      billing_address_collection: "required", // or 'auto', which is the default
      line_items: [{ price: "price_1IcsSlKWOdgt4GQk3VisAJAP", quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
