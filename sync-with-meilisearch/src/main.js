const { Client, Databases, Query } = require("node-appwrite");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res, log }) => {
  const {
    ALGOLIA_ENDPOINT,
    ALGOLIA_ADMIN_API_KEY,
    ALGOLIA_INDEX_NAME,
    ALGOLIA_SEARCH_API_KEY,

    APPWRITE_API_KEY,
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_ID,
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_FUNCTION_PROJECT_ID,
  } = process.env;

  if (
    !APPWRITE_API_KEY ||
    !APPWRITE_DATABASE_ID ||
    !APPWRITE_COLLECTION_ID ||
    !ALGOLIA_ENDPOINT ||
    !ALGOLIA_ADMIN_API_KEY ||
    !ALGOLIA_INDEX_NAME ||
    !ALGOLIA_SEARCH_API_KEY
  ) {
    throw new Error("Function is missing required environment variables.");
  }

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(__dirname, "../static/index.html"))
      .toString();

    html = html
      .split("{{ALGOLIA_ENDPOINT}}")
      .join(ALGOLIA_ENDPOINT)
      .split("{{ALGOLIA_INDEX_NAME}}")
      .join(ALGOLIA_INDEX_NAME)
      .split("{{ALGOLIA_SEARCH_API_KEY}}")
      .join(ALGOLIA_SEARCH_API_KEY);

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
    .setProject(APPWRITE_PROJECT_ID ?? APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  let cursor = null;

  do {
    const queries = [Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      queries
    );

    if (response.documents.length > 0) {
      cursor = response.documents[response.documents.length - 1].$id;
    } else {
      log(`No more documents found.`);
      cursor = null;
      break;
    }

    log(`Syncing chunk of ${response.documents.length} documents ...`);

    const records = response.documents;

    const indexResponse = await axios.post(
      `${ALGOLIA_ENDPOINT}/indexes/${ALGOLIA_INDEX_NAME}/documents?primaryKey=$id`,
      JSON.stringify(records),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ALGOLIA_ADMIN_API_KEY}`,
        },
      }
    );

    console.log(indexResponse);
  } while (cursor !== null);

  log("Sync finished.");

  return res.empty();
};
