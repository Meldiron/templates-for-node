const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res, log }) => {
  const { VONAGE_API_KEY, VONAGE_API_SECRET } = process.env;

  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    throw new Error("Function is missing required environment variables.");
  }

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(__dirname, "../static/index.html"))
      .toString();

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  // TODO: Validate wevhook secret header

  const from = req.body.from;

  if (!from) {
    throw new Error("Payload invalid.");
  }

  const text = req.body.text ?? "I only accept text messages.";

  await axios.post(
    `https://messages-sandbox.nexmo.com/v1/messages`,
    JSON.stringify({
      from: "14157386102",
      to: from,
      message_type: "text",
      text: `Hi there! You sent me: ${text}`,
      channel: "whatsapp",
    }),
    {
      auth: {
        username: VONAGE_API_KEY,
        password: VONAGE_API_SECRET,
      },
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.send("OK");
};
