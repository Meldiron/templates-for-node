const { customAlphabet } = require("nanoid");
const { Client, Databases } = require("node-appwrite");

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

  const client = new Client();
  const databases = new Databases(client);
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  try {
    await databases.get(DATABASE_ID);
    log(`Database exists.`);
  } catch (err) {
    // If the database does not exist, we can create it
    if (err.code !== 404) throw error;
    await setupDatabase(databases);
    log(`Database created.`);
  }

  if (
    req.method === "POST" &&
    req.headers["content-type"] === "application/json"
  ) {
    const { url } = req.body;
    if (!url) {
      error("Missing url parameter.");
      return res.json({ error: "Missing url parameter" }, 400);
    }

    try {
      new URL(url);
    } catch (err) {
      error("Invalid url parameter.");
      return res.json({ error: "Invalid url parameter" }, 400);
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      nanoid(),
      {
        original: body.url,
      }
    );

    return res.json(
      {
        original: document.original,
        short: `${process.env.SHORT_DOMAIN}/${document.$id}`,
      },
      201
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
