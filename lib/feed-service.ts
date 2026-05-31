import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

const publicStreamSelect = {
  id: true,
  name: true,
  thumbnailUrl: true,
  isLive: true,
  user: {
    select: {
      id: true,
      username: true,
      imageUrl: true,
      bio: true,
    },
  },
} as const;

async function getVisibilityFilter() {
  try {
    const self = await getSelf();
    return { user: { blocking: { none: { blockedId: self.id } } } };
  } catch {
    return {};
  }
}

export async function getFeed() {
  return db.stream.findMany({
    where: await getVisibilityFilter(),
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
  });
}

export async function searchStreams(term: string) {
  const visibility = await getVisibilityFilter();

  return db.stream.findMany({
    where: {
      AND: [
        visibility,
        { OR: [
          { name: { contains: term } },
          { user: { username: { contains: term } } },
        ] },
      ],
    },
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
  });
}
