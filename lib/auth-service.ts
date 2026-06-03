import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { isClerkConfigured } from "@/lib/clerk-config";
import { syncCurrentClerkUser } from "@/lib/clerk-user-sync";

export async function getSelf() {
  if (!isClerkConfigured) {
    throw new Error("Authentication is not configured");
  }

  const self = await getOptionalSelf();

  if (!self) throw new Error("Unauthorized");
  return self;
}

export const getOptionalSelf = cache(async () => {
  if (!isClerkConfigured) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const self = await db.user.findUnique({
    where: { externalUserId: userId },
  });

  if (!self) {
    return syncCurrentClerkUser(userId);
  }

  return self;
});

export async function isSelfUser(userId: string) {
  try {
    return (await getSelf()).id === userId;
  } catch {
    return false;
  }
}

export async function hasSelf() {
  try {
    await getSelf();
    return true;
  } catch {
    return false;
  }
}
