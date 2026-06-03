"use server";

import { getSelf } from "@/lib/auth-service";
import { getRoomServiceClient } from "@/lib/livekit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { getUserIdFromParticipantIdentity } from "@/lib/participant-identity";
import { writeAuditLog } from "@/lib/audit";

export async function onKickParticipant(identity: string) {
  const self = await getSelf();
  await enforceActionRateLimit("kick", self.id, 60);
  const targetId = getUserIdFromParticipantIdentity(identity);
  await getRoomServiceClient().removeParticipant(self.id, identity);
  await writeAuditLog(self.id, "kick_participant", targetId, { participantIdentity: identity });
}
