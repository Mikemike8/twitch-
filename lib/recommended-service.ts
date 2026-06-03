import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";

const recommendedUserSelect = {
  id: true,
  username: true,
  imageUrl: true,
  bio: true,
  externalUserId: true,
  stream: {
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      isLive: true,
    },
  },
  _count: { select: { followedBy: true } },
} as const;

export async function getRecommendedUsers() {
  const selfId = (await getOptionalSelf())?.id;

  if (!selfId) {
    return db.user.findMany({
      orderBy: [
        { stream: { isLive: "desc" } },
        { followedBy: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      select: recommendedUserSelect,
      take: 12,
    });
  }

  return db.user.findMany({
    where: {
      AND: [
        { id: { not: selfId } },
        { followedBy: { none: { followerId: selfId } } },
        { blocking: { none: { blockedId: selfId } } },
        { blockedBy: { none: { blockerId: selfId } } },
      ],
    },
    orderBy: [
      { stream: { isLive: "desc" } },
      { followedBy: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    select: recommendedUserSelect,
    take: 12,
  });
}
