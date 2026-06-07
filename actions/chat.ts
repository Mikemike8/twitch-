"use server";

import { randomUUID } from "node:crypto";
import { DataPacket_Kind } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { isBlockedWithFailClosedFallback } from "@/lib/block-flag";
import { createRoomServiceClient } from "@/lib/livekit";
import { enforceActionRateLimit, rateLimiter } from "@/lib/rate-limit";
import { createParticipantIdentity } from "@/lib/participant-identity";
import { requireBoundedText, requireUuid } from "@/lib/validation";
import { resolveLiveKitTokenIssuer } from "@/lib/token-issuer-service";

const chatTopic = "lk.chat";

export async function onSendChatMessage(hostIdentity: string, value: string) {
  requireUuid(hostIdentity, "hostIdentity");
  const message = requireBoundedText(value, "chatMessage");
  const viewer = await getSelf();

  await enforceActionRateLimit("chat-message", viewer.id, 30, 60_000, 120);

  const host = await db.user.findUnique({ where: { id: hostIdentity } });
  if (!host) throw new Error("Stream unavailable");

  const stream = await db.stream.findUnique({ where: { userId: host.id } });
  if (!stream?.isLive || !stream.isChatEnabled) throw new Error("Chat is unavailable");

  if (viewer.id !== host.id && await isBlockedWithFailClosedFallback(db, host.id, viewer.id)) {
    throw new Error("Chat is unavailable");
  }

  const isFollowing = viewer.id === host.id || Boolean(
    await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewer.id,
          followingId: host.id,
        },
      },
    }),
  );

  if (stream.isChatFollowersOnly && !isFollowing) throw new Error("Followers only chat is enabled");
  if (stream.isChatDelayed) await rateLimiter.enforce(`chat-slow:${host.id}:${viewer.id}`, 1, 15_000);

  const payload = new TextEncoder().encode(JSON.stringify({
    id: randomUUID(),
    timestamp: Date.now(),
    message,
    senderName: viewer.username,
    senderIdentity: createParticipantIdentity(viewer.id),
  }));

  const issuer = await resolveLiveKitTokenIssuer({ db, hostIdentity: host.id });
  if (!issuer.apiUrl) throw new Error("LiveKit credentials are not configured");

  await createRoomServiceClient(issuer).sendData(host.id, payload, DataPacket_Kind.RELIABLE, { topic: chatTopic });
}
