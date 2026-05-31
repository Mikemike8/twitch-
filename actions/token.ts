"use server";

import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { getUserById } from "@/lib/user-service";

export async function createViewerToken(hostIdentity: string) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }

  const host = await getUserById(hostIdentity);

  if (!host) throw new Error("Host was not found");

  const stream = await db.stream.findUnique({
    where: { userId: host.id },
  });

  if (!stream) throw new Error("Stream was not found");

  let viewer: { id: string; username: string };

  try {
    const self = await getSelf();
    viewer = { id: self.id, username: self.username };
  } catch {
    const guestId = randomUUID();
    viewer = { id: guestId, username: `guest-${guestId.slice(0, 8)}` };
  }

  if (viewer.id !== host.id) {
    const block = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: host.id,
          blockedId: viewer.id,
        },
      },
    });

    if (block) throw new Error("You cannot watch this stream");
  }

  const isHost = viewer.id === host.id;
  const participantIdentity = isHost ? `${viewer.id}-viewer-${randomUUID()}` : viewer.id;
  const isFollowing = isHost || Boolean(
    await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewer.id,
          followingId: host.id,
        },
      },
    }),
  );
  const canChat = stream.isChatEnabled && (!stream.isChatFollowersOnly || isFollowing);

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: viewer.username,
  });

  token.addGrant({
    room: host.id,
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
    canChat,
    isChatDelayed: stream.isChatDelayed,
    isChatEnabled: stream.isChatEnabled,
    isChatFollowersOnly: stream.isChatFollowersOnly,
    isFollowing,
  };
}
