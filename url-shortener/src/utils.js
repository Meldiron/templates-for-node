const { customAlphabet } = require("nanoid");

/**
 * @param {string | undefined} url
 * @returns {boolean}
 */
function isValidURL(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(ALPHABET);

module.exports = {
  isValidURL,
  generateShortCode: () => nanoid(6),
};
