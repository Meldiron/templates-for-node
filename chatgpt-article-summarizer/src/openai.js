const {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
} = require("openai");

/**
 * @typedef {Object} ArticleProperties
 * @property {string} content
 * @property {string} summary
 */

/**
 * @typedef {import('node-appwrite').Models.Document & ArticleProperties} Article
 */

const getEnvironment = require("./environment");

const COMPLETION_MODEL = "gpt-3.5-turbo";
const SYSTEM_MESSAGE = "You are a helpful assistant.";
const USER_MESSAGE_PREFIX =
  "Summarise the following article in two short sentences: ";

module.exports = function OpenAIService() {
  const { OPENAI_API_KEY } = getEnvironment();

  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  return {
    /**
     * @param article {Article}
     * @returns {Promise<string>}
     */
    generateArticleSummary: async function (article) {
      const systemMessage = {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: SYSTEM_MESSAGE,
      };

      const userMessage = {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: `${USER_MESSAGE_PREFIX}${article.content}`,
      };

      const { data } = await openai.createChatCompletion({
        model: COMPLETION_MODEL,
        messages: [systemMessage, userMessage],
      });

      const articleSummary = data.choices[0].message?.content;
      if (!articleSummary) {
        throw new Error(
          "Something went wrong whilst generating article summary."
        );
      }
      return articleSummary;
    },
  };
};
