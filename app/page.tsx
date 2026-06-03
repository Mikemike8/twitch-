import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getFeed } from "@/lib/feed-service";
import { getFollowedUsers } from "@/lib/follow-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import type { Channel } from "@/lib/channels";
import { getSelf } from "@/lib/auth-service";
import { getRecommendedUsers } from "@/lib/recommended-service";
import { boundedPage } from "@/lib/validation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = boundedPage((await searchParams).page);
  const [{ streams, hasNext }, recommendedUsers, viewer] = await Promise.all([
    getFeed(page),
    getRecommendedUsers(),
    getViewerContext(),
  ]);

  const recommendedChannels = recommendedUsers.flatMap((user) =>
    user.stream ? [streamToChannel({ ...user.stream, user })] : [],
  );

  return <BrowseApp persistedChannels={streams.map(streamToChannel)} followedChannels={viewer.followedChannels} recommendedChannels={recommendedChannels} demoFallback={process.env.NODE_ENV !== "production"} clerkConfigured={isClerkConfigured} viewerIdentity={viewer.identity} viewerUsername={viewer.username} pagination={{ page, hasNext, baseHref: "/?page=" }} />;
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
