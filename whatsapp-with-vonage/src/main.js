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

  log(req.bodyString);
  log(req.headers);

  const response = await axios.post(
    `https://messages-sandbox.nexmo.com/v1/messages`,
    JSON.stringify({
      from: "14157386102",
      to: "421919178798",
      message_type: "text",
      text: "This is a WhatsApp Message sent from the Messages API",
      channel: "whatsapp",
    }),
    {
      auth: {
        username: VONAGE_API_KEY,
        password: VONAGE_API_SECRET
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PANGEA_REDACT_TOKEN}`,
      },
    }
  );

  return res.send(response.data.result.redacted_text);
};
