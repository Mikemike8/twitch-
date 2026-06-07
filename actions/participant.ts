"use server";

import { getSelf } from "@/lib/auth-service";
import { createRoomServiceClient } from "@/lib/livekit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { getUserIdFromParticipantIdentity } from "@/lib/participant-identity";
import { writeAuditLog } from "@/lib/audit";
import { resolveLiveKitTokenIssuer } from "@/lib/token-issuer-service";
import { db } from "@/lib/db";

export async function onKickParticipant(identity: string) {
  const self = await getSelf();
  await enforceActionRateLimit("kick", self.id, 60);
  const targetId = getUserIdFromParticipantIdentity(identity);
  const issuer = await resolveLiveKitTokenIssuer({ db, hostIdentity: self.id });
  await createRoomServiceClient(issuer).removeParticipant(self.id, identity);
  await writeAuditLog(self.id, "kick_participant", targetId, { participantIdentity: identity });
}
