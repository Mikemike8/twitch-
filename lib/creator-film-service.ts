import { db } from "@/lib/db";
import type { Channel } from "@/lib/channels";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

export type CreatorFilmInput = {
  description?: string;
  playbackUrl?: string;
  posterUrl?: string;
  title: string;
  visibility?: "DRAFT" | "PUBLIC";
};

export async function createCreatorFilm(userId: string, input: CreatorFilmInput) {
  return db.creatorFilm.create({
    data: {
      userId,
      title: input.title,
      description: input.description || null,
      posterUrl: input.posterUrl || null,
      playbackUrl: input.playbackUrl || null,
      visibility: input.visibility ?? "PUBLIC",
    },
  });
}

export async function getCreatorLibrary(userId: string) {
  try {
    return db.creatorFilm.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    logger.error("creator_library.query_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return [];
  }
}

const getPublicCreatorFilmChannelPage = unstable_cache(async (limit: number) => {
  try {
    const films = await db.creatorFilm.findMany({
      where: { visibility: "PUBLIC" },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return films.map((film) => creatorFilmToChannel(film));
  } catch (error) {
    logger.error("creator_films.public_query_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return [] as Channel[];
  }
}, ["public-creator-film-channels"], { revalidate: 120, tags: [cacheTags.creatorFilms] });

export async function getPublicCreatorFilmChannels(limit = 12) {
  return getPublicCreatorFilmChannelPage(limit);
}

type CreatorFilmWithUser = {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  category: string;
  user: {
    imageUrl: string;
    username: string;
  };
};

function creatorFilmToChannel(film: CreatorFilmWithUser): Channel {
  return {
    kind: "catalog",
    source: "database",
    username: `creator-film-${film.id}`,
    displayName: film.title,
    title: film.title,
    category: film.category,
    viewers: viewersFor(film.id),
    live: false,
    verified: false,
    tags: ["Independent Film", `By ${film.user.username}`],
    colors: colorsFor(film.id),
    initials: initialsFor(film.title),
    posterUrl: film.posterUrl,
    catalogTitle: film.title,
    bio: film.description,
    imageUrl: film.user.imageUrl,
  };
}

function initialsFor(value: string) {
  return value.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function viewersFor(value: string) {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) * 11;
}

function colorsFor(value: string): [string, string] {
  const palettes: [string, string][] = [
    ["#e50914", "#7f1d1d"],
    ["#0ea5e9", "#312e81"],
    ["#22c55e", "#064e3b"],
    ["#f59e0b", "#7c2d12"],
  ];
  const index = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}
