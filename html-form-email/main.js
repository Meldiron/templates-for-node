const querystring = require("querystring");

module.exports = async ({ req, res }) => {
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

  return res.json({
    query: req.query,
    body: querystring.parse(req.body),
    headers: req.headers,
  });
};
