const querystring = require("node:querystring");
const getEnvironment = require("./environment");
const CorsService = require("./cors");
const MailService = require("./mail");

const ErrorCode = {
  INVALID_REQUEST: "invalid-request",
  MISSING_FORM_FIELDS: "missing-form-fields",
  SERVER_ERROR: "server-error",
};

module.exports = async ({ req, res, log, error }) => {
  const { SUBMIT_EMAIL, ALLOWED_ORIGINS } = getEnvironment();

  if (ALLOWED_ORIGINS === "*") {
    log(
      "WARNING: Allowing requests from any origin - this is a security risk!"
    );
  }

  const { isValid, referer, origin } = isRequestValid(req);
  if (!isValid) {
    log("Invalid request.");
    return res.redirect(urlWithCodeParam(referer, ErrorCode.INVALID_REQUEST));
  }
  log("Request is valid.");

  const cors = CorsService(origin);
  const mail = MailService();

  if (!cors.isOriginPermitted()) {
    error("Origin not permitted.");
    return res.redirect(urlWithCodeParam(referer, ErrorCode.INVALID_REQUEST));
  }
  log("Origin is permitted.");

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
      urlWithCodeParam(referer, ErrorCode.MISSING_FORM_FIELDS),
      301,
      cors.getHeaders()
    );
  }
  log("Form data is valid.");

  try {
    mail.send({
      to: SUBMIT_EMAIL,
      from: form.email,
      subject: `New form submission: ${origin}`,
      text: templateFormMessage(form),
    });
  } catch (err) {
    error(err.message);
    return res.redirect(
      urlWithCodeParam(referer, ErrorCode.SERVER_ERROR),
      301,
      cors.getHeaders()
    );
  }

  log("Email sent successfully.");

  return res.redirect(
    new URL(form._next, origin).toString(),
    301,
    cors.getHeaders()
  );
};

/**
 * @returns {{ isValid: boolean, referer: string, origin: string }}
 */
function isRequestValid(req) {
  const referer = req.headers["referer"];
  const origin = req.headers["origin"];
  const isFormRequest =
    req.headers["content-type"] === "application/x-www-form-urlencoded";
  return { isValid: referer && origin && isFormRequest, referer, origin };
}

/**
 * @param {import("node:querystring").ParsedUrlQuery} form
 * @returns  {string}
 */
function templateFormMessage(form) {
  return `You've received a new message.\n
${Object.entries(form)
  .filter(([key]) => key !== "_next")
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;
}

function urlWithCodeParam(referer, errorCode) {
  const url = new URL(referer);
  url.searchParams.set("code", errorCode);
  return url.toString();
}
