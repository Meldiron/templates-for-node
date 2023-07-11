import fs from "fs";
import path from "path";

const staticFolder = path.join(process.cwd(), "../static");

export default async ({ req, res, log }) => {
  log("Hello, World! 👋");

  if (req.method === "GET") {
    let html = fs
      .readFileSync(path.join(staticFolder, "index.html"))
      .toString();

    return res
      .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      .end(html);
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(
    JSON.stringify({
      message: "Hello, World! 👋",
    })
  );
};
