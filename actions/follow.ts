"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { followUser, unfollowUser } from "@/lib/follow-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { requireUuid } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { revalidateBrowseCaches } from "@/lib/cache-tags";

export async function onFollow(userId: string) {
  requireUuid(userId, "userId");
  const self = await getSelf();
  await enforceActionRateLimit("follow", self.id, 60);
  const follow = await followUser(userId);
  revalidateBrowseCaches();
  revalidatePath("/");
  revalidatePath(`/${follow.following.username}`);
  await writeAuditLog(self.id, "follow_user", userId);
  return follow;
}

export async function onUnfollow(userId: string) {
  requireUuid(userId, "userId");
  const self = await getSelf();
  await enforceActionRateLimit("follow", self.id, 60);
  const follow = await unfollowUser(userId);
  revalidateBrowseCaches();
  revalidatePath("/");
  revalidatePath(`/${follow.following.username}`);
  await writeAuditLog(self.id, "unfollow_user", userId);
  return follow;
}
