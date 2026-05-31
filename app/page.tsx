import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getFeed } from "@/lib/feed-service";
import { getFollowedUsers } from "@/lib/follow-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import type { Channel } from "@/lib/channels";
import { getSelf } from "@/lib/auth-service";

export default async function Home() {
  const streams = await getFeed();
  let followedChannels: Channel[] = [];
  let viewerIdentity: string | undefined;
  let viewerUsername: string | undefined;

  if (isClerkConfigured) {
    try {
      const self = await getSelf();
      viewerIdentity = self.id;
      viewerUsername = self.username;
      followedChannels = (await getFollowedUsers()).flatMap(({ following }) =>
        following.stream ? [streamToChannel({ ...following.stream, user: following })] : [],
      );
    } catch {
      followedChannels = [];
    }
  }

  return <BrowseApp persistedChannels={streams.map(streamToChannel)} followedChannels={followedChannels} clerkConfigured={isClerkConfigured} viewerIdentity={viewerIdentity} viewerUsername={viewerUsername} />;
}
