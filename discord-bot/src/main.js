const {
  InteractionResponseType,
  verifyKey,
  InteractionType,
} = require("discord-interactions");

function handleInteraction(interaction) {
  // Check if it's a command
  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    // Check if the command is '/hello'
    if (interaction.data.name === "hello") {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Hello from Appwrite 👋",
        },
      };
    }
  }

  // By default, respond with a simple acknowledgement
  return {
    type: InteractionResponseType.PONG,
  };
}

module.exports = async ({ req, res, log, error }) => {
  const isValidRequest = verifyKey(
    req.bodyString,
    req.headers["x-signature-ed25519"],
    req.headers["x-signature-timestamp"],
    process.env.DISCORD_PUBLIC_KEY
  );

  if (!isValidRequest) {
    error("Invalid request.");
    return res.send("Invalid request signature", 401);
  }
  log("Valid request.");

  try {
    // Handle the interaction and get a response
    const response = handleInteraction(req.body);

    // Send the response
    return res.json(response);
  } catch (err) {
    error(`Error: ${err}`);
    return res.send("Failed to process interaction", 500);
  }
};
