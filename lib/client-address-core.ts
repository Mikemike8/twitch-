export function trustsProxyHeaders(env: NodeJS.ProcessEnv = process.env) {
  return env.TRUST_PROXY_HEADERS === "true" || env.VERCEL === "1";
}

export function getClientAddressFromHeaders(requestHeaders: Headers, env: NodeJS.ProcessEnv = process.env) {
  if (!trustsProxyHeaders(env)) return "unknown";

  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "unknown";
}
