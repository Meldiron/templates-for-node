const REQUIRED_VARIABLES = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "SHORT_DOMAIN",
];

module.exports = function () {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );

  let warnings = [];
  if (!isValidUrl(process.env.SHORT_DOMAIN)) {
    warnings.push("SHORT_DOMAIN is not a valid URL.");
  }

  return {
    missing,
    warnings,
  };
};

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
