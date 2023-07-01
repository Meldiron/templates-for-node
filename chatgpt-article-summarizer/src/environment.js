/**
 * @param {string} key
 * @return {string}
 */
function getRequiredEnv(key) {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

module.exports = function getEnvironment() {
  return {
    APPWRITE_ENDPOINT: getRequiredEnv("APPWRITE_ENDPOINT"),
    APPWRITE_PROJECT_ID: getRequiredEnv("APPWRITE_PROJECT_ID"),
    APPWRITE_API_KEY: getRequiredEnv("APPWRITE_API_KEY"),
    OPENAI_API_KEY: getRequiredEnv("OPENAI_API_KEY"),
    ARTICLE_DATABASE_ID: process.env.ARTICLE_DATABASE_ID ?? "articles",
    ARTICLE_COLLECTION_ID: process.env.ARTICLE_COLLECTION_ID ?? "articles",
    ARTICLE_COLLECTION_NAME: "Articles",
  };
};
