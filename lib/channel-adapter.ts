import type { Channel } from "@/lib/channels";

export type PublicStream = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  user: {
    id: string;
    username: string;
  };
};

export function streamToChannel(stream: PublicStream): Channel {
  return {
    username: stream.user.username,
    displayName: stream.user.username,
    title: stream.name,
    category: "Just Chatting",
    viewers: 0,
    live: stream.isLive,
    tags: stream.isLive ? ["Live"] : ["Offline"],
    colors: colorsFor(stream.user.username),
    initials: stream.user.username.slice(0, 2).toUpperCase(),
    hostIdentity: stream.user.id,
    thumbnailUrl: stream.thumbnailUrl,
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
