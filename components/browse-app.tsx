"use client";

import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { LiveKitRoom, useChat, useParticipants } from "@livekit/components-react";
import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { recordVideoEvent, savePlaybackProgress } from "@/actions/catalog";
import { createEpisodeChatToken } from "@/actions/episode-token";
import { ChannelPage } from "@/components/channel-page";
import { BellIcon, MoreIcon, SearchIcon } from "@/components/icons";
import { SiteTopbar, type SiteTopbarMode } from "@/components/site-topbar";
import { channels, formatViewers, type Channel } from "@/lib/channels";
import { normalizeLiveKitWsUrl } from "@/lib/livekit-url";
import { inputLimits } from "@/lib/validation";

type BrowseMode = SiteTopbarMode;

type BrowseAppProps = {
  persistedChannels?: Channel[];
  followedChannels?: Channel[];
  recommendedChannels?: Channel[];
  catalogChannels?: Channel[];
  continueWatching?: ContinueWatchingItem[];
  demoFallback?: boolean;
  initialQuery?: string;
  clerkConfigured?: boolean;
  viewerIdentity?: string;
  viewerUsername?: string;
  mobileBrowse?: boolean;
  pagination?: { page: number; hasNext: boolean; baseHref: string };
};

type ContinueWatchingItem = {
  channel: Channel;
  durationSeconds: number | null;
  episodeCode: string;
  episodeId: string;
  episodeTitle: string;
  positionSeconds: number;
  progressPercent: number;
};

type PlayerProgressTarget = {
  currentTime: number;
  duration: number;
};

function getPlayerProgressTarget(event: { currentTarget: EventTarget | null }) {
  const target = event.currentTarget as (EventTarget & Partial<PlayerProgressTarget>) | null;

  if (!target || typeof target.currentTime !== "number" || typeof target.duration !== "number") {
    return null;
  }

  return target as EventTarget & PlayerProgressTarget;
}

function prioritizePlayableCatalog(left: Channel, right: Channel) {
  if (left.catalogTitle === "Solo Leveling") return -1;
  if (right.catalogTitle === "Solo Leveling") return 1;

  return right.viewers - left.viewers;
}

const animeTitles = ["Solo Leveling", "Demon Slayer", "Jujutsu Kaisen", "Attack on Titan", "My Hero Academia", "Chainsaw Man", "One Piece", "Black Clover"];
function animeTitle(channel: Channel, index: number) {
  return channel.hostIdentity ? channel.title : channel.catalogTitle ?? animeTitles[index % animeTitles.length];
}

function BrowseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></svg>;
}

function ProfileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function ChannelArtwork({ channel, className = "" }: { channel: Channel; className?: string }) {
  const thumbnailUrl = channel.hostIdentity ? null : channel.thumbnailUrl;

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden bg-[#171720]" style={{ position: "relative" }}>
        {thumbnailUrl ? <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 1023px) 100vw, 33vw" className="object-cover" /> : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${channel.colors[0]}, ${channel.colors[1]})` }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.3),transparent_17%),radial-gradient(circle_at_74%_64%,rgba(255,255,255,0.18),transparent_20%)]" />
            <div className="absolute -right-5 top-5 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute inset-0 grid place-items-center text-center">
              <span>
                <strong className="block text-3xl font-black text-white/90">{channel.initials}</strong>
                <i className="mt-1 block text-[8px] font-black not-italic uppercase tracking-[0.28em] text-white/60">ARGUS Live</i>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CatalogArtwork({ channel, className = "" }: { channel: Channel; className?: string }) {
  const artworkUrl = channel.posterUrl ?? (channel.hostIdentity ? null : channel.thumbnailUrl);
  if (!artworkUrl) return <ChannelArtwork channel={channel} className={className} />;

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden bg-[#171720]" style={{ position: "relative" }}>
        <Image src={artworkUrl} alt="" fill sizes="(max-width: 1023px) 100vw, 33vw" className="object-cover" />
      </div>
    </div>
  );
}

function MobileBottomNav({ viewerUsername, clerkConfigured = false, active = "home" }: { viewerUsername?: string; clerkConfigured?: boolean; active?: "home" | "search" | "live" | "profile" }) {
  const itemClass = "flex min-h-[74px] flex-col items-center justify-center gap-1.5 px-1 pb-1 pt-2 text-[10px] font-black uppercase tracking-wide";
  const color = (item: typeof active) => item === active ? "text-white" : "text-white/55";
  return <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/5 bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
    <Link href="/" className={`${itemClass} ${color("home")}`}><HomeIcon className="h-7 w-7" />Home</Link>
    <Link href="/search" className={`${itemClass} ${color("search")}`}><BrowseIcon className="h-7 w-7" />Search</Link>
    <Link href="/search" className={`${itemClass} text-white/55`}><ClipsIcon className="h-7 w-7" />Clips</Link>
    <Link href="/live" className={`${itemClass} ${color("live")}`}><LiveTvIcon className="h-7 w-7" />Live TV</Link>
    {clerkConfigured ? (
      <>
        <Show when="signed-in">
          <Link href={viewerUsername ? `/${viewerUsername}` : "/"} className={`${itemClass} ${color("profile")}`}><ProfileIcon className="h-7 w-7" />Profile</Link>
        </Show>
        <Show when="signed-out">
          <SignInButton>
            <button type="button" className={`${itemClass} ${color("profile")}`}><ProfileIcon className="h-7 w-7" />Profile</button>
          </SignInButton>
        </Show>
      </>
    ) : (
      <Link href="/sign-in" className={`${itemClass} ${color("profile")}`}><ProfileIcon className="h-7 w-7" />Profile</Link>
    )}
  </nav>;
}

function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}

function ClipsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 4h10M5 8h14v12H5z" /><path d="m10 11 5 3-5 3Z" /></svg>;
}

function LiveTvIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="13" rx="1" /><path d="m10 9 5 2.5-5 2.5ZM8 21h8" /></svg>;
}

function CastIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M3 13a6 6 0 0 1 6 6M3 8a11 11 0 0 1 11 11" /><path d="M5 5h15a1 1 0 0 1 1 1v11" /></svg>;
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7Z" /></svg>;
}

function Hero({ channel, onOpen }: { channel?: Channel; onOpen: (channel: Channel) => void }) {
  if (!channel) return null;
  return (
    <section className="relative -mx-7 -mt-4 hidden min-h-[560px] overflow-hidden bg-black lg:block">
      <CatalogArtwork channel={channel} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070a] via-[#07070a]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-black/25" />
      <div className="relative z-10 flex min-h-[560px] max-w-2xl flex-col justify-end px-10 pb-20 xl:px-14">
        <div className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#bf94ff]"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Most watched live anime</div>
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight xl:text-7xl">{channel.catalogTitle}</h1>
        <p className="mt-5 text-xl font-bold text-white">Streaming now on ARGUS</p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#d2d2d8]">Join the live watch room, react with the community, and follow the conversation in real time.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded bg-red-600 px-2 py-1 text-white">LIVE</span><span className="text-[#bf94ff]">1M viewers</span></div>
        <div className="mt-7 flex gap-3">
          <button onClick={() => onOpen(channel)} className="flex items-center gap-2 rounded bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-white/80"><PlayIcon />Watch live</button>
          <button onClick={() => onOpen(channel)} className="rounded bg-white/20 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/30">More info</button>
        </div>
      </div>
    </section>
  );
}

function MobileStreamingHome({ channels: mobileChannels, onOpen, clerkConfigured, viewerUsername }: { channels: Channel[]; onOpen: (channel: Channel) => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [listed, setListed] = useState(false);
  const featured = mobileChannels.slice(0, 4);
  const spotlight = featured[featuredIndex] ?? mobileChannels[0];

  if (!spotlight) return <div className="-mx-4 -mt-4 grid min-h-screen place-items-center bg-black text-sm text-white/65 lg:hidden">No channels available.</div>;

  const nextWatch = mobileChannels.slice(1, 7);
  const keepWatching = [...mobileChannels].reverse().slice(0, 5);
  const comedy = [...mobileChannels.slice(3), ...mobileChannels.slice(0, 3)];

  return (
    <section className="-mx-4 -mt-4 min-h-screen overflow-hidden bg-[#080809] pb-24 text-white lg:hidden">
      <CatalogArtwork channel={spotlight} className="fixed inset-0 opacity-25 blur-2xl" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-black/70 to-[#080809]" />
      <div className="relative">
        <header className="px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-center">
            <span className="text-3xl font-black italic tracking-[-0.12em]">ARGUS<span className="text-[#a970ff]">+</span></span>
            <button type="button" className="absolute right-6 grid h-11 w-11 place-items-center text-white" aria-label="Cast"><CastIcon className="h-8 w-8" /></button>
          </div>
          <nav className="mt-7 grid grid-cols-3 text-center text-xl font-black">
            <button type="button">Shows</button>
            <button type="button">Movies</button>
            <button type="button">Hubs<span className="ml-1 text-white/65">▼</span></button>
          </nav>
        </header>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[6vw] pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featured.map((channel, index) => <button key={`featured-${channel.username}`} type="button" onClick={() => setFeaturedIndex(index)} className={`relative h-[64vh] min-h-[520px] w-[88vw] shrink-0 snap-center overflow-hidden rounded-2xl border transition ${index === featuredIndex ? "border-white/15 opacity-100" : "border-transparent opacity-55"}`} aria-label={`Feature ${animeTitle(channel, index)}`}>
            <CatalogArtwork channel={channel} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
            <LiveViewerBadge viewers={channel.viewers} className="absolute left-4 top-4" />
            {index === featuredIndex && <div className="absolute inset-x-0 bottom-5 px-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Streaming now</p>
              <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight">{channel.catalogTitle ?? channel.displayName}</h1>
              <p className="mt-4 text-sm font-black uppercase tracking-wide">Live now on ARGUS+</p>
            </div>}
          </button>)}
        </div>

        <div className="relative z-10 -mt-24 px-[11vw]">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onOpen(spotlight)} className="rounded-xl bg-white px-3 py-4 text-sm font-black uppercase text-black">Watch now</button>
            <button type="button" onClick={() => setListed(!listed)} className="rounded-xl bg-white/25 px-3 py-4 text-sm font-black uppercase text-white backdrop-blur-md"><span className="mr-2 text-2xl leading-none">{listed ? "✓" : "+"}</span>My list</button>
          </div>
        </div>

        <div className="relative z-10 mt-16 space-y-9">
          <MobilePosterRail title="Your Next Watch" channels={nextWatch} onOpen={onOpen} />
          <MobileLandscapeRail title="Keep Watching" channels={keepWatching} onOpen={onOpen} />
          <MobilePosterRail title="Comedy Shows" channels={comedy} onOpen={onOpen} />
          <MobilePosterRail title="Most-Watched Classics" channels={[...mobileChannels].reverse()} onOpen={onOpen} />
        </div>
      </div>
      <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </section>
  );
}

