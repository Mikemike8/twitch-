import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isClerkConfigured } from "@/lib/clerk-config";

export async function getSelf() {
  if (!isClerkConfigured) {
    throw new Error("Authentication is not configured");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const self = await db.user.findUnique({
    where: { externalUserId: userId },
  });

  if (!self) {
    throw new Error("User synchronization is incomplete");
  }

  return self;
}

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
