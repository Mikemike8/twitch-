export type Channel = {
  username: string;
  displayName: string;
  title: string;
  category: string;
  viewers: number;
  live: boolean;
  verified?: boolean;
  tags: string[];
  colors: [string, string];
  initials: string;
  hostIdentity?: string;
  thumbnailUrl?: string | null;
};

export const channels: Channel[] = [
  {
    username: "pixelpilot",
    displayName: "PixelPilot",
    title: "Road to Radiant - ranked grind with chat",
    category: "VALORANT",
    viewers: 18200,
    live: true,
    verified: true,
    tags: ["English", "Competitive"],
    colors: ["#fb7185", "#7c3aed"],
    initials: "PP",
  },
  {
    username: "lunarplays",
    displayName: "LunarPlays",
    title: "First playthrough - no spoilers please",
    category: "Elden Ring",
    viewers: 8100,
    live: true,
    tags: ["Adventure", "Chill"],
    colors: ["#0f766e", "#172554"],
    initials: "LP",
  },
  {
    username: "codecamp",
    displayName: "CodeCamp",
    title: "Building a multiplayer game from scratch",
    category: "Science & Technology",
    viewers: 4300,
    live: true,
    verified: true,
    tags: ["Programming", "English"],
    colors: ["#0f172a", "#0891b2"],
    initials: "CC",
  },
  {
    username: "mika",
    displayName: "Mika",
    title: "Late night lo-fi and community requests",
    category: "Music",
    viewers: 3700,
    live: true,
    tags: ["Lo-fi", "Music"],
    colors: ["#4338ca", "#db2777"],
    initials: "MI",
  },
  {
    username: "speedrunner",
    displayName: "SpeedRunner",
    title: "Any% attempts - chasing a new personal best",
    category: "Super Mario 64",
    viewers: 2900,
    live: true,
    tags: ["Speedrun", "Retro"],
    colors: ["#f97316", "#dc2626"],
    initials: "SR",
  },
  {
    username: "thecozycorner",
    displayName: "TheCozyCorner",
    title: "Designing a tiny forest town together",
    category: "Minecraft",
    viewers: 1600,
    live: true,
    tags: ["Cozy", "Building"],
    colors: ["#166534", "#65a30d"],
    initials: "TC",
  },
  {
    username: "chessdaily",
    displayName: "ChessDaily",
    title: "Subscriber arena and game analysis",
    category: "Chess",
    viewers: 920,
    live: true,
    tags: ["Strategy", "Educational"],
    colors: ["#78350f", "#d97706"],
    initials: "CD",
  },
  {
    username: "artwithivy",
    displayName: "ArtWithIvy",
    title: "Digital painting and portfolio review",
    category: "Art",
    viewers: 640,
    live: true,
    tags: ["Art", "Creative"],
    colors: ["#be185d", "#7e22ce"],
    initials: "AI",
  },
];

export const formatViewers = (viewers: number) =>
  viewers >= 1000 ? `${(viewers / 1000).toFixed(viewers >= 10000 ? 1 : 1)}K` : `${viewers}`;