function MobilePosterRail({ title, channels: railChannels, onOpen }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void }) {
  return <section><h2 className="px-5 text-2xl font-black">{title}</h2><div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className="relative aspect-[2/3] w-[27vw] max-w-40 shrink-0 overflow-hidden rounded-xl bg-white/5"><CatalogArtwork channel={channel} className="absolute inset-0" /><LiveViewerBadge viewers={channel.viewers} className="absolute bottom-2 left-2" /></button>)}</div></section>;
}

function MobileLandscapeRail({ title, channels: railChannels, onOpen }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void }) {
  return <section><h2 className="px-5 text-2xl font-black">{title}</h2><div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className="w-[44vw] max-w-64 shrink-0 text-left"><span className="relative block aspect-video overflow-hidden rounded-xl bg-white/5"><CatalogArtwork channel={channel} className="absolute inset-0" /><LiveViewerBadge viewers={channel.viewers} className="absolute left-2 top-2" /><i className="absolute inset-x-0 bottom-0 h-1 bg-[#2563eb]" /></span><span className="mt-2 block text-xs text-white/55">{2022 + index} · {96 + index * 9}min</span><strong className="mt-1 block truncate text-sm">{animeTitle(channel, index)}</strong></button>)}</div></section>;
}

function LiveViewerBadge({ viewers, className = "" }: { viewers: number; className?: string }) {
  return <span className={`${className} flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white backdrop-blur`}><i className="h-1.5 w-1.5 rounded-full bg-red-600" />Live · {formatViewers(viewers)}</span>;
}

function MobileChannelFeed({ query, onQuery, data, onOpen, searchable = false }: { query: string; onQuery: (value: string) => void; data: Channel[]; onOpen: (channel: Channel) => void; searchable?: boolean }) {
  const router = useRouter();

  return (
    <section className="-mx-4 -mt-4 bg-[#07070a] text-[#f1f1f3] lg:hidden">
      <div className="flex h-14 items-center justify-center border-b border-white/5 px-4"><h1 className="text-lg font-black">{searchable ? "Search channels" : "Live Channels"}</h1></div>
      {searchable && <form onSubmit={(event) => { event.preventDefault(); router.push(`/search?term=${encodeURIComponent(query)}`); }} className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#18181b] px-3 py-3">
        <SearchIcon className="h-6 w-6 shrink-0 text-[#a8a8b3]" />
        <input value={query} maxLength={inputLimits.searchTerm} onChange={(event) => onQuery(event.target.value)} placeholder="Search live channels" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#777783]" />
      </form>}
      <div className="mt-2 flex items-end border-b border-white/10 px-4 text-base font-black">
        <span className="border-b-[3px] border-[#7c3aed] px-1 pb-3 pt-2 text-[#7c3aed]">Live Channels</span>
        <span className="px-7 pb-3 pt-2">Videos</span>
        <span className="pb-3 pt-2">Clips</span>
        <button type="button" aria-label="Filter channels" className="ml-auto mb-1 grid h-11 w-11 place-items-center"><FilterIcon /></button>
      </div>
      <div>
        {data.length ? data.slice(0, 12).map((channel, index) => <button key={channel.username} onClick={() => onOpen(channel)} className="block w-full border-b border-white/5 bg-[#0e0e10] text-left">
          <div className="relative aspect-video overflow-hidden bg-black"><ChannelArtwork channel={channel} className="absolute inset-0" /><span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-xs font-black text-white">LIVE</span><span className="absolute bottom-2 left-3 rounded bg-black/80 px-2 py-1 text-sm font-semibold text-white">{channel.viewers || 24} viewers</span></div>
          <div className="flex gap-3 px-4 py-3"><ChannelArtwork channel={channel} className="h-12 w-12 shrink-0 rounded-full border border-white/10" /><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><strong className="truncate text-base">{channel.displayName}</strong><i className="h-3 w-3 shrink-0 rounded-full bg-[#9147ff]" /></span><span className="mt-1 block truncate text-base text-[#adadb8]">{animeTitle(channel, index)}</span><span className="mt-2 flex flex-wrap gap-1.5">{[...channel.tags, channel.category].slice(0, 4).map((tag, tagIndex) => <i key={`${tag}-${tagIndex}`} className="rounded-full bg-[#2f2f35] px-3 py-1 text-xs font-bold not-italic text-[#c2c2cb]">{tag}</i>)}</span></span><MoreIcon className="mt-1 h-6 w-6 shrink-0 text-[#adadb8]" /></div>
        </button>) : <div className="p-12 text-center text-sm text-[#adadb8]">No live channels found.</div>}
      </div>
    </section>
  );
}

function FilterIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h10M18 18h2" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="18" r="2" /></svg>;
}

function RailCard({ channel, index, onOpen, horizontal = false }: { channel: Channel; index: number; onOpen: () => void; horizontal?: boolean }) {
  return <button onClick={onOpen} aria-label={`Watch ${animeTitle(channel, index)} live`} className="group min-w-0 transition duration-300 hover:z-10 hover:scale-105 focus:z-10 focus:scale-105 focus:outline-none"><div className={`relative overflow-hidden rounded-md bg-[#18181b] shadow-lg ${horizontal ? "aspect-video" : "aspect-[2/3]"}`}><CatalogArtwork channel={channel} className="absolute inset-0 transition duration-500 group-hover:scale-110" /><div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" /><span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.06] px-1 py-px text-[7px] font-bold leading-3 text-white/85 shadow-sm backdrop-blur-sm"><i className="h-1 w-1 rounded-full bg-red-600" />LIVE · 1M</span></div></button>;
}

function ContentRail({ title, channels: railChannels, onOpen, horizontal = false }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void; horizontal?: boolean }) {
  if (!railChannels.length) return null;
  return <section className="relative mt-8 hidden lg:block"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9147ff]">Explore ARGUS</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button type="button" className="text-xs font-bold text-[#adadb8] transition hover:text-white">See all</button></div><div className={`grid grid-flow-col gap-3 overflow-x-auto pb-5 ${horizontal ? "auto-cols-[260px] xl:auto-cols-[310px]" : "auto-cols-[180px] xl:auto-cols-[205px]"}`}>{railChannels.map((channel, index) => <RailCard key={`${title}-${channel.username}`} channel={channel} index={index} onOpen={() => onOpen(channel)} horizontal={horizontal} />)}</div></section>;
}

const seriesDescriptions: Record<string, string> = {
  "Solo Leveling": "A hunter at the edge of death awakens a forbidden power and begins climbing through gates no one else can survive.",
  "Demon Slayer": "A young swordsman enters a haunted mountain war where demons, grief, and family bonds collide beneath moonlit blades.",
  "Jujutsu Kaisen": "Cursed energy turns a quiet school into a battlefield as students face monsters born from human fear.",
  "Attack on Titan": "Humanity fights from behind broken walls while soldiers uncover the brutal truth hidden beyond the battlefield.",
  "My Hero Academia": "Young heroes train under impossible pressure as villains force them to decide what power is worth.",
  "Chainsaw Man": "A desperate fighter merges with a devil and is pulled into a violent world of contracts, blood, and ambition.",
  "One Piece": "A fearless crew crosses dangerous seas in search of freedom, treasure, and legends older than empires.",
  "Black Clover": "A magicless fighter challenges a kingdom of mages with stubborn will, brutal training, and an impossible dream.",
};

const trailerSources: Record<string, { embedId?: string; url: string; label: string }> = {
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

const muxEpisodePlaybackIds: Record<string, string[]> = {
  // Add real Mux playback IDs after uploads, in episode order.
  // Example:
  // "Solo Leveling": ["PLAYBACK_ID_FOR_S1_E1", "PLAYBACK_ID_FOR_S1_E2"],
  "Solo Leveling": [],
};

function seriesEpisodes(channel: Channel, progressByEpisode = new Map<string, ContinueWatchingItem>()) {
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
  const thumbnails = channels.map((item) => item.posterUrl ?? item.thumbnailUrl).filter(Boolean) as string[];

  return episodeNames.map((name, index) => ({
    id: index === 0 && channel.firstEpisodeId ? channel.firstEpisodeId : `episode_${episodeSlug(title)}_${index + 1}`,
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
    positionSeconds: progressByEpisode.get(index === 0 && channel.firstEpisodeId ? channel.firstEpisodeId : `episode_${episodeSlug(title)}_${index + 1}`)?.positionSeconds ?? 0,
    progressPercent: progressByEpisode.get(index === 0 && channel.firstEpisodeId ? channel.firstEpisodeId : `episode_${episodeSlug(title)}_${index + 1}`)?.progressPercent ?? 0,
    trailerUrl: trailer.embedId
      ? `https://www.youtube.com/watch?v=${trailer.embedId}`
      : trailer.url,
  }));
}

type SeriesEpisode = ReturnType<typeof seriesEpisodes>[number];
type EpisodeChatToken = Awaited<ReturnType<typeof createEpisodeChatToken>>;

function episodeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "series";
}

function episodeNumber(episode: SeriesEpisode) {
  const match = episode.code.match(/E(\d+)/i);
  return match?.[1] ?? "1";
}

function episodeRoomName(title: string, episode: SeriesEpisode) {
  return `anime:${episodeSlug(title)}:s1:e${episodeNumber(episode)}`;
}

