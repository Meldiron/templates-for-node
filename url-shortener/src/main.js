const { customAlphabet } = require("nanoid");
const { Client, Databases } = require("node-appwrite");
const getEnvironment = require("./environment");

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  6
);

module.exports = async ({ res, req, log, error }) => {
  const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } =
    getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

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

    const short = await generateShortUrl(databases, url);
    return res.json(
      {
        original: url,
        short,
      },
      201
    );
  }

  const shortId = req.path.replace(/^\/|\/$/g, "");
  log(`Fetching document from with ID: ${shortId}`);
  try {
    const url = await getOriginalUrl(databases, shortId);
    return res.redirect(url, 302);
  } catch (error) {
    if (error.code !== 404) throw error;
    return res.send(`404: Not found.`);
  }
};

async function generateShortUrl(databases, originalUrl) {
  const { SHORT_DOMAIN, DATABASE_ID, COLLECTION_ID } = getEnvironment();

  const document = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    nanoid(),
    {
      original: originalUrl,
    }
  );
  return `${SHORT_DOMAIN}/${document.$id}`;
}

async function getOriginalUrl(databases, shortId) {
  const { DATABASE_ID, COLLECTION_ID } = getEnvironment();

  const document = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID,
    shortId
  );
  return document.original;
}
