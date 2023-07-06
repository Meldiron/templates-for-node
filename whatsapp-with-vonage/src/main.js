const jwt = require("jsonwebtoken");
const sha256 = require("sha256");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res, log }) => {
  const { VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_API_SIGNATURE_SECRET } =
    process.env;

  if (!VONAGE_API_KEY || !VONAGE_API_SECRET || !VONAGE_API_SIGNATURE_SECRET) {
    throw new Error("Function is missing required environment variables.");
  }

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(__dirname, "../static/index.html"))
      .toString();

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  const token = (req.headers.authorization ?? "").split(" ")[1];
  var decoded = jwt.verify(token, VONAGE_API_SIGNATURE_SECRET, {
    algorithms: ["HS256"],
  });

  if (sha256(req.bodyString) != decoded["payload_hash"]) {
    throw new Error("Invalid signature.");
  }

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
