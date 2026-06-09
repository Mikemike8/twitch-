import { unstable_rethrow } from "next/navigation";
import { BrowseApp } from "@/components/browse-app";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";
import { boundedPage } from "@/lib/validation";
import { getCatalogTitles, getContinueWatching } from "@/lib/catalog-service";
import { logger } from "@/lib/logger";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = boundedPage((await searchParams).page);
  const [viewer, catalog] = await Promise.all([
    getViewerContext(),
    getCatalogTitles(page),
  ]);

  return <BrowseApp catalogChannels={catalog.channels} continueWatching={viewer.continueWatching} demoFallback={process.env.NODE_ENV !== "production"} clerkConfigured={isClerkConfigured} viewerIdentity={viewer.identity} viewerUsername={viewer.username} pagination={{ page, hasNext: catalog.hasNext, baseHref: "/?page=" }} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return { continueWatching: [] };

  try {
    const self = await getSelf();
    const continueWatching = await getContinueWatching(self.id);
    return { identity: self.id, username: self.username, continueWatching };
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("home.viewer_context.unavailable", { error: error instanceof Error ? error.message : "Unknown error" });
    return { continueWatching: [] };
  }
}
