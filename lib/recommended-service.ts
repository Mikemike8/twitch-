import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export async function getRecommendedUsers() {
  let selfId: string | undefined;

  try {
    selfId = (await getSelf()).id;
  } catch {
    selfId = undefined;
  }

  if (!selfId) {
    return db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  return db.user.findMany({
    where: {
      AND: [
        { id: { not: selfId } },
        { followedBy: { none: { followerId: selfId } } },
        { blocking: { none: { blockedId: selfId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}
