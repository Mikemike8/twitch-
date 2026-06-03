import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createParticipantIdentity as defaultCreateParticipantIdentity } from "@/lib/participant-identity";
import { isBlockedWithFailClosedFallback } from "@/lib/block-flag";

type Viewer = {
  id: string;
  username: string;
};

type ViewerTokenDependencies = {
  apiKey: string;
  apiSecret: string;
  createAccessToken?: typeof AccessToken;
  createParticipantIdentity?: (userId: string) => string;
  db: PrismaClient;
  getAuthenticatedViewer: () => Promise<Viewer | null>;
  isBlocked?: (dbClient: PrismaClient, blockerId: string, blockedId: string) => Promise<boolean>;
  createGuestId?: () => string;
};

export function createViewerTokenService({
  apiKey,
  apiSecret,
  createAccessToken = AccessToken,
  createParticipantIdentity = defaultCreateParticipantIdentity,
  db,
  getAuthenticatedViewer,
  isBlocked = isBlockedWithFailClosedFallback,
  createGuestId = randomUUID,
}: ViewerTokenDependencies) {
  return async function issueViewerToken(hostIdentity: string) {
    const host = await db.user.findUnique({ where: { id: hostIdentity } });
    if (!host) throw new Error("Host was not found");

    const stream = await db.stream.findUnique({ where: { userId: host.id } });
    if (!stream) throw new Error("Stream was not found");

    const authenticatedViewer = await getAuthenticatedViewer();
    const guestId = authenticatedViewer ? undefined : createGuestId();
    const viewer = authenticatedViewer ?? { id: guestId!, username: `guest-${guestId!.slice(0, 8)}` };

    if (viewer.id !== host.id) {
      if (await isBlocked(db, host.id, viewer.id)) throw new Error("You cannot watch this stream");
    }

    const isHost = viewer.id === host.id;
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
    const canChat = Boolean(authenticatedViewer) && stream.isChatEnabled && (!stream.isChatFollowersOnly || isFollowing);
    const participantIdentity = createParticipantIdentity(viewer.id);
    const token = new createAccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: viewer.username,
      ttl: "15m",
    });

    token.addGrant({
      room: host.id,
      roomJoin: true,
      canPublish: false,
      canPublishData: false,
      canSubscribe: true,
    });

    return {
      token: await token.toJwt(),
      identity: viewer.id,
      participantIdentity,
      name: viewer.username,
      isAuthenticated: Boolean(authenticatedViewer),
      canChat,
      isChatDelayed: stream.isChatDelayed,
      isChatEnabled: stream.isChatEnabled,
      isChatFollowersOnly: stream.isChatFollowersOnly,
      isFollowing,
    };
  };
}
