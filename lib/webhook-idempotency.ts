import { createHash } from "node:crypto";

const memoryEvents = new Map<string, number>();

function maxAgeMs() {
  const seconds = Number(process.env.WEBHOOK_MAX_AGE_SECONDS ?? 1800);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 1_800_000;
}

function pruneMemoryEvents(now: number) {
  for (const [key, expiresAt] of memoryEvents) {
    if (expiresAt <= now) memoryEvents.delete(key);
  }
}

async function setOnce(key: string, ttlSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Webhook idempotency store is not configured");
    const now = Date.now();
    pruneMemoryEvents(now);
    if (memoryEvents.has(key)) return false;
    memoryEvents.set(key, now + ttlSeconds * 1000);
    return true;
  }

  const response = await fetch(`${url}/set/${encodeURIComponent(key)}/1?NX=true&EX=${ttlSeconds}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Webhook idempotency store is unavailable");
  const body = await response.json() as { result: "OK" | null };
  return body.result === "OK";
}

export function webhookEventKey(provider: string, eventId: string, body: string) {
  const stableId = eventId || createHash("sha256").update(body).digest("hex");
  return `webhook:${provider}:${stableId}`;
}

export async function assertFreshWebhookEvent(provider: string, eventId: string, timestampMs: number, body: string) {
  const now = Date.now();
  if (!Number.isFinite(timestampMs)) throw new Error("Webhook timestamp is invalid");
  if (timestampMs > now + 60_000) throw new Error("Webhook timestamp is in the future");
  if (now - timestampMs > maxAgeMs()) throw new Error("Webhook event is too old");

  const accepted = await setOnce(webhookEventKey(provider, eventId, body), 86_400);
  if (!accepted) throw new Error("Webhook event was already processed");
}
