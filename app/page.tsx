import { BrowseApp } from "@/components/browse-app";
import { streamToChannel } from "@/lib/channel-adapter";
import { getFeed } from "@/lib/feed-service";

export default async function Home() {
  const streams = await getFeed();
  return <BrowseApp persistedChannels={streams.map(streamToChannel)} />;
}
