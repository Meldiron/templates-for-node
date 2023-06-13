const sdk = require("node-appwrite");

const REQUIRED_VARIABLES = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_URL_COLLECTION_ID",
];

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
