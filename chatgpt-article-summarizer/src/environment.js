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
    BLOG_DATABASE_ID: process.env.BLOG_DATABASE_ID ?? "blog-posts",
    BLOG_COLLECTION_ID: process.env.BLOG_COLLECTION_ID ?? "posts",
    BLOG_COLLECTION_NAME: "Blog Posts",
  };
};
