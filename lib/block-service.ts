import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export async function isBlockedByUser(userId: string) {
  try {
    const self = await getSelf();

    if (self.id === userId) return false;

    return Boolean(
      await db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: self.id,
          },
        },
      }),
    );
  } catch {
    return false;
  }
}

export async function blockUser(userId: string) {
  const self = await getSelf();

  if (self.id === userId) throw new Error("Cannot block yourself");

  return db.block.create({
    data: {
      blockerId: self.id,
      blockedId: userId,
    },
    include: { blocked: true },
  });
}

export async function unblockUser(userId: string) {
  const self = await getSelf();

  if (self.id === userId) throw new Error("Cannot unblock yourself");

  const existingBlock = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: userId,
      },
    },
  });

  if (!existingBlock) throw new Error("Block does not exist");

  return db.block.delete({
    where: { id: existingBlock.id },
    include: { blocked: true },
  });
}

export async function getBlockedUsers() {
  const self = await getSelf();

  return db.block.findMany({
    where: { blockerId: self.id },
    include: { blocked: true },
    orderBy: { createdAt: "desc" },
  });
}
