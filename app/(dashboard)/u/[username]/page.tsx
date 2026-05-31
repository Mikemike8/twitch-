import { DashboardSettings } from "@/components/dashboard-settings";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";
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
  let bio = "";

  if (isClerkConfigured) {
    stream = (await getSelfStream()) ?? stream;
    bio = (await getSelf()).bio ?? "";
  }

  return <DashboardSettings username={username} bio={bio} persistChanges={isClerkConfigured} stream={stream} uploadConfigured={Boolean(process.env.UPLOADTHING_TOKEN)} />;
}
