"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { blockUser, unblockUser } from "@/lib/block-service";
import { createRoomServiceClient } from "@/lib/livekit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { getUserIdFromParticipantIdentity } from "@/lib/participant-identity";
import { requireUuid } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { resolveLiveKitTokenIssuer } from "@/lib/token-issuer-service";

export async function onBlock(participantIdentity: string) {
  const self = await getSelf();
  await enforceActionRateLimit("block", self.id, 10, 60_000, 60);
  const userId = getUserIdFromParticipantIdentity(participantIdentity);
  const block = await blockUser(userId);

  try {
    const issuer = await resolveLiveKitTokenIssuer({ db, hostIdentity: block.blockerId });
    await createRoomServiceClient(issuer).removeParticipant(block.blockerId, participantIdentity);
  } catch {
    // The participant may be offline or LiveKit may not be configured in local demo mode.
  }

  revalidatePath("/");
  revalidatePath(`/${block.blocked.username}`);
  await writeAuditLog(self.id, "block_user", userId, { participantIdentity });
  return block;
}

export async function onUnblock(userId: string) {
  requireUuid(userId, "userId");
  const self = await getSelf();
  await enforceActionRateLimit("block", self.id, 10, 60_000, 60);
  const block = await unblockUser(userId);
  revalidatePath("/");
  revalidatePath(`/${block.blocked.username}`);
  await writeAuditLog(self.id, "unblock_user", userId);
  return block;
}
