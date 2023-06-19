const REQUIRED_VARIABLES = [
  "SUBMIT_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
];

module.exports = function () {
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
};
