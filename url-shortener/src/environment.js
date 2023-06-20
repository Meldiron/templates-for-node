module.exports = function getEnvironment() {
  return {
    APPWRITE_API_KEY: getRequiredEnv("APPWRITE_API_KEY"),
    APPWRITE_ENDPOINT: getRequiredUrlEnv("APPWRITE_ENDPOINT"),
    APPWRITE_PROJECT_ID: getRequiredEnv("APPWRITE_PROJECT_ID"),
    SHORT_DOMAIN: getRequiredEnv("SHORT_DOMAIN"),
    DATABASE_ID: process.env.DATABASE_ID ?? "url-shortener",
    DATABASE_NAME: "URL Shortener",
    COLLECTION_ID: process.env.COLLECTION_ID ?? "urls",
    COLLECTION_NAME: "URLs",
  };
};

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

/**
 * @param {string} key
 * @return {string}
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
