const querystring = require("node:querystring");
const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  log("Hello, World! 👋");

  if (req.method !== "post") {
    res.json(
      {
        ok: false,
        msg: "Only POST requests are allowed",
      },
      400
    );
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return res.json(
      {
        ok: false,
        msg: "Only application/x-www-form-urlencoded requests are allowed",
      },
      400
    );
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD) {
    error("Missing SMTP credentials.");
    return res.json(
      {
        ok: false,
        msg: "Internal server error",
      },
      500
    );
  }

  const { INBOUND_EMAIL } = process.env;
  if (!INBOUND_EMAIL) {
    error("Missing INBOUND_EMAIL.");
    return res.json(
      {
        ok: false,
        msg: "Internal server error",
      },
      500
    );
  }

  const { name, email, message } = querystring.parse(req.body);
  if (!name || !email || !message) {
    return res.json(
      {
        ok: false,
        msg: "Missing required fields",
      },
      400
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
  });

  const body = `Name: ${name}
Email: ${email}
Message: ${message}`;

  await transporter.sendMail({
    from: `"${name}" <${email}>`,
    to: INBOUND_EMAIL,
    subject: "Form submission",
    body,
  });

  return res.json({
    ok: true,
    msg: `Success! Your message has been delivered.`,
  });
};
