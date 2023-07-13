export default async ({ req, res, log }) => {
  const config = JSON.parse(process.env.CONFIG ?? "[]");

  if (config.length === 0) {
    throw new Error("CONFIG environment variable must be set");
  }

  const userAgent = req.headers["user-agent"];
  log(`User-Agent: ${userAgent}`);

  for (const { path, targets } of config) {
    if (path !== req.path) continue;

    const redirectTarget = getRedirectTarget(userAgent, targets);
    if (redirectTarget) return res.redirect(redirectTarget);

    if (targets.default) return res.redirect(targets.default);
  }

  return res.empty();
};

const userAgentDetectors = {
  mobile: (userAgent) =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    ),
  android: (userAgent) => /Android/i.test(userAgent),
  ios: (userAgent) => /iPhone|iPad|iPod/i.test(userAgent),
  desktop: (userAgent) => /Windows|Macintosh|Linux/i.test(userAgent),
};

function getRedirectTarget(userAgent, targets) {
  for (const [platform, isPlatform] of Object.entries(userAgentDetectors)) {
    const platformConfig = targets[platform];

    if (platformConfig && isPlatform(userAgent)) {
      if (typeof platformConfig === "string") {
        return platformConfig;
      }

      if (platformConfig.deepLink) {
        const redirect = new URL(platformConfig.deepLink);

        if (platformConfig.fallback) {
          redirect.searchParams.set("fallback", platformConfig.fallback);
        }

        return redirect.toString();
      }
    }
  }

  return;
}
