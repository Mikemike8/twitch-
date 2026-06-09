import { unstable_rethrow } from "next/navigation";
import { LiveDiscoveryApp } from "@/components/live-discovery-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getSelf } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import type { Channel } from "@/lib/channels";
import { getLiveFeed } from "@/lib/feed-service";
import { getFollowedUsers } from "@/lib/follow-service";
import { logger } from "@/lib/logger";

export default async function LivePage() {
  const [{ streams }, viewer] = await Promise.all([getLiveFeed(), getViewerContext()]);
  return <LiveDiscoveryApp liveChannels={streams.map(streamToChannel)} followedChannels={viewer.followedChannels} clerkConfigured={isClerkConfigured} viewerUsername={viewer.username} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return { followedChannels: [] as Channel[] };

  try {
    const self = await getSelf();
    const followedChannels = (await getFollowedUsers()).flatMap(({ following }) =>
      following.stream ? [streamToChannel({ ...following.stream, user: following })] : [],
    );
    return { identity: self.id, username: self.username, followedChannels };
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("live.viewer_context.unavailable", { error: error instanceof Error ? error.message : "Unknown error" });
    return { followedChannels: [] as Channel[] };
  }
}
