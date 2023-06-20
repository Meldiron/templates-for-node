module.exports = function getEnvironment() {
  return {
    DISCORD_PUBLIC_KEY: getRequiredEnv("DISCORD_PUBLIC_KEY"),
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
