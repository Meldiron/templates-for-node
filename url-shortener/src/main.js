const AppwriteService = require("./appwrite");
const getEnvironment = require("./environment");
const { isValidURL, generateShortCode } = require("./utils");

module.exports = async ({ res, req, log, error }) => {
  const { SHORT_DOMAIN } = getEnvironment();
  const appwrite = AppwriteService();

  if (
    req.method === "POST" &&
    req.headers["content-type"] === "application/json"
  ) {
    const { url } = req.body;
    if (!url || !isValidURL(url)) {
      error("Invalid url parameter.");
      return res.json({ error: "Invalid url parameter" }, 400);
    }

    const shortCode = generateShortCode();
    const urlEntry = await appwrite.createURLEntry(url, shortCode);
    if (!urlEntry) {
      error("Failed to create url entry.");
      return res.json({ error: "Failed to create url entry" }, 500);
    }

    return res.json(
      {
        short: `${SHORT_DOMAIN}/${urlEntry.$id}`,
        url: urlEntry.url,
      },
      201
    );
  }

  const shortId = req.path.replace(/^\/|\/$/g, "");
  log(`Fetching document from with ID: ${shortId}`);

  const urlEntry = await appwrite.getURLEntry(shortId);
  if (!urlEntry) {
    return res.send(`Not found.`, 404);
  }

  return res.redirect(urlEntry.url, 302);
};
