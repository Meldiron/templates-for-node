const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res }) => {
  const { PANGEA_REDACT_TOKEN } = process.env;

  if (!PANGEA_REDACT_TOKEN) {
    throw new Error("Function is missing required environment variables.");
  }

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(__dirname, "../static/index.html"))
      .toString();

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  if (!req.bodyString) {
    return res.send("Missing body with a prompt.", 400);
  }

  const response = await axios.post(
    `https://redact.aws.eu.pangea.cloud/v1/redact`,
    JSON.stringify({
      text: req.bodyString,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PANGEA_REDACT_TOKEN}`,
      },
    }
  );

  return res.send(response.data.result.redacted_text);
};
