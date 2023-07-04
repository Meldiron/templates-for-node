const getEnvironment = require("./environment");
const { verifyKey } = require("discord-interactions");

module.exports = {
  verifyWebhook: async function (req) {
    const { DISCORD_PUBLIC_KEY } = getEnvironment();
    return await verifyKey(
      req.bodyString,
      req.headers["x-signature-ed25519"],
      req.headers["x-signature-timestamp"],
      DISCORD_PUBLIC_KEY
    );
  },
};
