module.exports = function getEnvironment() {
  return {
    SUBMIT_EMAIL: getRequiredEnv("SUBMIT_EMAIL"),
    SMTP_HOST: getRequiredEnv("SMTP_HOST"),
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USERNAME: getRequiredEnv("SMTP_USERNAME"),
    SMTP_PASSWORD: getRequiredEnv("SMTP_PASSWORD"),
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "*",
  };
};

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
