import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getFeed } from "@/lib/feed-service";
import { getFollowedUsers } from "@/lib/follow-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import type { Channel } from "@/lib/channels";
import { getSelf } from "@/lib/auth-service";
import { getRecommendedUsers } from "@/lib/recommended-service";
import { boundedPage } from "@/lib/validation";
import { getCatalogTitles, getContinueWatching } from "@/lib/catalog-service";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = boundedPage((await searchParams).page);
  const [{ streams, hasNext }, recommendedUsers, viewer, catalog] = await Promise.all([
    getFeed(page),
    getRecommendedUsers(),
    getViewerContext(),
    getCatalogTitles(page),
  ]);

  const recommendedChannels = recommendedUsers.flatMap((user) =>
    user.stream ? [streamToChannel({ ...user.stream, user })] : [],
  );

  return <BrowseApp persistedChannels={streams.map(streamToChannel)} followedChannels={viewer.followedChannels} recommendedChannels={recommendedChannels} catalogChannels={catalog.channels} continueWatching={viewer.continueWatching} demoFallback={process.env.NODE_ENV !== "production"} clerkConfigured={isClerkConfigured} viewerIdentity={viewer.identity} viewerUsername={viewer.username} pagination={{ page, hasNext: hasNext || catalog.hasNext, baseHref: "/?page=" }} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return { followedChannels: [] as Channel[], continueWatching: [] };

  try {
    const self = await getSelf();
    const [followedUsers, continueWatching] = await Promise.all([
      getFollowedUsers(),
      getContinueWatching(self.id),
    ]);
    const followedChannels = followedUsers.flatMap(({ following }) =>
      following.stream ? [streamToChannel({ ...following.stream, user: following })] : [],
    );
    return { identity: self.id, username: self.username, followedChannels, continueWatching };
  } catch {
    return { followedChannels: [] as Channel[], continueWatching: [] };
  }
}
