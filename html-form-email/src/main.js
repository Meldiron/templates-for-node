const querystring = require("node:querystring");
const nodemailer = require("nodemailer");
const validate = require("./validate");

const ErrorCode = {
  INVALID_REQUEST: "invalid-request",
  MISSING_FORM_FIELDS: "missing-form-fields",
  SERVER_ERROR: "server-error",
};

module.exports = async ({ req, res, log, error }) => {
  const { missing, warnings } = validate();
  missing.forEach((variable) =>
    error(`Missing required environment variable: ${variable}`)
  );
  warnings.forEach((warning) => log(`WARNING: ${warning}`));

  const { isValid, referer, origin } = isRequestValid(req);
  if (!isValid) {
    log("Invalid request.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.INVALID_REQUEST)
    );
  }
  log("Request is valid.");

  if (!isOriginPermitted(origin)) {
    error("Origin not permitted.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.INVALID_REQUEST)
    );
  }
  log("Origin is permitted.");

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
  log("Form data is valid.");

  const transport = createEmailTransport();
  const mailOptions = {
    from: form.email,
    to: process.env.SUBMIT_EMAIL,
    subject: `Form submission from ${form.email}`,
    text: formatEmailMessage(form),
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    error(`Error sending email: ${JSON.stringify(err, null, 2)}`);
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
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD },
  });
}

function formatEmailMessage(form) {
  return `You've received a new message!\n
${Object.entries(form)
  .filter(([key]) => key !== "_next")
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;
}

function constructErrorRedirectUrl(referer, errorCode) {
  const url = new URL(referer);
  url.searchParams.set("code", errorCode);
  return url.toString();
}
