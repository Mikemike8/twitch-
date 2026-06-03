import type { Channel } from "@/lib/channels";
import { publicUsername, redactPrivateIdentity } from "@/lib/public-identity";

export type PublicStream = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  user: {
    id: string;
    username: string;
    imageUrl: string;
    bio: string | null;
    externalUserId: string;
  };
};

export function streamToChannel(stream: PublicStream): Channel {
  const username = publicUsername(stream.user.username, stream.user.externalUserId);
  return {
    username,
    displayName: username,
    title: redactPrivateIdentity(stream.name, username),
    category: "Just Chatting",
    viewers: 0,
    live: stream.isLive,
    tags: stream.isLive ? ["Live"] : ["Offline"],
    colors: colorsFor(username),
    initials: username.slice(0, 2).toUpperCase(),
    hostIdentity: stream.user.id,
    thumbnailUrl: stream.thumbnailUrl,
    imageUrl: stream.user.imageUrl,
    bio: stream.user.bio,
  };
}

function colorsFor(value: string): [string, string] {
  const palettes: [string, string][] = [
    ["#9147ff", "#4338ca"],
    ["#db2777", "#7c3aed"],
    ["#0891b2", "#0f766e"],
    ["#f97316", "#dc2626"],
    ["#65a30d", "#166534"],
  ];
  const index = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}
