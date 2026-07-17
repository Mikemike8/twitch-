import { randomUUID } from "node:crypto";
import { logger } from "./logger.ts";

export type LiveTvChannel = {
  description: string;
  epgUrl?: string;
  id: string;
  name: string;
  posterUrl?: string;
  streamType: "dash" | "hls" | "vod";
  streamUrl: string;
};

export type EpgProgram = {
  channelId: string;
  description: string;
  endsAt: string;
  id: string;
  startsAt: string;
  title: string;
};

export type WatchClub = {
  channelId: string;
  createdAt: string;
  description: string | null;
  hostUsername: string;
  id: string;
  programId: string | null;
  startsAt: string;
  title: string;
};

const fallbackChannels: LiveTvChannel[] = [
  {
    description: "A virtual live television channel built from the app's hosted anime catalog and creator watch-room format.",
    id: "argus-anime",
    name: "ARGUS Anime TV",
    posterUrl: "/demo-posters/solo-leveling.jpg",
    streamType: "hls",
    streamUrl: "https://stream.mux.com/Ughp4MfIu01Nvt602FFsOLRiJ8Yo01rx7AXzE1TrL8DKZQ.m3u8",
  },
];

export function getConfiguredLiveTvChannels(env = process.env): LiveTvChannel[] {
  const raw = env.LIVE_TV_CHANNELS_JSON;
  if (!raw) return fallbackChannels;

  try {
    const parsed = JSON.parse(raw) as LiveTvChannel[];
    const channels = parsed.filter(isValidChannel);
    return channels.length ? channels : fallbackChannels;
  } catch (error) {
    logger.warn("live_tv.channels.invalid_json", { error: error instanceof Error ? error.message : "Unknown error" });
    return fallbackChannels;
  }
}

export async function getLiveTvSchedule(channels: LiveTvChannel[]) {
  const schedule = new Map<string, EpgProgram[]>();
  await Promise.all(channels.map(async (channel) => {
    schedule.set(channel.id, channel.epgUrl ? await loadXmlTvPrograms(channel) : fallbackSchedule(channel));
  }));
  return schedule;
}

export async function getWatchClubs(limit = 24) {
  try {
    const { db } = await import("./db.ts");
    const rows = await db.$queryRaw<WatchClub[]>`
      SELECT
        club."id",
        club."title",
        club."description",
        club."channelId",
        club."programId",
        club."startsAt"::text AS "startsAt",
        club."createdAt"::text AS "createdAt",
        "User"."username" AS "hostUsername"
      FROM "WatchClub" club
      JOIN "User" ON "User"."id" = club."userId"
      WHERE club."startsAt" >= NOW() - INTERVAL '2 hours'
      ORDER BY club."startsAt" ASC
      LIMIT ${limit}
    `;
    return rows;
  } catch (error) {
    logger.warn("watch_clubs.query_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return [] as WatchClub[];
  }
}

export async function createWatchClub(input: {
  channelId: string;
  description: string;
  programId: string | null;
  startsAt: Date;
  title: string;
  userId: string;
}) {
  const { db } = await import("./db.ts");
  const id = randomUUID();
  await db.$executeRaw`
    INSERT INTO "WatchClub" ("id", "title", "description", "channelId", "programId", "startsAt", "userId", "updatedAt")
    VALUES (${id}, ${input.title}, ${input.description || null}, ${input.channelId}, ${input.programId}, ${input.startsAt}, ${input.userId}, CURRENT_TIMESTAMP)
  `;
  return id;
}

function isValidChannel(value: LiveTvChannel) {
  return Boolean(
    value
      && typeof value.id === "string"
      && /^[a-z0-9_-]{2,80}$/i.test(value.id)
      && typeof value.name === "string"
      && typeof value.streamUrl === "string"
      && /^https?:\/\//i.test(value.streamUrl)
      && ["dash", "hls", "vod"].includes(value.streamType),
  );
}

async function loadXmlTvPrograms(channel: LiveTvChannel) {
  try {
    const response = await fetch(channel.epgUrl!, { cache: "no-store" });
    if (!response.ok) throw new Error(`EPG returned ${response.status}`);
    return parseXmlTv(await response.text(), channel.id);
  } catch (error) {
    logger.warn("live_tv.epg.load_failed", { channelId: channel.id, error: error instanceof Error ? error.message : "Unknown error" });
    return fallbackSchedule(channel);
  }
}

export function parseXmlTv(xml: string, channelId: string): EpgProgram[] {
  const programs: EpgProgram[] = [];
  const programmePattern = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;
  let match: RegExpExecArray | null;

  while ((match = programmePattern.exec(xml))) {
    const attrs = match[1] ?? "";
    if (!new RegExp(`channel=["']${escapeRegExp(channelId)}["']`, "i").test(attrs)) continue;
    const startsAt = xmlTvDate(attr(attrs, "start"));
    const endsAt = xmlTvDate(attr(attrs, "stop"));
    if (!startsAt || !endsAt) continue;
    const title = tagText(match[2], "title") || "Untitled program";
    programs.push({
      channelId,
      description: tagText(match[2], "desc"),
      endsAt: endsAt.toISOString(),
      id: `${channelId}:${startsAt.toISOString()}`,
      startsAt: startsAt.toISOString(),
      title,
    });
  }

  return programs.length ? programs.slice(0, 48) : fallbackSchedule({ id: channelId, name: channelId, description: "", streamType: "hls", streamUrl: "" });
}

function fallbackSchedule(channel: LiveTvChannel) {
  const now = new Date();
  const hour = new Date(now);
  hour.setMinutes(0, 0, 0);
  return Array.from({ length: 8 }, (_, index) => {
    const start = new Date(hour.getTime() + index * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      channelId: channel.id,
      description: index === 0 ? channel.description : "Community watch block with live chat and club viewing.",
      endsAt: end.toISOString(),
      id: `${channel.id}:block:${index}`,
      startsAt: start.toISOString(),
      title: index === 0 ? "Now Playing" : `Watch Club Block ${index + 1}`,
    };
  });
}

function attr(value: string, name: string) {
  return value.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function tagText(value: string, name: string) {
  return value.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function xmlTvDate(value: string) {
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/);
  if (!compact) return null;
  const [, year, month, day, hour, minute, second, offset] = compact;
  const zone = offset ? `${offset.slice(0, 3)}:${offset.slice(3)}` : "Z";
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${zone}`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
