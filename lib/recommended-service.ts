import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

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
    return getAnonymousRecommendedUsers();
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

const getAnonymousRecommendedUsers = unstable_cache(async () => db.user.findMany({
  orderBy: [
    { stream: { isLive: "desc" } },
    { followedBy: { _count: "desc" } },
    { createdAt: "desc" },
  ],
  select: recommendedUserSelect,
  take: 12,
}), ["anonymous-recommended-users"], { revalidate: 60, tags: [cacheTags.recommendations, cacheTags.feeds] });
