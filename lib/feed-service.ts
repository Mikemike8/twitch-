import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";

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
      externalUserId: true,
    },
  },
} as const;

const pageSize = 24;

async function getVisibilityFilter() {
  const self = await getOptionalSelf();
  return self ? { user: { blocking: { none: { blockedId: self.id } } } } : {};
}

export async function getFeed(page = 1) {
  const streams = await db.stream.findMany({
    where: await getVisibilityFilter(),
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });

  return { streams: streams.slice(0, pageSize), hasNext: streams.length > pageSize };
}

export async function getLiveFeed(page = 1) {
  const visibility = await getVisibilityFilter();
  const streams = await db.stream.findMany({
    where: {
      AND: [
        visibility,
        { isLive: true },
      ],
    },
    orderBy: [
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });

  return { streams: streams.slice(0, pageSize), hasNext: streams.length > pageSize };
}

export async function searchStreams(term: string, page = 1) {
  const visibility = await getVisibilityFilter();

  const streams = await db.stream.findMany({
    where: {
      AND: [
        visibility,
        { OR: [
          { name: { contains: term, mode: "insensitive" } },
          { user: { username: { contains: term, mode: "insensitive" } } },
        ] },
      ],
    },
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });

  return { streams: streams.slice(0, pageSize), hasNext: streams.length > pageSize };
}
