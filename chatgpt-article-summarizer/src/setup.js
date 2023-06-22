const { Client, Databases } = require("node-appwrite");
const getEnvironment = require("./environment");

async function setup() {
  console.log("Executing setup script...");

  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    BLOG_DATABASE_ID,
  } = getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    await databases.get(BLOG_DATABASE_ID);
    console.log(`Database exists.`);
  } catch (err) {
    // If the database does not exist, we can create it
    if (err.code !== 404) throw err;
    await setupDatabase(databases);
    console.log(`Database created.`);
  }
}

/**
 * @param {Databases} databases
 */
async function setupDatabase(databases) {
  const { BLOG_DATABASE_ID, BLOG_COLLECTION_ID, BLOG_COLLECTION_NAME } =
    getEnvironment();
  try {
    await databases.create(BLOG_DATABASE_ID, BLOG_COLLECTION_NAME);
    await databases.createCollection(
      BLOG_DATABASE_ID,
      BLOG_COLLECTION_ID,
      BLOG_COLLECTION_NAME
    );
    await databases.createStringAttribute(
      BLOG_DATABASE_ID,
      BLOG_COLLECTION_ID,
      "title",
      255,
      true
    );
    await databases.createStringAttribute(
      BLOG_DATABASE_ID,
      BLOG_COLLECTION_ID,
      "content",
      65536,
      false
    );
    await databases.createStringAttribute(
      BLOG_DATABASE_ID,
      BLOG_COLLECTION_ID,
      "summary",
      65536,
      false
    );
  } catch (err) {
    // If resource already exists, we can ignore the error
    if (err.code !== 409) throw err;
  }
}

setup();
