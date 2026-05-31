import { notFound } from "next/navigation";
import { ChannelPage } from "@/components/channel-page";
import { channels, type Channel } from "@/lib/channels";
import { isBlockedByUser } from "@/lib/block-service";
import { getUserByUsername } from "@/lib/user-service";
import { isFollowingUser } from "@/lib/follow-service";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const demoChannel = channels.find((channel) => channel.username === username);
  const user = await getUserByUsername(username);

  if (user && (await isBlockedByUser(user.id))) {
    notFound();
  }

  const channel = user ? toChannel(user) : demoChannel;

  if (!channel) {
    notFound();
  }

  return <ChannelPage channel={channel} initialFollowing={user ? await isFollowingUser(user.id) : false} />;
}

function toChannel(user: {
  id: string;
  username: string;
  followedBy: unknown[];
  stream: {
    isLive: boolean;
    name: string;
    thumbnailUrl: string | null;
  } | null;
}): Channel {
  return {
    username: user.username,
    displayName: user.username,
    title: user.stream?.name ?? `${user.username}'s stream`,
    category: "Just Chatting",
    viewers: 0,
    live: user.stream?.isLive ?? false,
    tags: ["New creator"],
    colors: ["#9147ff", "#1f1f23"],
    initials: user.username.slice(0, 2).toUpperCase(),
    hostIdentity: user.id,
    thumbnailUrl: user.stream?.thumbnailUrl,
  };
}
