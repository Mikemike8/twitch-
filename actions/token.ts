"use server";

import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";
import { hashRateLimitKey, rateLimiter } from "@/lib/rate-limit";
import { createViewerTokenService } from "@/lib/viewer-token-service";
import { getClientAddress } from "@/lib/client-address";
import { requireUuid } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { resolveLiveKitTokenIssuer } from "@/lib/token-issuer-service";

export async function createViewerToken(hostIdentity: string) {
  requireUuid(hostIdentity, "hostIdentity");
  await rateLimiter.enforce(`viewer-token:${hostIdentity}:${hashRateLimitKey(await getClientAddress())}`, 120);

  try {
    return await createViewerTokenService({
      db,
      getAuthenticatedViewer: async () => {
        const self = await getOptionalSelf();
        return self ? { id: self.id, username: self.username } : null;
      },
      getTokenIssuer: (resolvedHostIdentity) => resolveLiveKitTokenIssuer({ db, hostIdentity: resolvedHostIdentity }),
    })(hostIdentity);
  } catch (cause) {
    await writeAuditLog(hostIdentity, "token_issuance_failed", hostIdentity, {
      reason: cause instanceof Error ? cause.message : "Unknown token issuance failure",
    });
    throw cause;
  }
}
