const { nanoid } = require("nanoid");
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

module.exports = async ({ res, req, log, error }) => {
  const variables = validateEnvironment();
  if (variables.missing.length > 0) {
    error(
      `Missing required environment variables: ${variables.missing.join(", ")}`
    );
    throw new Error("Missing required environment variables.");
  }

  const client = new sdk.Client();
  const databases = new sdk.Databases(client);
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  log(`Setting up database ${DATABASE_ID}...`);
  const created = await setupDatabase(databases);
  log(`Database ${created ? "created" : "already exists"}.`);

  log("content-type: " + req.headers["content-type"]);
  log("method: " + req.method);

  if (isFormRequest(req)) {
    const { url } = querystring.parse(req.body);
    if (!url) {
      error("Missing required parameter: url");
      throw new Error("Missing required parameter: url");
    }

    log(`Creating document in collection ${COLLECTION_ID}...`);
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      nanoid(6),
      {
        original: url,
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

    return res.redirect(302, document.original);
  } catch (error) {
    if (error.code !== 404) throw error;
    return res.send(`404: Not found.`);
  }
};

function validateEnvironment() {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );
  return {
    missing,
  };
}

function isFormRequest(req) {
  return (
    req.headers["content-type"] === "application/x-www-form-urlencoded" &&
    req.method === "post"
  );
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
    // If database already exists, we can ignore the error
    if (error.code !== 409) throw error;
    return false;
  }

  return true;
}
