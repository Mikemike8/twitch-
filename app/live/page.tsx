import { LiveTelevisionApp } from "@/components/live-television-app";
import { getSelf } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getConfiguredLiveTvChannels, getLiveTvSchedule, getWatchClubs } from "@/lib/live-tv-service";

export default async function LivePage() {
  const channels = getConfiguredLiveTvChannels();
  const [schedule, watchClubs, viewer] = await Promise.all([
    getLiveTvSchedule(channels),
    getWatchClubs(),
    getViewerContext(),
  ]);
  return <LiveTelevisionApp channels={channels} schedule={Object.fromEntries(schedule)} watchClubs={watchClubs} clerkConfigured={isClerkConfigured} viewerUsername={viewer.username} />;
}

async function getViewerContext() {
  if (!isClerkConfigured) return {};

  try {
    const self = await getSelf();
    return { username: self.username };
  } catch {
    return {};
  }
}
