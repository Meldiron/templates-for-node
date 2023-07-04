const {
  InteractionResponseType,
  verifyKey,
  InteractionType,
} = require("discord-interactions");
const getEnvironment = require("./environment");

module.exports = async ({ req, res, log, error }) => {
  const { DISCORD_PUBLIC_KEY } = getEnvironment();

  const isValidRequest = verifyKey(
    req.bodyString,
    req.headers["x-signature-ed25519"],
    req.headers["x-signature-timestamp"],
    DISCORD_PUBLIC_KEY
  );

  if (!isValidRequest) {
    error("Invalid request.");
    return res.send("Invalid request signature", 401);
  }
  log("Valid request.");

  const interaction = req.body;
  if (
    interaction.type === InteractionType.APPLICATION_COMMAND &&
    interaction.data.name === "hello"
  ) {
    return res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Hello from Appwrite 👋",
      },
    });
  }

  return res.json(InteractionResponseType.PONG);
};
