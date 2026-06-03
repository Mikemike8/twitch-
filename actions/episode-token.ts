"use server";

import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { getOptionalSelf } from "@/lib/auth-service";
import { getClientAddress } from "@/lib/client-address";
import { hashRateLimitKey, rateLimiter } from "@/lib/rate-limit";
import { createParticipantIdentity } from "@/lib/participant-identity";

const episodeRoomPattern = /^anime:[a-z0-9-]{1,48}:s[0-9]{1,2}:e[0-9]{1,3}$/;

export async function createEpisodeChatToken(roomName: string) {
  if (!episodeRoomPattern.test(roomName)) {
    throw new Error("Invalid episode room");
  }

  await rateLimiter.enforce(`episode-token:${roomName}:${hashRateLimitKey(await getClientAddress())}`, 120);

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }

  const authenticatedViewer = await getOptionalSelf();
  const guestId = authenticatedViewer ? undefined : randomUUID();
  const viewer = authenticatedViewer ?? { id: guestId!, username: `guest-${guestId!.slice(0, 8)}` };
  const participantIdentity = createParticipantIdentity(viewer.id);
  const canChat = Boolean(authenticatedViewer);
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: viewer.username,
    ttl: "15m",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: false,
    canPublishData: canChat,
    canSubscribe: true,
  });

  return {
    token: await token.toJwt(),
    identity: viewer.id,
    participantIdentity,
    name: viewer.username,
    isAuthenticated: Boolean(authenticatedViewer),
    canChat,
    roomName,
  };
}