function EpisodePlaybackOverlay({ title, episode, viewerUsername, onClose }: { title: string; episode: SeriesEpisode; viewerUsername?: string; onClose: () => void }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [session, setSession] = useState<EpisodeChatToken | null>(null);
  const lastProgressSyncAt = useRef(0);
  const resumed = useRef(false);
  const serverUrl = normalizeLiveKitWsUrl(process.env.NEXT_PUBLIC_LIVEKIT_WS_URL);
  const [error, setError] = useState(() => {
    if (serverUrl) return "";
    return process.env.NEXT_PUBLIC_LIVEKIT_WS_URL ? "Live chat URL is formatted incorrectly" : "Live chat is not configured";
  });
  const roomName = useMemo(() => episodeRoomName(title, episode), [title, episode]);

  useEffect(() => {
    if (!serverUrl) return;

    createEpisodeChatToken(roomName)
      .then(setSession)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to join live chat"));
  }, [roomName, serverUrl]);

  const syncProgress = (player: PlayerProgressTarget, eventType: "VIDEO_STARTED" | "VIDEO_PAUSED" | "VIDEO_COMPLETED" | "VIDEO_SEEKED" | "WATCH_TIME_UPDATED") => {
    const positionSeconds = Math.floor(player.currentTime || 0);
    const durationSeconds = Number.isFinite(player.duration) ? Math.floor(player.duration) : undefined;

    if (positionSeconds > 0) {
      savePlaybackProgress({ durationSeconds, episodeId: episode.id, positionSeconds }).catch(() => undefined);
    }

    recordVideoEvent({
      episodeId: episode.id,
      metadata: { title, episodeCode: episode.code },
      positionSeconds,
      type: eventType,
    }).catch(() => undefined);
  };

  const resumePlayback = (event: { currentTarget: EventTarget | null }) => {
    const player = getPlayerProgressTarget(event);
    if (!player || resumed.current || !episode.positionSeconds) return;
    player.currentTime = episode.positionSeconds;
    resumed.current = true;
  };

  const syncWhilePlaying = (event: { currentTarget: EventTarget | null }) => {
    const player = getPlayerProgressTarget(event);
    if (!player) return;

    const now = Date.now();
    if (now - lastProgressSyncAt.current < 10_000) return;
    lastProgressSyncAt.current = now;
    syncProgress(player, "WATCH_TIME_UPDATED");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <MuxPlayer
        playbackId={episode.muxPlaybackId}
        metadata={{ video_title: `${title} ${episode.code} ${episode.name}` }}
        streamType="on-demand"
        autoPlay
        onEnded={(event) => {
          const player = getPlayerProgressTarget(event);
          if (player) syncProgress(player, "VIDEO_COMPLETED");
        }}
        onLoadedMetadata={resumePlayback}
        onPause={(event) => {
          const player = getPlayerProgressTarget(event);
          if (player) syncProgress(player, "VIDEO_PAUSED");
        }}
        onPlay={(event) => {
          const player = getPlayerProgressTarget(event);
          if (player) syncProgress(player, "VIDEO_STARTED");
        }}
        onSeeked={(event) => {
          const player = getPlayerProgressTarget(event);
          if (player) syncProgress(player, "VIDEO_SEEKED");
        }}
        onTimeUpdate={syncWhilePlaying}
        className="absolute inset-0 h-full w-full bg-black"
        style={{
          width: "100vw",
          height: "100vh",
          ["--media-object-fit" as string]: "contain",
          ["--media-object-position" as string]: "center",
        }}
      />
      {serverUrl && session ? (
        <LiveKitRoom token={session.token} serverUrl={serverUrl} connect video={false} audio={false} className="contents">
          <EpisodeHoverChat episode={episode} session={session} chatOpen={chatOpen} setChatOpen={setChatOpen} viewerUsername={viewerUsername} error={error} />
        </LiveKitRoom>
      ) : (
        <EpisodeHoverChatFallback episode={episode} chatOpen={chatOpen} setChatOpen={setChatOpen} error={error} />
      )}
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-40 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-xl text-white/75 backdrop-blur hover:text-white" aria-label="Close video">×</button>
    </div>
  );
}

function EpisodeChatShell({ chatOpen, setChatOpen, children }: { chatOpen: boolean; setChatOpen: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <>
      <div
        className="absolute inset-y-0 right-0 z-20 flex w-8 items-center justify-end"
        onMouseEnter={() => setChatOpen(true)}
        onClick={() => setChatOpen(true)}
        aria-hidden={!chatOpen}
      >
        <span className="mr-1 h-24 w-1 rounded-full bg-white/15 opacity-40" />
      </div>
      <aside
        className={`absolute right-0 top-0 z-30 flex h-full w-[min(340px,82vw)] flex-col border-l border-white/10 bg-black/35 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 ${chatOpen ? "translate-x-0" : "translate-x-[calc(100%-10px)]"}`}
        onMouseEnter={() => setChatOpen(true)}
      >
        {children}
      </aside>
    </>
  );
}

