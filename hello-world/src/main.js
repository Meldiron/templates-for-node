import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticFolder = join(__dirname, "../static");
// 13
export default async ({ req, res, log }) => {
  log("Hello, World! 👋");

  if (req.method === "GET") {
    let html = readFileSync(join(staticFolder, "index.html")).toString();

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  return res.json({
    message: "Hello, World! 👋",
  });
};
