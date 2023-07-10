const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res }) => {
  const { OPENAI_API_KEY, OPENAI_MAX_TOKENS } = process.env;

  if (!OPENAI_API_KEY) {
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
    `https://api.openai.com/v1/chat/completions`,
    JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: req.bodyString,
        },
      ],
      max_tokens: OPENAI_MAX_TOKENS || undefined,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return res.send(response.data.choices[0].message.content);
};
