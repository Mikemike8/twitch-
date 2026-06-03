import { notFound } from "next/navigation";
import { MobileProfilePage } from "@/components/mobile-profile-page";
import { channels, type Channel } from "@/lib/channels";
import { isBlockedByUser } from "@/lib/block-service";
import { getUserByUsername } from "@/lib/user-service";
import { isFollowingUser } from "@/lib/follow-service";
import { hasSelf, isSelfUser } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";
import { publicUsername, redactPrivateIdentity } from "@/lib/public-identity";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const demoChannel = process.env.NODE_ENV !== "production"
    ? channels.find((channel) => channel.username === username)
    : undefined;
  const user = await getUserByUsername(username);

  const [blocked, selfProfile, initialFollowing, authenticated] = user
    ? await Promise.all([
        isBlockedByUser(user.id),
        isSelfUser(user.id),
        isFollowingUser(user.id),
        hasSelf(),
      ])
    : [false, false, false, await hasSelf()];

  if (blocked) {
    notFound();
  }

  const channel = user ? toChannel(user) : demoChannel;

  if (!channel) {
    notFound();
  }

  return <MobileProfilePage channel={channel} isSelf={selfProfile} initialFollowing={initialFollowing} authenticated={authenticated} clerkConfigured={isClerkConfigured} />;
}

function toChannel(user: {
  id: string;
  username: string;
  externalUserId: string;
  imageUrl: string;
  bio: string | null;
  followedBy: unknown[];
  stream: {
    isLive: boolean;
    name: string;
    thumbnailUrl: string | null;
  } | null;
}): Channel {
  const username = publicUsername(user.username, user.externalUserId);
  return {
    username,
    displayName: username,
    title: redactPrivateIdentity(user.stream?.name ?? `${username}'s stream`, username),
    category: "Just Chatting",
    viewers: 0,
    live: user.stream?.isLive ?? false,
    tags: ["New creator"],
    colors: ["#9147ff", "#1f1f23"],
    initials: username.slice(0, 2).toUpperCase(),
    hostIdentity: user.id,
    thumbnailUrl: user.stream?.thumbnailUrl,
    imageUrl: user.imageUrl,
    bio: user.bio,
    followerCount: user.followedBy.length,
  };
}
