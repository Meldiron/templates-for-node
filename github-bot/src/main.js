const getEnvironment = require("./environment");
const { Octokit } = require("@octokit/rest");
const { verify } = require("@octokit/webhooks-methods");

module.exports = async ({ res, req, log, error }) => {
  const { GITHUB_WEBHOOK_SECRET } = getEnvironment();

  // Verify the webhook signature
  const isValidWebhook = await verify(
    GITHUB_WEBHOOK_SECRET,
    req.bodyString,
    req.headers["X-Hub-Signature-256"]
  );
  if (!isValidWebhook) {
    error("Invalid signature");
    return res.json({ error: "Invalid signature" }, 401);
  }

  // We only care about issue events
  if (req.headers["X-GitHub-Event"] === "issues") {
    const issue = req.body.issue;
    // We only care about newly opened issues
    if (issue && req.body.action === "opened") {
      log(`Received event for issue ${issue.number}`);
      try {
        await postComment(issue);
        return res.empty();
      } catch (err) {
        error(`Error posting comment: ${err.message}`);
        return res.json({ error: "Error posting comment" }, 500);
      }
    }
  }
  return res.empty();
};

async function postComment(issue) {
  const { DISCORD_LINK, GITHUB_TOKEN } = getEnvironment();

  const octokit = new Octokit({
    auth: GITHUB_TOKEN,
  });

  const body = `Thanks for the issue report @${issue.user.login}! I'm inviting you to join our Discord for quicker support: ${DISCORD_LINK}`;

  await octokit.issues.createComment({
    owner: issue.repository.owner.login,
    repo: issue.repository.name,
    issue_number: issue.number,
    body: body,
  });
}
