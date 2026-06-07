import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getFeed, searchStreams } from "@/lib/feed-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";
import { getFollowedUsers } from "@/lib/follow-service";
import { boundedPage, boundedSearchTerm } from "@/lib/validation";
import type { Channel } from "@/lib/channels";
import { getCatalogTitles, getContinueWatching, searchCatalogTitles } from "@/lib/catalog-service";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; term?: string }>;
}) {
  const params = await searchParams;
  const term = boundedSearchTerm(params.term ?? "");
  const page = boundedPage(params.page);
  const [{ streams, hasNext }, viewer, catalog] = await Promise.all([
    term ? searchStreams(term, page) : getFeed(page),
    getViewerContext(),
    term ? searchCatalogTitles(term, page) : getCatalogTitles(page),
  ]);

  return <BrowseApp key={term} persistedChannels={streams.map(streamToChannel)} followedChannels={viewer.followedChannels} catalogChannels={catalog.channels} continueWatching={viewer.continueWatching} demoFallback={process.env.NODE_ENV !== "production"} initialQuery={term} clerkConfigured={isClerkConfigured} viewerIdentity={viewer.identity} viewerUsername={viewer.username} mobileBrowse pagination={{ page, hasNext: hasNext || catalog.hasNext, baseHref: `/search?term=${encodeURIComponent(term)}&page=` }} />;
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
