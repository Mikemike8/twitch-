export type Channel = {
  kind: "catalog" | "creator";
  source: "database" | "demo";
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
  firstEpisodeId?: string | null;
};

export const demoCatalogTitles: Channel[] = [
  {
    kind: "catalog",
    source: "demo",
    username: "pixelpilot",
    displayName: "PixelPilot",
    title: "Solo Leveling - Episode 12",
    category: "Anime",
    viewers: 18200,
    live: false,
    verified: true,
    tags: ["Action", "Fantasy"],
    colors: ["#fb7185", "#7c3aed"],
    initials: "PP",
    posterUrl: "/demo-posters/solo-leveling.jpg",
    catalogTitle: "Solo Leveling",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "lunarplays",
    displayName: "LunarPlays",
    title: "Demon Slayer - Episode 19",
    category: "Anime",
    viewers: 8100,
    live: false,
    tags: ["Action", "Supernatural"],
    colors: ["#0f766e", "#172554"],
    initials: "LP",
    posterUrl: "/demo-posters/demon-slayer.jpg",
    catalogTitle: "Demon Slayer",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "codecamp",
    displayName: "CodeCamp",
    title: "Jujutsu Kaisen - Episode 20",
    category: "Anime",
    viewers: 4300,
    live: false,
    verified: true,
    tags: ["Action", "Supernatural"],
    colors: ["#0f172a", "#0891b2"],
    initials: "CC",
    posterUrl: "/demo-posters/jujutsu-kaisen.jpg",
    catalogTitle: "Jujutsu Kaisen",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "mika",
    displayName: "Mika",
    title: "Attack on Titan - Episode 54",
    category: "Anime",
    viewers: 3700,
    live: false,
    tags: ["Action", "Drama"],
    colors: ["#4338ca", "#db2777"],
    initials: "MI",
    posterUrl: "/demo-posters/attack-on-titan.jpg",
    catalogTitle: "Attack on Titan",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "speedrunner",
    displayName: "SpeedRunner",
    title: "My Hero Academia - Episode 49",
    category: "Anime",
    viewers: 2900,
    live: false,
    tags: ["Action", "Superhero"],
    colors: ["#f97316", "#dc2626"],
    initials: "SR",
    posterUrl: "/demo-posters/my-hero-academia.jpg",
    catalogTitle: "My Hero Academia",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "thecozycorner",
    displayName: "TheCozyCorner",
    title: "Chainsaw Man - Episode 8",
    category: "Anime",
    viewers: 1600,
    live: false,
    tags: ["Action", "Horror"],
    colors: ["#166534", "#65a30d"],
    initials: "TC",
    posterUrl: "/demo-posters/chainsaw-man.jpg",
    catalogTitle: "Chainsaw Man",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "chessdaily",
    displayName: "ChessDaily",
    title: "One Piece - Episode 1015",
    category: "Anime",
    viewers: 920,
    live: false,
    tags: ["Adventure", "Fantasy"],
    colors: ["#78350f", "#d97706"],
    initials: "CD",
    posterUrl: "/demo-posters/one-piece.jpg",
    catalogTitle: "One Piece",
  },
  {
    kind: "catalog",
    source: "demo",
    username: "artwithivy",
    displayName: "ArtWithIvy",
    title: "Black Clover - Episode 100",
    category: "Anime",
    viewers: 640,
    live: false,
    tags: ["Action", "Fantasy"],
    colors: ["#be185d", "#7e22ce"],
    initials: "AI",
    posterUrl: "/demo-posters/black-clover.jpg",
    catalogTitle: "Black Clover",
  },
];

export const demoLiveChannels: Channel[] = [
  {
    kind: "creator",
    source: "demo",
    username: "pixelpilot-live",
    displayName: "PixelPilot",
    title: "Creator film commentary and live Q&A",
    category: "Film",
    viewers: 1820,
    live: true,
    verified: true,
    tags: ["Demo", "Live"],
    colors: ["#9147ff", "#4338ca"],
    initials: "PP",
  },
  {
    kind: "creator",
    source: "demo",
    username: "lunarplays-live",
    displayName: "LunarPlays",
    title: "Behind the edit: short film breakdown",
    category: "Film",
    viewers: 810,
    live: true,
    tags: ["Demo", "Live"],
    colors: ["#0891b2", "#0f766e"],
    initials: "LP",
  },
  {
    kind: "creator",
    source: "demo",
    username: "codecamp-live",
    displayName: "CodeCamp",
    title: "Live creator workshop",
    category: "Education",
    viewers: 430,
    live: true,
    verified: true,
    tags: ["Demo", "Live"],
    colors: ["#db2777", "#7c3aed"],
    initials: "CC",
  },
];

export const channels = demoCatalogTitles;
export const demoStreamers = demoLiveChannels;

export const formatViewers = (viewers: number) =>
  viewers >= 1000 ? `${(viewers / 1000).toFixed(viewers >= 10000 ? 1 : 1)}K` : `${viewers}`;
