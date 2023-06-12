const querystring = require("node:querystring");
const nodemailer = require("nodemailer");

module.exports = async ({ req, res, error }) => {
  console.log("Hello, World! 👋");

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

  const SMTP_URL = process.env.SMTP_URL;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USERNAME = process.env.SMTP_USERNAME;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
  if (!SMTP_URL || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD) {
    error("Missing SMTP credentials.");
    return res.json(
      {
        ok: false,
        msg: "Internal server error",
      },
      500
    );
  }

  const INBOUND_EMAIL = process.env.INBOUND_EMAIL;
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
    host: SMTP_URL,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
  });

  const body = `Name: ${name}
Email: ${email}
Message: ${message}
    `;

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
