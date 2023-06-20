const { Client, Databases } = require("node-appwrite");
const validate = require("./validate");

const DATABASE_ID = process.env.DATABASE_ID ?? "stripe-subscriptions";
const DATABASE_NAME = "Stripe Subscriptions";
const COLLECTION_ID = process.env.COLLECTION_ID ?? "subscriptions";
const COLLECTION_NAME = "Subscriptions";

async function setup() {
  console.log("Executing setup script...");

  const { missing, warnings } = validate();
  missing.forEach((variable) =>
    console.error(`Missing required environment variable: ${variable}`)
  );
  warnings.forEach((warning) => console.log(`WARNING: ${warning}`));

  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    await databases.get(DATABASE_ID);
    console.log(`Database exists.`);
  } catch (err) {
    // If the database does not exist, we can create it
    if (err.code !== 404) throw err;
    await setupDatabase(databases);
    console.log(`Database created.`);
  }
}

async function setupDatabase(databases) {
  try {
    await databases.create(DATABASE_ID, DATABASE_NAME);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_NAME
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      "userId",
      255,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      "subscriptionId",
      255,
      true
    );
  } catch (error) {
    // If resource already exists, we can ignore the error
    if (error.code !== 409) throw error;
  }
}

setup();
