import { createHash } from "node:crypto";
import { getClientAddressFromHeaders } from "./client-address-core.ts";

type MemoryBucket = {
  count: number;
  resetAt: number;
};

type RateLimiter = {
  enforce: (key: string, limit: number, windowMs?: number) => Promise<void>;
};

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Try again shortly.");
  }
}

export function createMemoryRateLimiter(): RateLimiter {
  const buckets = new Map<string, MemoryBucket>();

  return {
    async enforce(key, limit, windowMs = 60_000) {
      const now = Date.now();
      const current = buckets.get(key);

      if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
      }

      if (current.count >= limit) throw new RateLimitError();
      current.count += 1;
    },
  };
}

export function createUpstashRateLimiter({ url, token }: { url: string; token: string }): RateLimiter {
  return {
    async enforce(key, limit, windowMs = 60_000) {
      const encodedKey = encodeURIComponent(`argus:${key}`);
      const response = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", encodedKey],
          ["PEXPIRE", encodedKey, windowMs, "NX"],
        ]),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Rate limiter is unavailable");
      const [{ result }] = await response.json() as [{ result: number }, { result: number }];
      if (result > limit) throw new RateLimitError();
    },
  };
}

function getConfiguredRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return createUpstashRateLimiter({ url, token });
  if (process.env.NODE_ENV === "production") throw new Error("Production rate limiting is not configured");
  return memoryRateLimiter;
}

const memoryRateLimiter = createMemoryRateLimiter();

export const rateLimiter: RateLimiter = {
  async enforce(key, limit, windowMs) {
    return getConfiguredRateLimiter().enforce(key, limit, windowMs);
  },
};

export function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function clientRateLimitKey(requestHeaders: Headers) {
  return hashRateLimitKey(getClientAddressFromHeaders(requestHeaders));
}

export async function enforceActionRateLimit(scope: string, userId: string, userLimit: number, windowMs = 60_000, clientLimit = 100) {
  const { getClientAddress } = await import("./client-address.ts");
  const clientKey = hashRateLimitKey(await getClientAddress());
  await rateLimiter.enforce(`${scope}:ip:${clientKey}`, clientLimit, windowMs);
  await rateLimiter.enforce(`${scope}:user:${userId}`, userLimit, windowMs);
}
