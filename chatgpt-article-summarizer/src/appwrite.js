const { Client, Databases } = require("node-appwrite");
const getEnvironment = require("./environment");

module.exports = function AppwriteService() {
  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    ARTICLE_DATABASE_ID,
    ARTICLE_DATABASE_NAME,
    ARTICLE_COLLECTION_ID,
    ARTICLE_COLLECTION_NAME,
  } = getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  return {
    /**
     * @returns {Promise<boolean>}
     */
    doesArticlesDatabaseExist: async function () {
      try {
        await databases.get(ARTICLE_DATABASE_ID);
        return true;
      } catch (err) {
        if (err.code !== 404) throw err;
        return false;
      }
    },
    createArticlesDatabase: async function () {
      try {
        await databases.create(ARTICLE_DATABASE_ID, ARTICLE_DATABASE_NAME);
        await databases.createCollection(
          ARTICLE_DATABASE_ID,
          ARTICLE_COLLECTION_ID,
          ARTICLE_COLLECTION_NAME
        );
        await databases.createStringAttribute(
          ARTICLE_DATABASE_ID,
          ARTICLE_COLLECTION_ID,
          "title",
          255,
          true
        );
        await databases.createStringAttribute(
          ARTICLE_DATABASE_ID,
          ARTICLE_COLLECTION_ID,
          "content",
          65536,
          false
        );
        await databases.createStringAttribute(
          ARTICLE_DATABASE_ID,
          ARTICLE_COLLECTION_ID,
          "summary",
          65536,
          false
        );
      } catch (err) {
        // If resource already exists, we can ignore the error
        if (err.code !== 409) throw err;
      }
    },
    /**
     * @param {string} articleId
     * @param {string} summary
     * @throws {import('node-appwrite').AppwriteException}
     */
    updateArticleSummary: async function (articleId, summary) {
      await databases.updateDocument(
        ARTICLE_DATABASE_ID,
        ARTICLE_COLLECTION_ID,
        articleId,
        { summary }
      );
    },
  };
};
