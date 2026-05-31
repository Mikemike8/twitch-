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
