const getEnvironment = require("./environment");
const AppwriteService = require("./appwrite");
const OpenAIService = require("./openai");

/**
 * @typedef {Object} ArticleProperties
 * @property {string} content
 * @property {string} summary
 *
 * @typedef {import('node-appwrite').Models.Document & ArticleProperties} Article
 */

module.exports = async ({ req, log }) => {
  const appwrite = AppwriteService();
  const openai = OpenAIService();

  const article = parseEventData(req);
  log(`Create event for article ${article.$id}`);

  const articleSummary = await openai.generateArticleSummary(article);
  log(`Summary generated for article ${article.$id} - ${articleSummary}.`);

  await appwrite.updateArticleSummary(article.$id, articleSummary);
  log(`Updated article document.`);
};

/**
 * @param {*} req
 * @returns {Article}
 */
function parseEventData(req) {
  const { ARTICLE_DATABASE_ID, ARTICLE_COLLECTION_ID } = getEnvironment();

  const requestEvent = req.headers["x-appwrite-function"];
  const expectedEvent = `databases.${ARTICLE_DATABASE_ID}.collections.${ARTICLE_COLLECTION_ID}.documents.create`;

  if (requestEvent !== expectedEvent || req.body.$id) {
    throw new Error(`Invalid request event ${requestEvent}`);
  }

  return /** @type {Article} */ (req.body);
}
