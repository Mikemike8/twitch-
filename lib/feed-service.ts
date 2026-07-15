import { db } from "@/lib/db";
import { getOptionalSelf } from "@/lib/auth-service";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

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

async function queryFeed(page: number, visibility = {}) {
  const streams = await db.stream.findMany({
    where: visibility,
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

const getPublicFeedPage = unstable_cache(async (page: number) => queryFeed(page), ["public-feed-page"], { revalidate: 30, tags: [cacheTags.feeds] });

export async function getFeed(page = 1) {
  const visibility = await getVisibilityFilter();
  return Object.keys(visibility).length ? queryFeed(page, visibility) : getPublicFeedPage(page);
}

async function queryLiveFeed(page: number, visibility = {}) {
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

const getPublicLiveFeedPage = unstable_cache(async (page: number) => queryLiveFeed(page), ["public-live-feed-page"], { revalidate: 10, tags: [cacheTags.feeds] });

export async function getLiveFeed(page = 1) {
  const visibility = await getVisibilityFilter();
  return Object.keys(visibility).length ? queryLiveFeed(page, visibility) : getPublicLiveFeedPage(page);
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
