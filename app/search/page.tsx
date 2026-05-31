import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { searchStreams } from "@/lib/feed-service";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>;
}) {
  const { term = "" } = await searchParams;
  const streams = term ? await searchStreams(term) : [];

  return <BrowseApp persistedChannels={streams.map(streamToChannel)} demoFallback={false} initialQuery={term} />;
}