function EpisodeHoverChat({ episode, session, chatOpen, setChatOpen, viewerUsername, error }: { episode: SeriesEpisode; session: EpisodeChatToken; chatOpen: boolean; setChatOpen: (open: boolean) => void; viewerUsername?: string; error: string }) {
  const [chatMessage, setChatMessage] = useState("");
  const participants = useParticipants();
  const { chatMessages, send, isSending } = useChat();
  const viewerCount = participants.length || episode.viewers;
  const displayMessages = chatMessages.slice(-40);
  const canSend = session.canChat && chatMessage.trim().length > 0 && !isSending;

  const sendChatMessage = async () => {
    const nextMessage = chatMessage.trim();
    if (!canSend || !nextMessage) return;
    await send(nextMessage);
    setChatMessage("");
  };
  const sendOnEnter = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void sendChatMessage();
  };

  return (
    <EpisodeChatShell chatOpen={chatOpen} setChatOpen={setChatOpen}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide">Live chat</p>
          <p className="mt-1 text-[11px] text-white/60">{formatViewers(viewerCount)} watching</p>
        </div>
        <button type="button" onClick={(event) => { event.stopPropagation(); setChatOpen(false); }} className="grid h-9 w-9 place-items-center rounded text-xl text-white/70 hover:bg-white/10" aria-label="Hide chat">×</button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs leading-5">
        {displayMessages.length ? displayMessages.map((message) => (
          <p key={message.id}>
            <strong className="mr-2 text-[#bf94ff]">{message.from?.name ?? viewerUsername ?? "viewer"}:</strong>
            <span className="text-white/85">{message.message}</span>
          </p>
        )) : (
          <p className="text-white/55">Chat is live.</p>
        )}
        {error && <p className="text-white/55">{error}</p>}
      </div>
      <form className="border-t border-white/10 p-3" onSubmit={(event) => { event.preventDefault(); void sendChatMessage(); }}>
        {session.canChat ? (
          <div className="flex rounded-md border border-white/15 bg-black/35 focus-within:border-[#9147ff]">
            <input type="text" enterKeyHint="send" value={chatMessage} maxLength={inputLimits.chatMessage} onChange={(event) => setChatMessage(event.target.value)} onKeyDown={sendOnEnter} placeholder="Chat" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-white/40 md:py-2 md:text-xs" />
            <button type="submit" disabled={!canSend} className="px-3 text-xs font-black text-[#bf94ff] disabled:cursor-not-allowed disabled:text-white/25">Send</button>
          </div>
        ) : (
          <div className="rounded-md border border-white/15 bg-black/35 p-3 text-xs text-white/60">
            <p>Sign in to chat.</p>
            <SignInButton>
              <button type="button" className="mt-2 rounded bg-[#9147ff] px-3 py-2 font-black text-white">Sign in</button>
            </SignInButton>
          </div>
        )}
      </form>
    </EpisodeChatShell>
  );
}

function EpisodeHoverChatFallback({ episode, chatOpen, setChatOpen, error }: { episode: SeriesEpisode; chatOpen: boolean; setChatOpen: (open: boolean) => void; error: string }) {
  return (
    <EpisodeChatShell chatOpen={chatOpen} setChatOpen={setChatOpen}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide">Live chat</p>
          <p className="mt-1 text-[11px] text-white/60">{formatViewers(episode.viewers)} watching</p>
        </div>
        <button type="button" onClick={(event) => { event.stopPropagation(); setChatOpen(false); }} className="grid h-9 w-9 place-items-center rounded text-xl text-white/70 hover:bg-white/10" aria-label="Hide chat">×</button>
      </div>
      <div className="min-h-0 flex-1 px-4 py-4 text-xs leading-5 text-white/60">
        {error || "Joining live chat..."}
      </div>
    </EpisodeChatShell>
  );
}

