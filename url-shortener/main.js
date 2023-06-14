const { customAlphabet } = require("nanoid");
const sdk = require("node-appwrite");
const querystring = require("node:querystring");

const REQUIRED_VARIABLES = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "SHORT_DOMAIN",
];

const DATABASE_ID = process.env.DATABASE_ID ?? "url-shortener";
const DATABASE_NAME = "URL Shortener";
const COLLECTION_ID = process.env.COLLECTION_ID ?? "urls";
const COLLECTION_NAME = "URLs";

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  6
);

module.exports = async ({ res, req, log, error }) => {
  const variables = validateEnvironment();
  if (variables.missing.length > 0) {
    error(
      `Missing required environment variables: ${variables.missing.join(", ")}`
    );
    throw new Error("Missing required environment variables.");
  }
  variables.warnings.forEach((warning) => log(`WARNING: ${warning}`));

  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  log("Appwrite client initialized.");

  try {
    await databases.get(DATABASE_ID);
    log(`Database exists.`);
  } catch (err) {
    // If the database does not exist, we can create it
    if (err.code !== 404) throw error;
    await setupDatabase(databases);
    log(`Database created.`);
  }

  if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
    const body = querystring.parse(req.body);
    if (!body || !body.url) {
      error("Missing required parameter: url");
      throw new Error("Missing required parameter: url");
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      nanoid(),
      {
        original: body.url,
      }
    );

    return res.send(
      `Link created: ${new URL(
        document.$id,
        process.env.SHORT_DOMAIN
      ).toString()}`
    );
  }

  const shortId = req.path.replace(/^\/|\/$/g, "");
  log(`Fetching document from with ID: ${shortId}`);
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      shortId
    );

    return res.redirect(document.original, 302);
  } catch (error) {
    if (error.code !== 404) throw error;
    return res.send(`404: Not found.`);
  }
};

function validateEnvironment() {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );

  let warnings = [];
  try {
    new URL(process.env.SHORT_DOMAIN);
  } catch (err) {
    warnings.push("SHORT_DOMAIN is not a valid URL.");
  }

  return {
    missing,
    warnings,
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
    await databases.createUrlAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      "original",
      true
    );
  } catch (error) {
    // If resource already exists, we can ignore the error
    if (error.code !== 409) throw error;
  }
}
