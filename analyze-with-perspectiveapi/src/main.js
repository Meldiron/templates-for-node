const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

module.exports = async ({ req, res }) => {
  const {
    PERSPECTIVE_API_KEY,
    APPWRITE_ENDPOINT,
    APPWRITE_FUNCTION_ID,
    APPWRITE_FUNCTION_PROJECT_ID,
  } = process.env;

  if (!PERSPECTIVE_API_KEY) {
    throw new Error("Function is missing required environment variables.");
  }

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(__dirname, "../static/index.html"))
      .toString();

    html = html
      .split("{{APPWRITE_FUNCTION_ID}}")
      .join(APPWRITE_FUNCTION_ID)
      .split("{{APPWRITE_FUNCTION_PROJECT_ID}}")
      .join(APPWRITE_FUNCTION_PROJECT_ID)
      .split("{{APPWRITE_ENDPOINT}}")
      .join(APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1");

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  // TODO: Remove body.payload (backward compatibility)
  if (!req.bodyString && !req.body.payload) {
    return res.send("Missing body with a prompt.", 400);
  }

  const response = await axios.post(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
    JSON.stringify({
      comment: {
        text: req.bodyString,
        type: "PLAIN_TEXT",
      },
      languages: ["en"],
      requestedAttributes: {
        TOXICITY: {},
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.send(response.data.attributeScores.TOXICITY.summaryScore.value);
};
