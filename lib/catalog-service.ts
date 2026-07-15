import { db } from "@/lib/db";
import type { Channel } from "@/lib/channels";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

type CatalogTitleRow = {
  firstEpisodeId: string | null;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  posterUrl: string | null;
  tags: string[] | null;
  episodeTitle: string | null;
};

export type ContinueWatchingItem = {
  channel: Channel;
  durationSeconds: number | null;
  episodeCode: string;
  episodeId: string;
  episodeTitle: string;
  positionSeconds: number;
  progressPercent: number;
};

type ContinueWatchingRow = CatalogTitleRow & {
  durationSeconds: number | null;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  positionSeconds: number;
  seasonNumber: number;
};

const pageSize = 24;

const getCatalogTitlesPage = unstable_cache(async (page: number) => {
  try {
    const rows = await db.$queryRaw<CatalogTitleRow[]>`
      SELECT
        ct."slug",
        ct."title",
        ct."description",
        ct."category",
        ct."posterUrl",
        COALESCE(array_remove(array_agg(DISTINCT tag."name"), NULL), ARRAY[]::TEXT[]) AS "tags",
        first_ep."id" AS "firstEpisodeId",
        first_ep."title" AS "episodeTitle"
      FROM "CatalogTitle" ct
      LEFT JOIN "CatalogTitleTag" ctt ON ctt."catalogTitleId" = ct."id"
      LEFT JOIN "CatalogTag" tag ON tag."id" = ctt."tagId"
      LEFT JOIN LATERAL (
        SELECT ep."id", ep."title"
        FROM "Season" season
        JOIN "Episode" ep ON ep."seasonId" = season."id"
        WHERE season."catalogTitleId" = ct."id"
        ORDER BY season."number" ASC, ep."number" ASC
        LIMIT 1
      ) first_ep ON TRUE
      WHERE ct."visibility" = 'PUBLIC'
      GROUP BY ct."id", first_ep."id", first_ep."title"
      ORDER BY
        CASE WHEN ct."slug" = 'solo-leveling' THEN 0 ELSE 1 END,
        ct."updatedAt" DESC
      LIMIT ${pageSize + 1}
      OFFSET ${(page - 1) * pageSize}
    `;

    return { channels: rows.slice(0, pageSize).map(rowToChannel), hasNext: rows.length > pageSize };
  } catch (error) {
    logger.error("catalog.titles.query_failed", { error: error instanceof Error ? error.message : "Unknown error", page });
    return { channels: [] as Channel[], hasNext: false };
  }
}, ["catalog-titles-page"], { revalidate: 120, tags: [cacheTags.catalog] });

export async function getCatalogTitles(page = 1) {
  return getCatalogTitlesPage(page);
}

const searchCatalogTitlesPage = unstable_cache(async (query: string, page: number) => {
  const term = `%${query}%`;

  try {
    const rows = await db.$queryRaw<CatalogTitleRow[]>`
      SELECT
        ct."slug",
        ct."title",
        ct."description",
        ct."category",
        ct."posterUrl",
        COALESCE(array_remove(array_agg(DISTINCT tag."name"), NULL), ARRAY[]::TEXT[]) AS "tags",
        first_ep."id" AS "firstEpisodeId",
        first_ep."title" AS "episodeTitle"
      FROM "CatalogTitle" ct
      LEFT JOIN "CatalogTitleTag" ctt ON ctt."catalogTitleId" = ct."id"
      LEFT JOIN "CatalogTag" tag ON tag."id" = ctt."tagId"
      LEFT JOIN LATERAL (
        SELECT ep."id", ep."title"
        FROM "Season" season
        JOIN "Episode" ep ON ep."seasonId" = season."id"
        WHERE season."catalogTitleId" = ct."id"
        ORDER BY season."number" ASC, ep."number" ASC
        LIMIT 1
      ) first_ep ON TRUE
      WHERE ct."visibility" = 'PUBLIC'
        AND (
          ct."title" ILIKE ${term}
          OR ct."category" ILIKE ${term}
          OR tag."name" ILIKE ${term}
        )
      GROUP BY ct."id", first_ep."id", first_ep."title"
      ORDER BY
        CASE WHEN ct."slug" = 'solo-leveling' THEN 0 ELSE 1 END,
        ct."updatedAt" DESC
      LIMIT ${pageSize + 1}
      OFFSET ${(page - 1) * pageSize}
    `;

    return { channels: rows.slice(0, pageSize).map(rowToChannel), hasNext: rows.length > pageSize };
  } catch (error) {
    logger.error("catalog.search.query_failed", { error: error instanceof Error ? error.message : "Unknown error", page });
    return { channels: [] as Channel[], hasNext: false };
  }
}, ["catalog-search-page"], { revalidate: 60, tags: [cacheTags.catalog] });

