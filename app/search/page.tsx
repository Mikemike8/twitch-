import { BrowseApp } from "@/components/browse-app";
import { redirect } from "next/navigation";
import { streamToChannel } from "@/lib/channel-adapter";
import { searchStreams } from "@/lib/feed-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>;
}) {
  const { term = "" } = await searchParams;
  if (!term) redirect("/");
  const streams = await searchStreams(term);
  let viewerIdentity: string | undefined;
  let viewerUsername: string | undefined;

  if (isClerkConfigured) {
    try {
      const self = await getSelf();
      viewerIdentity = self.id;
      viewerUsername = self.username;
    } catch {
      viewerIdentity = undefined;
    }
  }

  return <BrowseApp persistedChannels={streams.map(streamToChannel)} demoFallback={false} forceDemoData initialQuery={term} clerkConfigured={isClerkConfigured} viewerIdentity={viewerIdentity} viewerUsername={viewerUsername} />;
}
