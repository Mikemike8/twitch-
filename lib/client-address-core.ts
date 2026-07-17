export function trustsProxyHeaders(env: NodeJS.ProcessEnv = process.env) {
  return env.TRUST_PROXY_HEADERS === "true" || env.VERCEL === "1";
}

function cleanProxyAddress(value: string | null) {
  const address = value?.split(",")[0]?.trim();
  if (!address) return null;
  if (address.length > 64) return null;
  if (!/^[a-fA-F0-9:.]+$/.test(address)) return null;
  return address;
}

export function getClientAddressFromHeaders(requestHeaders: Headers, env: NodeJS.ProcessEnv = process.env) {
  if (!trustsProxyHeaders(env)) return "unknown";

  return cleanProxyAddress(requestHeaders.get("x-forwarded-for"))
    || cleanProxyAddress(requestHeaders.get("x-real-ip"))
    || "unknown";
}
