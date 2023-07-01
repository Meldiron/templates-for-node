/// <reference types="stripe-event-types" />

const stripe = require("stripe");
const AppwriteService = require("./appwrite");
const getEnvironment = require("./environment");

module.exports = async ({ req, res, log, error }) => {
  const { STRIPE_SECRET_KEY, CANCEL_URL } = getEnvironment();

  const appwrite = AppwriteService();

  // Note: stripe cjs API types are faulty
  /** @type {import('stripe').Stripe} */
  // @ts-ignore
  const stripeClient = stripe(STRIPE_SECRET_KEY);

  switch (req.path) {
    case "/checkout":
      const userId = req.headers["x-appwrite-user-id"];
      if (!userId) {
        error("User ID not found in request.");
        return res.redirect(CANCEL_URL, 303);
      }

      const session = await createCheckoutSession(stripeClient, userId);
      if (!session) {
        error("Failed to create Stripe checkout session.");
        return res.redirect(CANCEL_URL, 303);
      }

      return res.redirect(session.url, 303);

    case "/webhook":
      const event = validateWebhookRequest(stripeClient, req);
      if (!event) return res.json({ success: false }, 401);

      if (event.type === "customer.subscription.created") {
        const session = event.data.object;
        const userId = session.metadata.userId;

        if (await appwrite.hasSubscription(userId)) {
          error(`Subscription already exists - skipping`);
          return res.json({ success: true });
        }

        await appwrite.createSubscription(userId);
      }

      if (event.type === "customer.subscription.deleted") {
        const session = event.data.object;
        const userId = session.metadata.userId;

        if (!(await appwrite.hasSubscription(userId))) {
          error(`Subscription does not exist - skipping`);
          return res.json({ success: true });
        }

        await appwrite.deleteSubscription(userId);
      }

      return res.json({ success: true });

    default:
      return res.send("Not Found", 404);
  }
};

/**
 * @param {import("stripe").Stripe} stripeClient
 * @param {string} userId
 */
async function createCheckoutSession(stripeClient, userId) {
  const { SUCCESS_URL, CANCEL_URL } = getEnvironment();
  try {
    return await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium Subscription",
            },
            unit_amount: 1000,
            recurring: {
              interval: "year",
            },
          },
          quantity: 1,
        },
      ],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      mode: "subscription",
    });
  } catch (err) {
    return null;
  }
}

/**
 * @param {import("stripe").Stripe} stripeClient
 */
function validateWebhookRequest(stripeClient, req) {
  const { STRIPE_WEBHOOK_SECRET } = getEnvironment();
  try {
    const event = stripeClient.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
    return /** @type {import("stripe").Stripe.DiscriminatedEvent} */ (event);
  } catch (err) {
    return null;
  }
}
