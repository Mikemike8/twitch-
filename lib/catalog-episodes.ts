import { demoCatalogTitles, type Channel } from "@/lib/channels";

export type EpisodeProgress = {
  episodeId: string;
  positionSeconds: number;
  progressPercent: number;
};

export type CatalogEpisode = ReturnType<typeof seriesEpisodes>[number];

export const seriesDescriptions: Record<string, string> = {
  "Solo Leveling": "A hunter at the edge of death awakens a forbidden power and begins climbing through gates no one else can survive.",
  "Demon Slayer": "A young swordsman enters a haunted mountain war where demons, grief, and family bonds collide beneath moonlit blades.",
  "Jujutsu Kaisen": "Cursed energy turns a quiet school into a battlefield as students face monsters born from human fear.",
  "Attack on Titan": "Humanity fights from behind broken walls while soldiers uncover the brutal truth hidden beyond the battlefield.",
  "My Hero Academia": "Young heroes train under impossible pressure as villains force them to decide what power is worth.",
  "Chainsaw Man": "A desperate fighter merges with a devil and is pulled into a violent world of contracts, blood, and ambition.",
  "One Piece": "A fearless crew crosses dangerous seas in search of freedom, treasure, and legends older than empires.",
  "Black Clover": "A magicless fighter challenges a kingdom of mages with stubborn will, brutal training, and an impossible dream.",
};

export const trailerSources: Record<string, { embedId?: string; url: string; label: string }> = {
  "Solo Leveling": {
    url: "https://www.crunchyroll.com/news/latest/2023/9/10/solo-leveling-anime-trailer-premiere-januar-2024",
    label: "Open official trailer",
  },
  "Demon Slayer": {
    embedId: "23riEOmDOgM",
    url: "https://youtu.be/23riEOmDOgM",
    label: "Official Aniplex trailer",
  },
  "Jujutsu Kaisen": {
    embedId: "MPfZhgLiK6w",
    url: "https://www.youtube.com/watch?v=MPfZhgLiK6w",
    label: "Official Crunchyroll trailer",
  },
  "Attack on Titan": {
    url: "https://www.crunchyroll.com/news/latest/2021/12/13/prepare-for-attack-on-titan-final-season-part-2-with-crunchyrolls-appetite-trailer",
    label: "Open official trailer",
  },
  "My Hero Academia": {
    url: "https://www.youtube.com/results?search_query=My+Hero+Academia+official+trailer+Crunchyroll",
    label: "Find official trailer",
  },
  "Chainsaw Man": {
    url: "https://www.youtube.com/results?search_query=Chainsaw+Man+official+trailer+MAPPA",
    label: "Find official trailer",
  },
  "One Piece": {
    url: "https://www.youtube.com/results?search_query=One+Piece+official+trailer",
    label: "Find official trailer",
  },
  "Black Clover": {
    url: "https://www.youtube.com/results?search_query=Black+Clover+official+trailer+Crunchyroll",
    label: "Find official trailer",
  },
};

export const muxEpisodePlaybackIds: Record<string, string[]> = {
  /*
   * How to add another episode to an existing anime:
   * 1. Upload the video to Mux and copy its playback ID.
   * 2. Find the anime title below.
   * 3. Add the new playback ID at the end of that title's array.
   *
   * Example:
   * "Solo Leveling": [
   *   "PLAYBACK_ID_FOR_S1_E1",
   *   "PLAYBACK_ID_FOR_S1_E2",
   *   "PLAYBACK_ID_FOR_S1_E3" // New episode goes here.
   * ],
   *
   * How to bring on a new anime:
   * 1. Add the anime title to the catalog seed/database.
   * 2. Add a matching entry in this object with the exact same title.
   * 3. Add poster art under public/demo-posters or store the poster URL in the database.
   * 4. Add an optional description in seriesDescriptions above.
   *
   * Season support:
   * The UI currently renders Season 1 episode codes. When Season 2 is needed,
   * replace this simple string-array map with a nested shape like:
   * { "Anime Title": { 1: ["S1_E1_ID"], 2: ["S2_E1_ID"] } }
   * and update seriesEpisodes to read season numbers from that shape.
   */
  "Solo Leveling": [
    "Ughp4MfIu01Nvt602FFsOLRiJ8Yo01rx7AXzE1TrL8DKZQ",
    "JfkMiMlayLLeNLUNcWu6iMfwJ7Z4svBAkPa6ZcgsqWM",
    "01vDllqA01v332iTjKRDQBMyWUcZWJREgimQhuBJbpxP4",
  ],
};

export function seriesEpisodes(channel: Channel, progressByEpisode = new Map<string, EpisodeProgress>()) {
  const title = channel.catalogTitle ?? channel.displayName;
  const playbackIds = muxEpisodePlaybackIds[title] ?? [];
  const trailer = trailerSources[title] ?? {
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} official trailer episode`)}`,
    label: "Watch trailer",
  };
  const episodeNames = [
    "Awakening",
    "Zone of Shadows",
    "Road to Nowhere",
    "The Gathering Storm",
    "Lost Oath",
    "Broken Gate",
    "Red Moon Trial",
    "The Last Command",
  ];
  const thumbnails = demoCatalogTitles.map((item) => item.posterUrl ?? item.thumbnailUrl).filter(Boolean) as string[];

  return episodeNames.map((name, index) => {
    const id = index === 0 && channel.firstEpisodeId ? channel.firstEpisodeId : `episode_${episodeSlug(title)}_${index + 1}`;
    const progress = progressByEpisode.get(id);

    return {
      id,
      code: `S1 E${index + 1}`,
      name,
      date: `Mar ${1 + index * 7}, 2026`,
      duration: `${42 + (index % 3)}M`,
      description: index === 0
        ? `${title} begins as the hero steps into a first battle that changes the entire season.`
        : `The conflict expands as ${title} pushes its heroes into a darker and more dangerous mission.`,
      thumbnailUrl: thumbnails[index % thumbnails.length],
      viewers: Math.max(120, Math.round(channel.viewers * (1 - index * 0.085))),
      muxPlaybackId: playbackIds[index],
      positionSeconds: progress?.positionSeconds ?? 0,
      progressPercent: progress?.progressPercent ?? 0,
      trailerUrl: trailer.embedId ? `https://www.youtube.com/watch?v=${trailer.embedId}` : trailer.url,
    };
  });
}

export function episodeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "series";
}

export function episodeNumber(episode: CatalogEpisode) {
  const match = episode.code.match(/E(\d+)/i);
  return match?.[1] ?? "1";
}

export function episodeRoomName(title: string, episode: CatalogEpisode) {
  return `anime:${episodeSlug(title)}:s1:e${episodeNumber(episode)}`;
}
