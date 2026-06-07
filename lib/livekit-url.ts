export function normalizeLiveKitWsUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const wsUrl = trimmed
    .replace(/^https:\/\//i, "wss://")
    .replace(/^http:\/\//i, "ws://");

  try {
    const url = new URL(wsUrl);
    if (url.protocol !== "wss:" && url.protocol !== "ws:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
