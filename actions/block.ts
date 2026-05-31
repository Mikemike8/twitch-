"use server";

import { revalidatePath } from "next/cache";
import { blockUser, unblockUser } from "@/lib/block-service";
import { getRoomServiceClient } from "@/lib/livekit";

export async function onBlock(userId: string) {
  const block = await blockUser(userId);

  try {
    await getRoomServiceClient().removeParticipant(block.blockerId, block.blockedId);
  } catch {
    // The participant may be offline or LiveKit may not be configured in local demo mode.
  }

  revalidatePath("/");
  revalidatePath(`/${block.blocked.username}`);
  return block;
}

export async function onUnblock(userId: string) {
  const block = await unblockUser(userId);
  revalidatePath("/");
  revalidatePath(`/${block.blocked.username}`);
  return block;
}
