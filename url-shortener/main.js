const sdk = require("node-appwrite");

const REQUIRED_VARIABLES = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
];

const DATABASE_ID = process.env.DATABASE_ID ?? "url-shortener";
const DATABASE_NAME = "URL Shortener";
const COLLECTION_ID = process.env.COLLECTION_ID ?? "urls";
const COLLECTION_NAME = "URLs";

module.exports = async ({ res, req, log, error }) => {
  const variables = validateEnvironment();
  if (variables.missing.length > 0) {
    error(
      `Missing required environment variables: ${variables.missing.join(", ")}`
    );
    throw new Error("Missing required environment variables.");
  }

  const client = new sdk.Client();
  const databases = new sdk.Database(client);
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  log(`Setting up database ${DATABASE_ID}...`);
  const created = await setupDatabase(databases);
  log(`Database ${created ? "created" : "already exists"}.`);

  return res.json({
    path: req.path,
    url: req.url,
    query: req.query,
    body: req.body,
  });
};

function validateEnvironment() {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );
  return {
    missing,
  };
}

async function setupDatabase(databases) {
  try {
    await databases.create(DATABASE_ID, DATABASE_NAME);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_NAME
    );
    await Promise.all([
      databases.createUrlAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "original",
        true
      ),
      databases.createUrlAttribute(DATABASE_ID, COLLECTION_ID, "short", true),
    ]);
  } catch (error) {
    // If database already exists, we can ignore the error
    if (error.code !== 409) throw error;
    return false;
  }

  return true;
}
