const { customAlphabet } = require("nanoid");
const { Client, Databases } = require("node-appwrite");
const validate = require("./validate");

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  6
);

module.exports = async ({ res, req, log, error }) => {
  const { missing, warnings } = validate();
  missing.forEach((variable) =>
    error(`Missing required environment variable: ${variable}`)
  );
  warnings.forEach((warning) => log(`WARNING: ${warning}`));

  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

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
        original: body.url,
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
  const document = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    nanoid(),
    {
      original: originalUrl,
    }
  );
  return `${process.env.SHORT_DOMAIN}/${document.$id}`;
}

async function getOriginalUrl(databases, shortId) {
  const document = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID,
    shortId
  );
  return document.original;
}
