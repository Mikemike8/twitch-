import { unstable_rethrow } from "next/navigation";
import { BrowseApp } from "@/components/browse-app";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";
import { boundedPage, boundedSearchTerm } from "@/lib/validation";
import type { Channel } from "@/lib/channels";
import { getCatalogTitles, getContinueWatching, searchCatalogTitles } from "@/lib/catalog-service";
import { logger } from "@/lib/logger";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; term?: string }>;
}) {
  const params = await searchParams;
  const term = boundedSearchTerm(params.term ?? "");
  const page = boundedPage(params.page);
  const [viewer, catalog] = await Promise.all([
    getViewerContext(),
    term ? searchCatalogTitles(term, page) : getCatalogTitles(page),
  ]);

  return <BrowseApp key={term} followedChannels={viewer.followedChannels} catalogChannels={catalog.channels} continueWatching={viewer.continueWatching} demoFallback={process.env.NODE_ENV !== "production"} initialQuery={term} clerkConfigured={isClerkConfigured} viewerIdentity={viewer.identity} viewerUsername={viewer.username} mobileBrowse pagination={{ page, hasNext: catalog.hasNext, baseHref: `/search?term=${encodeURIComponent(term)}&page=` }} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return { followedChannels: [] as Channel[], continueWatching: [] };

  try {
    const self = await getSelf();
    const continueWatching = await getContinueWatching(self.id);
    return { identity: self.id, username: self.username, followedChannels: [] as Channel[], continueWatching };
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("search.viewer_context.unavailable", { error: error instanceof Error ? error.message : "Unknown error" });
    return { followedChannels: [] as Channel[], continueWatching: [] };
  }
}
