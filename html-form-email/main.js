const querystring = require("node:querystring");
const nodemailer = require("nodemailer");

const ErrorCode = {
  INVALID_REQUEST: "invalid-request",
  MISSING_FORM_DATA: "missing-form-data",
  SERVER_ERROR: "server-error",
};

module.exports = async ({ req, res, log, error }) => {
  const referer = req.headers["referer"];

  if (!referer) throw new Error("Missing referer header");

  // Validation of the request
  log("Validating request...");
  if (
    req.method !== "post" ||
    req.headers["content-type"] !== "application/x-www-form-urlencoded"
  ) {
    return res.redirect({
      url: buildErrorRedirectUrl(referer, ErrorCode.INVALID_REQUEST),
    });
  }

  log("Request is valid!");

  // Parsing form data
  log("Parsing form data...");
  const { name, email, message, _next } = querystring.parse(req.body);

  if (!name || !email || !message || !_next) {
    return res.redirect({
      url: buildErrorRedirectUrl(referer, ErrorCode.MISSING_FORM_DATA),
    });
  }

  const origin = req.headers["origin"];
  if (!origin) {
    error("Missing origin header.");
    return res.redirect({
      url: buildErrorRedirectUrl(referer, ErrorCode.SERVER_ERROR),
    });
  }

  const successRedirectUrl = new URL(_next, origin);
  log("Form data is valid!");

  // SMTP configuration from environment variables
  log("Getting SMTP configuration...");
  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SUBMIT_EMAIL } =
    process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USERNAME ||
    !SMTP_PASSWORD ||
    !SUBMIT_EMAIL
  ) {
    error("Missing SMTP configuration.");
    return res.redirect({
      url: buildErrorRedirectUrl(referer, ErrorCode.SERVER_ERROR),
    });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });

  log("SMTP configuration is valid!");

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: SUBMIT_EMAIL,
      subject: `Form submission from ${name}`,
      text: emailTemplate({ name, email, message }),
    });
  } catch (error) {
    error("Error sending email:", error);
    return res.redirect({
      url: buildErrorRedirectUrl(referer, ErrorCode.SERVER_ERROR),
    });
  }

  log("Email sent successfully!");

  // Redirecting the user to the success page.
  return res.redirect({ url: successRedirectUrl.toString() });
};

function emailTemplate({ name, email, message }) {
  return `You've received a new message!\n
Name: ${name}
Email: ${email}
Message: ${message}`;
}

function buildErrorRedirectUrl(referer, errorCode) {
  const url = new URL(referer);
  url.searchParams.set("code", errorCode);
  return url.toString();
}
