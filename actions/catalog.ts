"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getOptionalSelf, getSelf } from "@/lib/auth-service";
import { serializeAnalyticsMetadata } from "@/lib/analytics-validation";
import { hashRateLimitKey, rateLimiter } from "@/lib/rate-limit";
import { requireBoundedText } from "@/lib/validation";

const analyticsEventTypes = new Set([
  "VIDEO_STARTED",
  "VIDEO_PAUSED",
  "VIDEO_COMPLETED",
  "VIDEO_SEEKED",
  "WATCH_TIME_UPDATED",
]);

function requireCatalogRecordId(value: string, field: string) {
  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(value)) throw new Error(`${field} is invalid`);
  return value;
}

function requirePositiveSeconds(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 24 * 60 * 60) throw new Error(`${field} is invalid`);
  return value;
}

export async function savePlaybackProgress({
  durationSeconds,
  episodeId,
  positionSeconds,
}: {
  durationSeconds?: number;
  episodeId: string;
  positionSeconds: number;
}) {
  const self = await getSelf();
  const safeEpisodeId = requireCatalogRecordId(episodeId, "episodeId");
  const safePosition = requirePositiveSeconds(positionSeconds, "positionSeconds");
  const safeDuration = typeof durationSeconds === "number" ? requirePositiveSeconds(durationSeconds, "durationSeconds") : null;
  const completedAt = safeDuration && safeDuration > 0 && safePosition / safeDuration >= 0.9 ? new Date() : null;

  await db.$executeRaw`
    INSERT INTO "PlaybackProgress" ("id", "userId", "episodeId", "positionSeconds", "durationSeconds", "completedAt", "updatedAt")
    VALUES (${randomUUID()}, ${self.id}, ${safeEpisodeId}, ${safePosition}, ${safeDuration}, ${completedAt}, CURRENT_TIMESTAMP)
    ON CONFLICT ("userId", "episodeId") DO UPDATE SET
      "positionSeconds" = EXCLUDED."positionSeconds",
      "durationSeconds" = EXCLUDED."durationSeconds",
      "completedAt" = EXCLUDED."completedAt",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function recordVideoEvent({
  episodeId,
  metadata,
  positionSeconds,
  type,
}: {
  episodeId?: string;
  metadata?: Record<string, unknown>;
  positionSeconds?: number;
  type: string;
}) {
  if (!analyticsEventTypes.has(type)) throw new Error("Analytics event type is invalid");
  const { getClientAddress } = await import("@/lib/client-address");
  await rateLimiter.enforce(`video-event:ip:${hashRateLimitKey(await getClientAddress())}`, 120);
  const self = await getOptionalSelf();
  if (self) await rateLimiter.enforce(`video-event:user:${self.id}`, 240);
  const safeEpisodeId = episodeId ? requireCatalogRecordId(episodeId, "episodeId") : null;
  const safePosition = typeof positionSeconds === "number" ? requirePositiveSeconds(positionSeconds, "positionSeconds") : null;
  const metadataJson = serializeAnalyticsMetadata(metadata);

  await db.$executeRaw`
    INSERT INTO "AnalyticsEvent" ("id", "type", "userId", "episodeId", "positionSeconds", "metadata")
    VALUES (${randomUUID()}, ${type}::"AnalyticsEventType", ${self?.id ?? null}, ${safeEpisodeId}, ${safePosition}, ${metadataJson}::jsonb)
  `;
}

export async function commentOnEpisode(episodeId: string, body: string) {
  const self = await getSelf();
  const safeEpisodeId = requireCatalogRecordId(episodeId, "episodeId");
  const safeBody = requireBoundedText(body, "chatMessage");

  await db.$executeRaw`
    INSERT INTO "EpisodeComment" ("id", "episodeId", "userId", "body", "updatedAt")
    VALUES (${randomUUID()}, ${safeEpisodeId}, ${self.id}, ${safeBody}, CURRENT_TIMESTAMP)
  `;
}
