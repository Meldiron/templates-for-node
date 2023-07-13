import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticFolder = path.join(__dirname, "../static");

export default async ({ req, res, log }) => {
  const config = JSON.parse(process.env.CONFIG ?? "[]");

  if (config.length === 0) {
    throw new Error("CONFIG environment variable must be set");
  }

  const targets = config.find(({ path }) => path === req.path)?.targets;
  if (!targets) {
    return res.empty();
  }

  const platform = detectPlatform(req.headers["user-agent"]);

  const target = targets[platform];
  if (!target || platform === "default") {
    return res.redirect(targets.default);
  }

  if (typeof target === "string") {
    return res.redirect(target);
  }

  if (typeof target === "object" && target.appName) {
    const template = readFileSync(
      path.join(staticFolder, "deeplink.html")
    ).toString();

    const html = template
      .split("{{APP_NAME}}")
      .join(target.appName)
      .split("{{APP_PATH}}")
      .join(target.appPath)
      .split("{{APP_PACKAGE}}")
      .join(target.appPackage ?? "")
      .split("{{FALLBACK}}")
      .join(target.fallback ?? target.default ?? "");

    return res.send(html, 200, { "Content-Type": "text/html; charset=utf-8" });
  }

  return res.empty();
};

const platformDetectors = {
  mobile: (userAgent) =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    ),
  android: (userAgent) => /Android/i.test(userAgent),
  ios: (userAgent) => /iPhone|iPad|iPod/i.test(userAgent),
  desktop: (userAgent) => /Windows|Macintosh|Linux/i.test(userAgent),
};

const detectPlatform = (userAgent) =>
  Object.entries(platformDetectors).reduce(
    (platform, [platformName, isPlatform]) =>
      isPlatform(userAgent) ? platformName : platform,
    "default"
  );
