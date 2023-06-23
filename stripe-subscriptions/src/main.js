/// <reference types="stripe-event-types" />

const stripe = require("stripe");
const { Client, Databases } = require("node-appwrite");
const getEnvironment = require("./environment");

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

  const databases = new Databases(client);

  // Note: stripe API types are faulty
  /** @type {import('stripe').Stripe} */
  // @ts-ignore
  const stripeClient = stripe(STRIPE_SECRET_KEY);

  switch (req.path) {
    case "/checkout":
      const userId = req.headers["x-appwrite-user-id"];

      log("Headers:");
      req.headers.forEach((value, key) => {
        log(`${key} = ${value}`);
      });

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
      if (!event) return res.empty();

      if (event.type === "customer.subscription.created") {
        const session = event.data.object;
        const userId = session.metadata.userId;

        await upgradeUser(databases, userId);
        log(`Subscription created for user ${userId}.`);
      }
      if (event.type === "customer.subscription.deleted") {
        const session = event.data.object;
        const userId = session.metadata.userId;

        await downgradeUser(databases, userId);
        log(`Subscription deleted for user ${userId}.`);
      }

      return res.empty();

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

/**
 * @param {Databases} databases
 * @param {string} userId
 */
async function upgradeUser(databases, userId) {
  const { DATABASE_ID, COLLECTION_ID } = getEnvironment();

  if (!(await hasExistingSubscription(databases, userId))) {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, userId, {
      subscriptionType: "premium",
    });
  }
}

/**
 * @param {Databases} databases
 * @param {string} userId
 */
async function downgradeUser(databases, userId) {
  const { DATABASE_ID, COLLECTION_ID } = getEnvironment();

  if (await hasExistingSubscription(databases, userId)) {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, userId);
  }
}

/**
 * @param {Databases} databases
 * @param {string} userId
 */
async function hasExistingSubscription(databases, userId) {
  const { DATABASE_ID, COLLECTION_ID } = getEnvironment();

  try {
    await databases.getDocument(DATABASE_ID, COLLECTION_ID, userId);
    return true;
  } catch (err) {
    if (err.code !== 404) throw err;
    return false;
  }
}
