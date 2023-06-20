const querystring = require("node:querystring");
const nodemailer = require("nodemailer");
const getEnvironment = require("./environment");

const ErrorCode = {
  INVALID_REQUEST: "invalid-request",
  MISSING_FORM_FIELDS: "missing-form-fields",
  SERVER_ERROR: "server-error",
};

module.exports = async ({ req, res, log, error }) => {
  const {
    SUBMIT_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    ALLOWED_ORIGINS,
  } = getEnvironment();

  if (ALLOWED_ORIGINS === "*") {
    log(
      "WARNING: Allowing requests from any origin - this is a security risk!"
    );
  }

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
  if (
    !(
      form.email &&
      form._next &&
      typeof form.email === "string" &&
      typeof form._next === "string"
    )
  ) {
    log("Missing form data.");
    return res.redirect(
      constructErrorRedirectUrl(referer, ErrorCode.MISSING_FORM_FIELDS),
      301,
      responseHeaders
    );
  }
  log("Form data is valid.");

  const transport = nodemailer.createTransport({
    // @ts-ignore
    // Not sure what's going on here.
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });

  const mailOptions = {
    from: form.email,
    to: SUBMIT_EMAIL,
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
  log("Email sent successfully.");

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
function formatEmailMessage(form) {
  return `You've received a new message.\n
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
