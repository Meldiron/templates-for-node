module.exports = async ({ res, log }) => {
  log("We have a new request!");
  return res.send("Hello, World! 👋");
};
