import { db } from "@/lib/db";
import { getOptionalSelf, getSelf } from "@/lib/auth-service";
import { clearBlockFlag, isBlockedWithFailClosedFallback, setBlockFlag } from "@/lib/block-flag";

export async function isBlockedByUser(userId: string) {
  const self = await getOptionalSelf();

  if (!self || self.id === userId) return false;

  return isBlockedWithFailClosedFallback(db, userId, self.id);
}

export async function blockUser(userId: string) {
  const self = await getSelf();

  if (self.id === userId) throw new Error("Cannot block yourself");

  const block = await db.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: userId,
      },
    },
    update: {},
    create: {
      blockerId: self.id,
      blockedId: userId,
    },
    include: { blocked: true },
  });
  await setBlockFlag(self.id, userId);
  return block;
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

  const block = await db.block.delete({
    where: { id: existingBlock.id },
    include: { blocked: true },
  });
  await clearBlockFlag(self.id, userId);
  return block;
}

export async function getBlockedUsers() {
  const self = await getSelf();

  return db.block.findMany({
    where: { blockerId: self.id },
    include: { blocked: true },
    orderBy: { createdAt: "desc" },
  });
}
