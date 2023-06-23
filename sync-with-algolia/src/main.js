const { Client, Databases, Query } = require("node-appwrite");
const algoliasearch = require('algoliasearch');

module.exports = async ({ res, log }) => {
  const {
    ALGOLIA_APP_ID,
    ALGOLIA_ADMIN_API_KEY,
    ALGOLIA_INDEX_ID,

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
    !ALGOLIA_APP_ID ||
    !ALGOLIA_ADMIN_API_KEY ||
    !ALGOLIA_INDEX_ID
  ) {
    throw new Error("Function is missing required environment variables.");
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
    .setProject(APPWRITE_PROJECT_ID ?? APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  const algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX_ID);

  let cursor = null;

  do {
    const queries = [Query.limit(5)];

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

    const records = response.documents.map((document) => ({
      ...document,
      objectID: document.$id,
    }));
    await algoliaIndex.saveObjects(records);
  } while (cursor !== null);

  log("Sync finished.");

  return res.empty();
};
