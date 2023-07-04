const {
  InteractionResponseType,
  InteractionType,
} = require("discord-interactions");
const discord = require("./discord");

module.exports = async ({ req, res, log, error }) => {
  if (!(await discord.verifyWebhook(req))) {
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
