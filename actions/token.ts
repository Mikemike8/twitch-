"use server";

import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";
import { hashRateLimitKey, rateLimiter } from "@/lib/rate-limit";
import { createViewerTokenService } from "@/lib/viewer-token-service";
import { getClientAddress } from "@/lib/client-address";
import { requireUuid } from "@/lib/validation";

export async function createViewerToken(hostIdentity: string) {
  requireUuid(hostIdentity, "hostIdentity");
  await rateLimiter.enforce(`viewer-token:${hostIdentity}:${hashRateLimitKey(await getClientAddress())}`, 120);
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }

  return createViewerTokenService({
    apiKey,
    apiSecret,
    db,
    getAuthenticatedViewer: async () => {
      const self = await getOptionalSelf();
      return self ? { id: self.id, username: self.username } : null;
    },
  })(hostIdentity);
}
