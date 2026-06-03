import { DashboardChatModeration } from "@/components/dashboard-chat-moderation";
import { getSelf } from "@/lib/auth-service";
import { getBlockedUsers } from "@/lib/block-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getRoomServiceClient } from "@/lib/livekit";

export default async function ChatPage() {
  let username = "";
  let participants: { identity: string; name: string }[] = [];
  let blockedUsers: { id: string; username: string }[] = [];
  const livekitConfigured = Boolean(process.env.LIVEKIT_API_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

  if (isClerkConfigured) {
    const self = await getSelf();
    username = self.username;
    blockedUsers = (await getBlockedUsers()).map(({ blocked }) => blocked);

    if (livekitConfigured) {
      try {
        participants = (await getRoomServiceClient().listParticipants(self.id))
          .filter((participant) => participant.identity !== self.id)
          .map((participant) => ({
            identity: participant.identity,
            name: participant.name || participant.identity,
          }));
      } catch {
        participants = [];
      }
    }
  }

  return <DashboardChatModeration channelHref={username ? `/${username}` : "/"} initialParticipants={participants} initialBlockedUsers={blockedUsers} livekitConfigured={livekitConfigured} />;
}
