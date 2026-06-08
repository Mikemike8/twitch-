export function normalizeLiveKitWsUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const wsUrl = trimmed
    .replace(/^https:\/\//i, "wss://")
    .replace(/^http:\/\//i, "ws://");

  try {
    const url = new URL(wsUrl);
    if (url.protocol !== "wss:" && url.protocol !== "ws:") return null;
    const normalized = url.toString();
    return url.pathname === "/" && !url.search && !url.hash ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}
