import { LiveDiscoveryApp } from "@/components/live-discovery-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getSelf } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import type { Channel } from "@/lib/channels";
import { getLiveFeed } from "@/lib/feed-service";
import { getFollowedUsers } from "@/lib/follow-service";

export default async function LivePage() {
  const [{ streams }, viewer] = await Promise.all([getLiveFeed(), getViewerContext()]);
  return <LiveDiscoveryApp liveChannels={streams.map(streamToChannel)} followedChannels={viewer.followedChannels} viewerUsername={viewer.username} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return { followedChannels: [] as Channel[] };

  try {
    const self = await getSelf();
    const followedChannels = (await getFollowedUsers()).flatMap(({ following }) =>
      following.stream ? [streamToChannel({ ...following.stream, user: following })] : [],
    );
    return { identity: self.id, username: self.username, followedChannels };
  } catch {
    return { followedChannels: [] as Channel[] };
  }
}
