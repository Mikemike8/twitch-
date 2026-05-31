"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "@/lib/follow-service";

export async function onFollow(userId: string) {
  const follow = await followUser(userId);
  revalidatePath("/");
  revalidatePath(`/${follow.following.username}`);
  return follow;
}

export async function onUnfollow(userId: string) {
  const follow = await unfollowUser(userId);
  revalidatePath("/");
  revalidatePath(`/${follow.following.username}`);
  return follow;
}
