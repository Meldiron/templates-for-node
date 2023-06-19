const REQUIRED_VARIABLES = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUCCESS_URL",
  "CANCEL_URL",
];

module.exports = function () {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );

  let warnings = [];
  if (!isValidUrl(process.env.SUCCESS_URL)) {
    warnings.push("SUCCESS_URL is not a valid path.");
  }
  if (!isValidUrl(process.env.CANCEL_URL)) {
    warnings.push("CANCEL_URL is not a valid path.");
  }

  return {
    missing,
    warnings,
  };
};

function isValidUrl(...urls) {
  try {
    new URL(...urls);
    return true;
  } catch (err) {
    return false;
  }
}
