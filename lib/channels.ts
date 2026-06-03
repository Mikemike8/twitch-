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
  posterUrl?: string | null;
  catalogTitle?: string;
  imageUrl?: string | null;
  bio?: string | null;
  followerCount?: number;
};

export const channels: Channel[] = [
  {
    username: "pixelpilot",
    displayName: "PixelPilot",
    title: "Solo Leveling - Episode 12",
    category: "Anime",
    viewers: 18200,
    live: true,
    verified: true,
    tags: ["Action", "Fantasy"],
    colors: ["#fb7185", "#7c3aed"],
    initials: "PP",
    posterUrl: "/demo-posters/solo-leveling.jpg",
    catalogTitle: "Solo Leveling",
  },
  {
    username: "lunarplays",
    displayName: "LunarPlays",
    title: "Demon Slayer - Episode 19",
    category: "Anime",
    viewers: 8100,
    live: true,
    tags: ["Action", "Supernatural"],
    colors: ["#0f766e", "#172554"],
    initials: "LP",
    posterUrl: "/demo-posters/demon-slayer.jpg",
    catalogTitle: "Demon Slayer",
  },
  {
    username: "codecamp",
    displayName: "CodeCamp",
    title: "Jujutsu Kaisen - Episode 20",
    category: "Anime",
    viewers: 4300,
    live: true,
    verified: true,
    tags: ["Action", "Supernatural"],
    colors: ["#0f172a", "#0891b2"],
    initials: "CC",
    posterUrl: "/demo-posters/jujutsu-kaisen.jpg",
    catalogTitle: "Jujutsu Kaisen",
  },
  {
    username: "mika",
    displayName: "Mika",
    title: "Attack on Titan - Episode 54",
    category: "Anime",
    viewers: 3700,
    live: true,
    tags: ["Action", "Drama"],
    colors: ["#4338ca", "#db2777"],
    initials: "MI",
    posterUrl: "/demo-posters/attack-on-titan.jpg",
    catalogTitle: "Attack on Titan",
  },
  {
    username: "speedrunner",
    displayName: "SpeedRunner",
    title: "My Hero Academia - Episode 49",
    category: "Anime",
    viewers: 2900,
    live: true,
    tags: ["Action", "Superhero"],
    colors: ["#f97316", "#dc2626"],
    initials: "SR",
    posterUrl: "/demo-posters/my-hero-academia.jpg",
    catalogTitle: "My Hero Academia",
  },
  {
    username: "thecozycorner",
    displayName: "TheCozyCorner",
    title: "Chainsaw Man - Episode 8",
    category: "Anime",
    viewers: 1600,
    live: true,
    tags: ["Action", "Horror"],
    colors: ["#166534", "#65a30d"],
    initials: "TC",
    posterUrl: "/demo-posters/chainsaw-man.jpg",
    catalogTitle: "Chainsaw Man",
  },
  {
    username: "chessdaily",
    displayName: "ChessDaily",
    title: "One Piece - Episode 1015",
    category: "Anime",
    viewers: 920,
    live: true,
    tags: ["Adventure", "Fantasy"],
    colors: ["#78350f", "#d97706"],
    initials: "CD",
    posterUrl: "/demo-posters/one-piece.jpg",
    catalogTitle: "One Piece",
  },
  {
    username: "artwithivy",
    displayName: "ArtWithIvy",
    title: "Black Clover - Episode 100",
    category: "Anime",
    viewers: 640,
    live: true,
    tags: ["Action", "Fantasy"],
    colors: ["#be185d", "#7e22ce"],
    initials: "AI",
    posterUrl: "/demo-posters/black-clover.jpg",
    catalogTitle: "Black Clover",
  },
];

export const demoStreamers: Channel[] = channels.map((channel) => ({
  username: channel.username,
  displayName: channel.displayName,
  title: channel.title,
  category: channel.category,
  viewers: channel.viewers,
  live: channel.live,
  verified: channel.verified,
  tags: channel.tags,
  colors: channel.colors,
  initials: channel.initials,
}));

export const formatViewers = (viewers: number) =>
  viewers >= 1000 ? `${(viewers / 1000).toFixed(viewers >= 10000 ? 1 : 1)}K` : `${viewers}`;