export async function searchCatalogTitles(query: string, page = 1) {
  return searchCatalogTitlesPage(query, page);
}

export async function getContinueWatching(userId: string) {
  try {
    const rows = await db.$queryRaw<ContinueWatchingRow[]>`
      SELECT
        ct."slug",
        ct."title",
        ct."description",
        ct."category",
        ct."posterUrl",
        COALESCE(array_remove(array_agg(DISTINCT tag."name"), NULL), ARRAY[]::TEXT[]) AS "tags",
        (
          SELECT first_ep."id"
          FROM "Season" first_season
          JOIN "Episode" first_ep ON first_ep."seasonId" = first_season."id"
          WHERE first_season."catalogTitleId" = ct."id"
          ORDER BY first_season."number" ASC, first_ep."number" ASC
          LIMIT 1
        ) AS "firstEpisodeId",
        ep."id" AS "episodeId",
        season."number" AS "seasonNumber",
        ep."number" AS "episodeNumber",
        ep."title" AS "episodeTitle",
        progress."positionSeconds",
        progress."durationSeconds"
      FROM "PlaybackProgress" progress
      JOIN "Episode" ep ON ep."id" = progress."episodeId"
      JOIN "Season" season ON season."id" = ep."seasonId"
      JOIN "CatalogTitle" ct ON ct."id" = season."catalogTitleId"
      LEFT JOIN "CatalogTitleTag" ctt ON ctt."catalogTitleId" = ct."id"
      LEFT JOIN "CatalogTag" tag ON tag."id" = ctt."tagId"
      WHERE progress."userId" = ${userId}
        AND progress."completedAt" IS NULL
        AND ct."visibility" = 'PUBLIC'
      GROUP BY ct."id", season."number", ep."id", progress."positionSeconds", progress."durationSeconds", progress."updatedAt"
      ORDER BY progress."updatedAt" DESC
      LIMIT 12
    `;

    return rows.map(rowToContinueWatchingItem);
  } catch (error) {
    logger.error("catalog.continue_watching.query_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return [] as ContinueWatchingItem[];
  }
}

function rowToChannel(row: CatalogTitleRow): Channel {
  return {
    kind: "catalog",
    source: "database",
    username: `catalog-${row.slug}`,
    displayName: row.title,
    title: row.episodeTitle ? `${row.title} - ${row.episodeTitle}` : row.title,
    category: row.category,
    viewers: viewersFor(row.slug),
    live: false,
    verified: true,
    tags: row.tags?.length ? row.tags : [row.category],
    colors: colorsFor(row.slug),
    initials: initialsFor(row.title),
    posterUrl: row.posterUrl,
    catalogTitle: row.title,
    bio: row.description,
    firstEpisodeId: row.firstEpisodeId,
  };
}

function rowToContinueWatchingItem(row: ContinueWatchingRow): ContinueWatchingItem {
  const durationSeconds = row.durationSeconds ?? null;
  const progressPercent = durationSeconds && durationSeconds > 0
    ? Math.min(100, Math.max(0, Math.round((row.positionSeconds / durationSeconds) * 100)))
    : 0;

  return {
    channel: rowToChannel(row),
    durationSeconds,
    episodeCode: `S${row.seasonNumber} E${row.episodeNumber}`,
    episodeId: row.episodeId,
    episodeTitle: row.episodeTitle,
    positionSeconds: row.positionSeconds,
    progressPercent,
  };
}

function initialsFor(value: string) {
  return value.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function viewersFor(value: string) {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) * 17;
}

function colorsFor(value: string): [string, string] {
  const palettes: [string, string][] = [
    ["#0ea5e9", "#7c3aed"],
    ["#22c55e", "#0f766e"],
    ["#ef4444", "#be123c"],
    ["#f59e0b", "#b45309"],
    ["#6366f1", "#0891b2"],
  ];
  const index = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}
