import { db } from "@/lib/db";

const publicStreamSelect = {
  id: true,
  name: true,
  thumbnailUrl: true,
  isLive: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
} as const;

export function getFeed() {
  return db.stream.findMany({
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
  });
}

export function searchStreams(term: string) {
  return db.stream.findMany({
    where: {
      OR: [
        { name: { contains: term } },
        { user: { username: { contains: term } } },
      ],
    },
    orderBy: [
      { isLive: "desc" },
      { updatedAt: "desc" },
    ],
    select: publicStreamSelect,
  });
}
