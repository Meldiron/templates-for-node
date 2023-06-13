const querystring = require("node:querystring");
const nodemailer = require("nodemailer");

const ErrorCode = {
  INVALID_REQUEST: "invalid-request",
  MISSING_FORM_FIELDS: "missing-form-fields",
  SERVER_ERROR: "server-error",
};

const REQUIRED_VARIABLES = [
  "SUBMIT_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
];

module.exports = async ({ req, res, log, error }) => {
  const variables = validateEnvironment();
  if (variables.missing.length > 0) {
    error(
      `Missing required environment variables: ${variables.missing.join(", ")}`
    );
    throw new Error("Missing required environment variables.");
  }
  variables.warnings.forEach((warning) => log(`WARNING: ${warning}`));

  const { isValid, referer, origin } = isRequestValid(req);
  if (!isValid) {
    log("Invalid request.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.INVALID_REQUEST)
    );
  }

  if (!isOriginPermitted(origin)) {
    error("Origin not permitted.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.INVALID_REQUEST)
    );
  }

  const responseHeaders = {
    "Access-Control-Allow-Origin": origin,
  };

  const form = querystring.parse(req.body);
  if (!hasFormFields(form)) {
    log("Missing form data.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.MISSING_FORM_FIELDS),
      301,
      responseHeaders
    );
  }

  const transport = createEmailTransport();
  try {
    await transport.sendMail({
      from: form.email,
      to: process.env.SUBMIT_EMAIL,
      subject: `Form submission from ${form.email}`,
      text: formatEmailMessage(form),
    });
  } catch (e) {
    error("Error sending email: ", JSON.stringify(e, null, 2));
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.SERVER_ERROR),
      301,
      responseHeaders
    );
  }
  log("Email sent successfully!");

  return res.redirect(
    new URL(form._next, origin).toString(),
    301,
    responseHeaders
  );
};

function validateEnvironment() {
  const missing = REQUIRED_VARIABLES.filter(
    (variable) => !process.env[variable]
  );

  let warnings = [];
  if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS === "*") {
    warnings.push("No ALLOWED_ORIGINS set. This is a security risk!");
  }

  return {
    missing,
    warnings,
  };
}

function isRequestValid(req) {
  const referer = req.headers["referer"];
  const origin = req.headers["origin"];
  const isFormRequest =
    req.headers["content-type"] === "application/x-www-form-urlencoded";
  return { isValid: referer && origin && isFormRequest, referer, origin };
}

function isOriginPermitted(origin) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (!allowedOrigins || allowedOrigins === "*") return true;
  const allowedOriginsArray = allowedOrigins.split(",");
  return allowedOriginsArray.includes(origin);
}

function hasFormFields(form) {
  return !!(form.email && form.message && form._next);
}

function createEmailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD } = process.env;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });
}

function formatEmailMessage(form) {
  return `You've received a new message!\n
${Object.entries(form.filter((key) => key !== "_next"))
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;
}

function constructErrorRedirectUrl(referer, errorCode) {
  const url = new URL(referer);
  url.searchParams.set("code", errorCode);
  return url.toString();
}
