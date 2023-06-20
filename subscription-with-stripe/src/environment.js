/**
 * Get the value of the environment variable.
 * @param {string} key - The name of the environment variable.
 * @throws Will throw an error if the environment variable is not set.
 * @return {string} The value of the environment variable.
 */
function getRequiredEnv(key) {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get the value of a URL environment variable.
 * @param {string} key - The name of the environment variable.
 * @throws Will throw an error if the environment variable is not set or is not a valid URL.
 * @return {string} The value of the environment variable.
 */
function getRequiredUrlEnv(key) {
  const value = getRequiredEnv(key);
  if (!isValidUrl(value)) {
    throw new Error(`Environment variable ${key} is a not valid URL`);
  }
  return value;
}

/**
 * @param {string | undefined} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = function getEnvironment() {
  return {
    APPWRITE_ENDPOINT: getRequiredEnv("APPWRITE_ENDPOINT"),
    APPWRITE_PROJECT_ID: getRequiredUrlEnv("APPWRITE_PROJECT_ID"),
    APPWRITE_API_KEY: getRequiredEnv("APPWRITE_API_KEY"),
    STRIPE_WEBHOOK_SECRET: getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    STRIPE_SECRET_KEY: getRequiredEnv("STRIPE_SECRET_KEY"),
    SUCCESS_URL: getRequiredUrlEnv("SUCCESS_URL"),
    CANCEL_URL: getRequiredUrlEnv("CANCEL_URL"),
    DATABASE_ID: process.env.DATABASE_ID ?? "stripe-subscriptions",
    DATABASE_NAME: "Stripe Subscriptions",
    COLLECTION_ID: process.env.COLLECTION_ID ?? "subscriptions",
    COLLECTION_NAME: "Subscriptions",
  };
};
