import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticFolder = path.join(__dirname, "../static");

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
