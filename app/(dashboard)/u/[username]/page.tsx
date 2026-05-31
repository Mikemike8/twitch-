import { DashboardSettings } from "@/components/dashboard-settings";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelfStream } from "@/lib/stream-service";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let stream = {
    name: `${username}'s stream`,
    thumbnailUrl: null as string | null,
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  };

  if (isClerkConfigured) {
    stream = (await getSelfStream()) ?? stream;
  }

  return <DashboardSettings username={username} persistChanges={isClerkConfigured} stream={stream} uploadConfigured={Boolean(process.env.UPLOADTHING_TOKEN)} />;
}
