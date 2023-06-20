const { Client, Databases } = require("node-appwrite");
const getEnvironment = require("./environment");

async function setup() {
  console.log("Executing setup script...");

  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    DATABASE_ID,
  } = getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

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
  const { DATABASE_ID, DATABASE_NAME, COLLECTION_ID, COLLECTION_NAME } =
    getEnvironment();
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
