const { Client, Databases } = require("node-appwrite");
const { Configuration, OpenAIApi } = require("openai");
const getEnvironment = require("./environment");

module.exports = async ({ req, res, log, error }) => {
  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    OPENAI_API_KEY,
    BLOG_DATABASE_ID,
    BLOG_COLLECTION_ID,
  } = getEnvironment();

  const client = new Client();
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  // OpenAI API setup
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // Checking the APPWRITE_FUNCTION_EVENT header
  const functionEvent = req.headers["APPWRITE_FUNCTION_EVENT"];
  const expectedEvent = `databases.${BLOG_DATABASE_ID}.collections.${BLOG_COLLECTION_ID}.documents.create`;
  if (functionEvent !== expectedEvent) {
    log(`Function triggered by other event: ${functionEvent}`);
    return;
  }

  const documentId = req.body["$id"];
  const document = await databases.getDocument(
    BLOG_DATABASE_ID,
    "blog-posts",
    documentId
  );
  const content = document["content"];

  // Create a chat with OpenAI and ask it to summarize the blog post content
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `Summarize the following blog post content: ${content}`,
      },
    ],
  });

  // Extract the summary from the OpenAI response
  const choice = completion.data.choices[0];
  if (!choice?.message?.content) {
    error("Failed to generate summary.");
    return;
  }

  await databases.updateDocument(BLOG_DATABASE_ID, "blog-posts", documentId, {
    ...document,
    summary: choice.message.content,
  });

  log(`Summary generated for document ${documentId}.`);
};
