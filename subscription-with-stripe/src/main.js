const stripe = require("stripe");
const { Client } = require("node-appwrite");
const getEnvironment = require("./environment");

const StripeEvent = {
  CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
  CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
};

module.exports = async ({ req, res, log, error }) => {
  const {
    STRIPE_SECRET_KEY,
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    CANCEL_URL,
  } = getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const stripeClient = stripe(STRIPE_SECRET_KEY);

  switch (req.path) {
    case "/checkout":
      if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
        return res.redirect(CANCEL_URL, 303);
      }

      const userId = req.headers["APPWRITE_FUNCTION_USER_ID"];
      if (!userId) {
        return res.redirect(CANCEL_URL, 303);
      }

      const session = await createCheckoutSession(stripeClient, userId);
      if (!session) {
        error("Failed to create Stripe checkout session.");
        return res.redirect(CANCEL_URL, 303);
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
  const { SUCCESS_URL, CANCEL_URL } = getEnvironment();
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
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        userId,
      },
    });
  } catch (err) {
    return null;
  }
}

function validateEvent(stripeClient, req) {
  const { STRIPE_WEBHOOK_SECRET } = getEnvironment();
  try {
    return stripeClient.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return null;
  }
}
