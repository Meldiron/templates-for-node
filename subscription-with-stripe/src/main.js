const stripe = require("stripe");
const { Client } = require("node-appwrite");
const validate = require("./validate");

const StripeEvent = {
  CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
  CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
};

module.exports = async ({ req, res, log, error }) => {
  const { missing, warnings } = validate();
  missing.forEach((variable) =>
    error(`Missing required environment variable: ${variable}`)
  );
  warnings.forEach((warning) => log(`WARNING: ${warning}`));

  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

  switch (req.path) {
    case "/checkout":
      if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
        return res.redirect(process.env.CANCEL_URL, 303);
      }

      const userId = req.headers["APPWRITE_FUNCTION_USER_ID"];
      if (!userId) {
        return res.redirect(process.env.CANCEL_URL, 303);
      }

      const session = await createCheckoutSession(stripeClient, userId);
      if (!session) {
        error("Failed to create Stripe checkout session.");
        return res.redirect(process.env.CANCEL_URL, 303);
      }

      return res.redirect(session.url, 303);

    case "/webhook":
      const event = validateEvent(stripeClient, req);
      if (!event) return res.empty();

      if (event.type === StripeEvent.CUSTOMER_SUBSCRIPTION_CREATED) {
        const session = event.data.object;
        const userId = session.metadata.userId;

        log(`Subscription created for user ${userId}.`);
      }
      if (event.type === StripeEvent.CUSTOMER_SUBSCRIPTION_DELETED) {
        const session = event.data.object;
        const userId = session.metadata.userId;

        log(`Subscription deleted for user ${userId}.`);
      }

      return res.empty();

    default:
      return res.send("Not Found", 404);
  }
};

async function createCheckoutSession(stripeClient, userId) {
  try {
    return await stripeClient.subscriptions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Subscription",
              description: "12 months premium subscription to our app.",
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL,
      metadata: {
        userId,
      },
    });
  } catch (err) {
    return null;
  }
}

function validateEvent(stripeClient, req) {
  try {
    return stripeClient.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return null;
  }
}