function SeriesDetailPage({ channel, continueWatching, onBack, clerkConfigured, viewerUsername }: { channel: Channel; continueWatching: ContinueWatchingItem[]; onBack: () => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const [listed, setListed] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<SeriesEpisode | null>(null);
  const title = channel.catalogTitle ?? channel.displayName;
  const progressByEpisode = useMemo(() => new Map(continueWatching.map((item) => [item.episodeId, item])), [continueWatching]);
  const episodes = seriesEpisodes(channel, progressByEpisode);
  const description = seriesDescriptions[title] ?? "A dark anime saga unfolds across a season of battles, secrets, and impossible choices.";
  const totalWatching = episodes.reduce((sum, episode) => sum + episode.viewers, 0);
  const openEpisode = (episode: SeriesEpisode) => {
    setPlayingEpisode(episode);
  };

  useEffect(() => {
    if (!playingEpisode) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlayingEpisode(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [playingEpisode]);

  return (
    <div className="min-h-screen bg-[#09090b] pb-24 text-white">
      <section className="relative min-h-[620px] overflow-hidden bg-black">
        <CatalogArtwork channel={channel} className="absolute inset-0 opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/82 to-[#09090b]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-black/30" />
        <header className="relative z-10 flex items-center gap-6 px-5 py-5 text-sm font-bold text-white/72 sm:px-8 lg:px-14">
          <button type="button" onClick={onBack} className="text-white">ARGUS</button>
          <span className="text-white">{title}</span>
          <a href="#episodes" className="hover:text-white">Episodes</a>
          <a href="#about" className="hover:text-white">About</a>
        </header>
        <div className="relative z-10 flex min-h-[520px] max-w-4xl flex-col justify-end px-5 pb-16 sm:px-8 lg:px-14">
          <h1 className="max-w-3xl text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl lg:text-8xl">{title}</h1>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm font-black uppercase tracking-wide text-white">
            <span>{channel.category}</span>
            <span>2026</span>
            <span>1 Season</span>
            <span>TV-14</span>
            <span>{formatViewers(totalWatching)} watching</span>
          </div>
          <p className="mt-6 text-lg font-black uppercase text-[#4ade80]">All episodes streaming live watch sessions</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f1f1f3] sm:text-xl">{description}</p>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-[#b9b9c2]">Featuring: elite hunters, cursed warriors, rival clans, and a season-long battle for survival.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {episodes[0]?.muxPlaybackId ? <button type="button" onClick={() => openEpisode(episodes[0])} className="flex min-h-14 items-center gap-3 rounded-md bg-[#2554e8] px-6 text-sm font-black uppercase tracking-wide text-white"><PlayIcon />{episodes[0].positionSeconds ? "Resume S1 E1" : "Watch S1 E1"}</button> : <a href={episodes[0]?.trailerUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-md bg-[#2554e8] px-6 text-sm font-black uppercase tracking-wide text-white"><PlayIcon />Watch S1 E1 Trailer</a>}
            <button type="button" onClick={() => setListed(!listed)} className="grid h-14 w-14 place-items-center rounded-full border border-white/40 text-4xl leading-none">{listed ? "✓" : "+"}</button>
            <span className="text-sm font-black uppercase tracking-wide">My List</span>
            <button type="button" className="ml-0 grid h-14 w-14 place-items-center rounded-full border border-white/40 lg:ml-5" aria-label="Notify"><BellIcon className="h-6 w-6" /></button>
            <span className="text-sm font-black uppercase tracking-wide">Notify</span>
          </div>
        </div>
      </section>

      <section id="episodes" className="px-5 pb-12 sm:px-8 lg:px-14">
          <div className="mb-5 flex items-end gap-8">
            <h2 className="text-3xl font-black">Full Episodes</h2>
            <span className="pb-1 text-base text-white/75">Season 1</span>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {episodes.map((episode) => (
              <EpisodeCard key={episode.code} episode={episode} onPlay={() => openEpisode(episode)} />
            ))}
          </div>
      </section>

      {playingEpisode?.muxPlaybackId && <EpisodePlaybackOverlay key={`${title}-${playingEpisode.code}`} title={title} episode={playingEpisode} viewerUsername={viewerUsername} onClose={() => setPlayingEpisode(null)} />}

      <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </div>
  );
}

function EpisodeCard({ episode, onPlay }: { episode: SeriesEpisode; onPlay: () => void }) {
  const cardBody = (
    <>
                <span className="relative block aspect-video overflow-hidden rounded-md bg-white/5">
                  <Image src={episode.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Live</span>
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white">{formatViewers(episode.viewers)} watching</span>
                  {episode.progressPercent > 0 && <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><i className="block h-full bg-[#2563eb]" style={{ width: `${episode.progressPercent}%` }} /></span>}
                  <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"><PlayIcon className="h-10 w-10" /></span>
                </span>
                <h3 className="mt-4 text-lg font-black"><span>{episode.code}</span> <span className="font-medium">{episode.name}</span></h3>
                <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-[#a1a1aa]">{episode.description}</p>
                <p className="mt-2 text-sm font-bold text-[#8f8f99]">{episode.progressPercent > 0 ? `${episode.progressPercent}% watched` : episode.duration}  {episode.date}  ·  {formatViewers(episode.viewers)} live</p>
    </>
  );

  if (episode.muxPlaybackId) {
    return <button type="button" onClick={onPlay} className="group text-left">{cardBody}</button>;
  }

  return <a href={episode.trailerUrl} target="_blank" rel="noreferrer" className="group text-left">{cardBody}</a>;
}

function ContinueWatchingRail({ items, onOpen }: { items: ContinueWatchingItem[]; onOpen: (channel: Channel) => void }) {
  if (!items.length) return null;

  return (
    <section className="relative mt-8 hidden lg:block">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#2563eb]">Resume</p>
          <h2 className="mt-1 text-xl font-black">Continue watching</h2>
        </div>
      </div>
      <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-5 xl:auto-cols-[310px]">
        {items.map((item) => (
          <button key={item.episodeId} type="button" onClick={() => onOpen(item.channel)} className="group min-w-0 text-left transition duration-300 hover:z-10 hover:scale-105 focus:z-10 focus:scale-105 focus:outline-none">
            <span className="relative block aspect-video overflow-hidden rounded-md bg-[#18181b] shadow-lg">
              <CatalogArtwork channel={item.channel} className="absolute inset-0 transition duration-500 group-hover:scale-110" />
              <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><i className="block h-full bg-[#2563eb]" style={{ width: `${item.progressPercent}%` }} /></span>
              <span className="absolute bottom-3 left-3 rounded bg-black/75 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">{item.progressPercent}% watched</span>
            </span>
            <strong className="mt-3 block truncate text-sm">{item.channel.catalogTitle ?? item.channel.displayName}</strong>
            <span className="mt-1 block truncate text-xs font-semibold text-[#a1a1aa]">{item.episodeCode} {item.episodeTitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function BrowseApp({ persistedChannels = [], followedChannels = [], recommendedChannels = [], catalogChannels = [], continueWatching = [], demoFallback = true, initialQuery = "", clerkConfigured = false, viewerIdentity, viewerUsername, mobileBrowse = false, pagination }: BrowseAppProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [mode, setMode] = useState<BrowseMode>("browse");
  const availableChannels = useMemo(() => {
    const recommendedUsernames = new Set(recommendedChannels.map((channel) => channel.username));
    if (!demoFallback) return persistedChannels;
    const persistedUsernames = new Set(persistedChannels.map((channel) => channel.username));
    return [
      ...persistedChannels,
      ...recommendedChannels.filter((channel) => !persistedUsernames.has(channel.username)),
      ...channels.filter((channel) => !persistedUsernames.has(channel.username) && !recommendedUsernames.has(channel.username)),
    ];
  }, [demoFallback, persistedChannels, recommendedChannels]);
  const followedUsernames = useMemo(() => new Set(followedChannels.map((channel) => channel.username)), [followedChannels]);
  const visibleChannels = mode === "following" ? followedChannels : availableChannels;
  const filtered = useMemo(() => visibleChannels.filter((channel) => `${channel.displayName} ${channel.title} ${channel.category} ${channel.catalogTitle ?? ""}`.toLowerCase().includes(query.toLowerCase())), [visibleChannels, query]);
  const displayChannels = filtered.length ? filtered : visibleChannels;
  const trendingChannels = displayChannels.filter((channel) => channel.live);
  const liveStreamerChannels = persistedChannels.filter((channel) => channel.live);
  const recommendedDisplayChannels = recommendedChannels.length ? recommendedChannels : displayChannels.filter((channel) => channel.live).slice(0, 8);
  const catalogSource = catalogChannels.length ? catalogChannels : channels;
  const animeChannels = catalogSource
    .filter((channel) => !query.trim() || channel.catalogTitle?.toLowerCase().includes(query.trim().toLowerCase()))
    .sort(prioritizePlayableCatalog);
  const spotlightChannel = animeChannels[0];

  if (selected && !selected.hostIdentity) {
    return <SeriesDetailPage channel={selected} continueWatching={continueWatching} onBack={() => setSelected(null)} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />;
  }

  if (selected) return <div className="min-h-screen bg-black"><ChannelPage channel={selected} initialFollowing={followedUsernames.has(selected.username)} canFollow={!selected.hostIdentity || selected.hostIdentity !== viewerIdentity} authenticated={Boolean(viewerIdentity)} /><MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} /></div>;

  return (
    <div className="min-h-screen bg-[#07070a] text-[#f1f1f3]">
      <div className="hidden lg:block"><SiteTopbar query={query} onQuery={setQuery} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} mode={mode} onMode={setMode} /></div>
      <div>
        <div className="px-4 pb-24 pt-4 lg:px-7 lg:pb-6">
          <main className="min-w-0">
            {mobileBrowse ? <MobileChannelFeed query={query} onQuery={setQuery} data={trendingChannels.length ? trendingChannels : displayChannels} onOpen={setSelected} searchable /> : <MobileStreamingHome channels={animeChannels} onOpen={setSelected} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />}
            <Hero channel={spotlightChannel} onOpen={setSelected} />
            <ContinueWatchingRail items={continueWatching} onOpen={setSelected} />
            <ContentRail title="Recommended for you" channels={recommendedDisplayChannels.slice(0, 12)} onOpen={setSelected} horizontal />
            <div id="live-streamers"><ContentRail title={mode === "following" ? "Your followed channels" : "Live streamers"} channels={(mode === "following" ? followedChannels : liveStreamerChannels).slice(0, 12)} onOpen={setSelected} horizontal /></div>
            <div id="live-anime"><ContentRail title="Live anime" channels={animeChannels} onOpen={setSelected} /></div>
            <ContentRail title="Because you watch anime" channels={[...animeChannels].reverse()} onOpen={setSelected} />
            {mode === "browse" && pagination && (pagination.page > 1 || pagination.hasNext) && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Channel pages">{pagination.page > 1 && <Link href={`${pagination.baseHref}${pagination.page - 1}`} className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold">Previous</Link>}<span className="text-xs text-[#94949f]">Page {pagination.page}</span>{pagination.hasNext && <Link href={`${pagination.baseHref}${pagination.page + 1}`} className="rounded-lg bg-[#8425e6] px-4 py-2 text-xs font-bold">Next</Link>}</nav>}
          </main>
        </div>
      </div>
      {mobileBrowse && <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} active="search" />}
    </div>
  );
}
