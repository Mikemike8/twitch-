"use client";

import Image from "next/image";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import { Show, SignInButton } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { catalogTitle, prioritizePlayableCatalog } from "@/components/browse/catalog-utils";
import { CatalogArtwork, HeroTrailerBackground, heroTrailerTitle } from "@/components/browse/catalog-media";
import { EpisodePlaybackOverlay } from "@/components/browse/episode-playback-overlay";
import { ContinueWatchingMovieBlock, MovieBlockRail } from "@/components/browse/movie-blocks";
import { BrandLogo } from "@/components/brand-logo";
import { ChannelPage } from "@/components/channel-page";
import { SearchIcon } from "@/components/icons";
import { SiteTopbar } from "@/components/site-topbar";
import { demoCatalogTitles, formatViewers, type Channel } from "@/lib/channels";
import { seriesDescriptions, seriesEpisodes, type CatalogEpisode } from "@/lib/catalog-episodes";
import { inputLimits } from "@/lib/validation";

type BrowseAppProps = {
  persistedChannels?: Channel[];
  followedChannels?: Channel[];
  recommendedChannels?: Channel[];
  catalogChannels?: Channel[];
  creatorFilmChannels?: Channel[];
  continueWatching?: ContinueWatchingItem[];
  demoFallback?: boolean;
  initialQuery?: string;
  clerkConfigured?: boolean;
  viewerIdentity?: string;
  viewerUsername?: string;
  liveFeatures?: boolean;
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

const browseHistoryKey = "argusBrowseView";

type BrowseHistoryView = "detail" | "episode";

function pushBrowseHistory(view: BrowseHistoryView) {
  window.history.pushState({ ...(window.history.state ?? {}), [browseHistoryKey]: view }, "", window.location.href);
}

function backThroughBrowseHistory(view: BrowseHistoryView, fallback: () => void) {
  if (window.history.state?.[browseHistoryKey] === view) {
    window.history.back();
    return;
  }

  fallback();
}

function BrowseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></svg>;
}

function ProfileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function MobileBottomNav({ viewerUsername, clerkConfigured = false, active = "home" }: { viewerUsername?: string; clerkConfigured?: boolean; active?: "home" | "search" | "live" | "profile" }) {
  const itemClass = "relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 px-1 pb-1 pt-2 text-[10px] font-bold uppercase";
  const color = (item: typeof active) => item === active ? "text-white" : "text-white/55";
  const marker = (item: typeof active) => item === active ? <i className="absolute top-0 h-0.5 w-8 rounded-full bg-[#e50914]" /> : null;
  return <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/92 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
    <Link href="/" className={`${itemClass} ${color("home")}`}>{marker("home")}<HomeIcon className="h-7 w-7" />Home</Link>
    <Link href="/search" className={`${itemClass} ${color("search")}`}>{marker("search")}<BrowseIcon className="h-7 w-7" />Search</Link>
    <Link href="/live" className={`${itemClass} ${color("live")}`}>{marker("live")}<LiveTvIcon className="h-7 w-7" />Live</Link>
    {clerkConfigured ? (
      <>
        <Show when="signed-in">
          <Link href={viewerUsername ? `/${viewerUsername}` : "/profile"} className={`${itemClass} ${color("profile")}`}>{marker("profile")}<ProfileIcon className="h-7 w-7" />Profile</Link>
        </Show>
        <Show when="signed-out">
          <SignInButton fallbackRedirectUrl="/profile">
            <button type="button" className={`${itemClass} ${color("profile")}`}>{marker("profile")}<ProfileIcon className="h-7 w-7" />Profile</button>
          </SignInButton>
        </Show>
      </>
    ) : (
      <Link href="/profile" className={`${itemClass} ${color("profile")}`}>{marker("profile")}<ProfileIcon className="h-7 w-7" />Profile</Link>
    )}
  </nav>;
}

function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}

function LiveTvIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="13" rx="1" /><path d="m10 9 5 2.5-5 2.5ZM8 21h8" /></svg>;
}

function TransitionLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/68 text-white backdrop-blur-sm">
      <div className="flex min-w-40 flex-col items-center gap-4 rounded border border-white/10 bg-[#141414]/92 px-6 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
        <span className="relative h-10 w-10">
          <span className="absolute inset-0 rounded-full border-2 border-white/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#e50914]" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white/75">{label}</span>
      </div>
    </div>
  );
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7Z" /></svg>;
}

function BackArrowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
}

function Hero({ channel, liveFeatures = true, onOpen }: { channel?: Channel; liveFeatures?: boolean; onOpen: (channel: Channel) => void }) {
  if (!channel) return null;
  return (
    <section className="relative -mx-7 -mt-4 hidden min-h-[640px] overflow-hidden bg-black lg:block">
      <HeroTrailerBackground channel={channel} className="absolute inset-0" showMuteControl />
      <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/32 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/82 via-transparent to-black/10" />
      <div className="relative z-10 flex min-h-[640px] max-w-2xl flex-col justify-end px-10 pb-24 xl:px-14">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-[#b3b3b3]"><span className="h-2.5 w-2.5 rounded bg-[#e50914]" />Featured anime</div>
        <h1 className="text-5xl font-black leading-none tracking-normal xl:text-7xl">{heroTrailerTitle}</h1>
        <p className="mt-5 text-xl font-medium text-white">{liveFeatures ? "Streaming now on ARGUS" : "Watch episodes and featured series on ARGUS"}</p>
        <p className="mt-3 max-w-xl text-base leading-6 text-[#bcbcbc]">{liveFeatures ? "Join the live watch room, react with the community, and follow the conversation in real time." : "Browse the anime library, resume episodes, and discover what to watch next."}</p>
        {liveFeatures && <div className="mt-5 flex flex-wrap items-center gap-2 text-sm"><span className="rounded bg-[#e50914] px-2 py-1 font-bold text-white">LIVE</span><span className="text-[#b3b3b3]">1M viewers</span></div>}
        <div className="mt-7 flex gap-3">
          <button onClick={() => onOpen(channel)} className="flex items-center gap-2 rounded bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-white/80"><PlayIcon />{liveFeatures ? "Watch live" : "Watch now"}</button>
          <button onClick={() => onOpen(channel)} className="rounded bg-white/20 px-6 py-3 text-base font-bold text-white transition hover:bg-white/30">More info</button>
        </div>
      </div>
    </section>
  );
}

function MobileStreamingHome({ channels: mobileChannels, independentChannels = [], liveFeatures = true, onOpen, clerkConfigured, viewerUsername }: { channels: Channel[]; independentChannels?: Channel[]; liveFeatures?: boolean; onOpen: (channel: Channel) => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const featured = mobileChannels.slice(0, 4);
  const spotlight = featured[featuredIndex] ?? mobileChannels[0];

  useEffect(() => {
    const update = () => setNavScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!spotlight) return <div className="-mx-4 -mt-4 grid min-h-screen place-items-center bg-black text-sm text-white/65 lg:hidden">No channels available.</div>;

  const nextWatch = mobileChannels.slice(1, 7);
  const keepWatching = [...mobileChannels].reverse().slice(0, 5);
  const comedy = [...mobileChannels.slice(3), ...mobileChannels.slice(0, 3)];
  const independent = independentChannels.length ? independentChannels : [...mobileChannels.slice(2), ...mobileChannels.slice(0, 2)];
  const topTen = mobileChannels.slice(0, 10);

  return (
    <section className="-mx-4 -mt-4 mobile-app-stage min-h-screen overflow-hidden pb-24 text-white lg:hidden">
      <div className="relative">
        <header className={`sticky top-0 z-30 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] transition-[background-color,box-shadow,backdrop-filter] duration-300 ${navScrolled ? "bg-black/86 shadow-[0_12px_34px_rgba(0,0,0,0.32)] backdrop-blur-xl" : "bg-transparent"}`}>
          <div className="flex items-center justify-center">
            <BrandLogo className="h-9 w-auto" />
          </div>
        </header>

        <div className="px-5 pt-1">
          <div className="relative block h-[62vh] min-h-[480px] w-full overflow-hidden rounded border border-white/10 bg-[#181818] text-left shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
            <HeroTrailerBackground channel={spotlight} className="absolute inset-0" showMuteControl />
            <button type="button" onClick={() => onOpen(spotlight)} className="absolute inset-0 z-10" aria-label={`Watch ${catalogTitle(spotlight, 0)}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" />
            {liveFeatures && <LiveViewerBadge viewers={spotlight.viewers} className="absolute left-4 top-4" />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5">
              <p className="text-xs font-medium uppercase text-[#b3b3b3]">{liveFeatures ? "Streaming now" : "Featured series"}</p>
              <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-normal">{heroTrailerTitle}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#d2d2d2]">
                <span className="border border-[#bcbcbc] px-1.5 py-0.5 text-[#bcbcbc]">TV-14</span>
                <span>2026</span>
                <span>1 Season</span>
                <span className="text-[#46d369]">New</span>
              </div>
              <p className="mt-4 max-w-[18rem] text-sm leading-5 text-[#d2d2d2]">{liveFeatures ? "Live watch room, episodes, and chat in one place." : "Episodes, trailers, and series details in one place."}</p>
            </div>
          </div>
          <div className="mt-1 flex justify-center gap-1">
            {featured.map((channel, index) => (
              <button key={`featured-dot-${channel.username}`} type="button" onClick={() => setFeaturedIndex(index)} className="grid h-10 min-w-10 place-items-center" aria-label={`Feature ${catalogTitle(channel, index)}`}>
                <span className={`h-1.5 rounded-full transition ${index === featuredIndex ? "w-7 bg-[#e50914]" : "w-1.5 bg-white/35"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-5 px-5">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onOpen(spotlight)} className="flex items-center justify-center gap-2 rounded bg-white px-3 py-3 text-sm font-bold text-black"><PlayIcon className="h-4 w-4" />Play</button>
            <Link href="/profile" className="rounded bg-white/20 px-3 py-3 text-center text-sm font-bold text-white">My profile</Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 px-5">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            {(liveFeatures ? ["Series", "Anime", "Live"] : ["Series", "Anime", "Movies"]).map((item) => <span key={item} className="rounded border border-white/15 bg-[#181818] px-2 py-2 text-[#e5e5e5]">{item}</span>)}
          </div>
        </div>

        <div className="relative z-10 mt-9 space-y-9">
          <MobileLandscapeRail title="Continue Watching" channels={keepWatching} onOpen={onOpen} compact />
          <MobileTopTenRail title="Top 10 Today" channels={topTen} onOpen={onOpen} />
          <MobilePosterRail title="Movies & Series" channels={nextWatch} onOpen={onOpen} />
          <MobileLandscapeRail title="Independent Films" channels={independent} onOpen={onOpen} />
          <MobilePosterRail title="Comedy Shows" channels={comedy} onOpen={onOpen} />
          <MobilePosterRail title="Most-Watched Classics" channels={[...mobileChannels].reverse()} onOpen={onOpen} />
        </div>
      </div>
      <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </section>
  );
}

function MobilePosterRail({ title, channels: railChannels, liveFeatures = true, onOpen }: { title: string; channels: Channel[]; liveFeatures?: boolean; onOpen: (channel: Channel) => void }) {
  return <section><h2 className="px-5 text-xl font-bold">{title}</h2><div className="scroll-fade-x mt-3 flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className="relative aspect-[2/3] w-[30vw] max-w-36 shrink-0 overflow-hidden rounded border border-white/8 bg-[#181818]"><CatalogArtwork channel={channel} className="absolute inset-0" /><div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent" />{liveFeatures && <LiveViewerBadge viewers={channel.viewers} className="absolute bottom-2 left-2" />}</button>)}</div></section>;
}

function MobileLandscapeRail({ title, channels: railChannels, liveFeatures = true, onOpen, compact = false }: { title: string; channels: Channel[]; liveFeatures?: boolean; onOpen: (channel: Channel) => void; compact?: boolean }) {
  return <section><h2 className="px-5 text-xl font-bold">{title}</h2><div className="scroll-fade-x mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className={`${compact ? "w-[68vw]" : "w-[50vw]"} max-w-72 shrink-0 text-left`}><span className="relative block aspect-video overflow-hidden rounded border border-white/8 bg-[#181818]"><CatalogArtwork channel={channel} className="absolute inset-0" />{liveFeatures && <LiveViewerBadge viewers={channel.viewers} className="absolute left-2 top-2" />}<i className="absolute inset-x-0 bottom-0 h-1 bg-[#e50914]" /></span><span className="mt-2 block text-xs text-[#808080]">{2022 + index} · {96 + index * 9}min</span><strong className="mt-1 block truncate text-sm font-medium">{catalogTitle(channel, index)}</strong></button>)}</div></section>;
}

function MobileTopTenRail({ title, channels: railChannels, onOpen }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void }) {
  return <section><h2 className="px-5 text-xl font-bold">{title}</h2><div className="scroll-fade-x mt-3 flex gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className="relative flex w-[44vw] max-w-56 shrink-0 items-end text-left"><span className="mr-[-0.65rem] min-w-[2.8rem] text-7xl font-black leading-none text-black [-webkit-text-stroke:1.5px_#808080]">{index + 1}</span><span className="relative block aspect-[2/3] w-full overflow-hidden rounded border border-white/8 bg-[#181818]"><CatalogArtwork channel={channel} className="absolute inset-0" /><span className="absolute left-2 top-2 rounded bg-[#e50914] px-1.5 py-1 text-[9px] font-bold uppercase">Top 10</span></span></button>)}</div></section>;
}

function LiveViewerBadge({ viewers, className = "" }: { viewers: number; className?: string }) {
  return <span className={`${className} flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-[9px] font-bold uppercase text-white`}><i className="h-1.5 w-1.5 rounded-full bg-[#e50914]" />Live · {formatViewers(viewers)}</span>;
}

function MobileChannelFeed({ query, onQuery, data, onOpen, searchable = false }: { query: string; onQuery: (value: string) => void; data: Channel[]; onOpen: (channel: Channel) => void; searchable?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = query.trim();
  const topSearches = data.slice(0, 12);
  const nextWatch = [...data].reverse().slice(0, 12);
  const independent = data.filter((channel) => channel.category !== "Anime").slice(0, 12);

  useEffect(() => {
    if (!searchable) return;

    const timeout = window.setTimeout(() => {
      const target = normalizedQuery ? `/search?term=${encodeURIComponent(normalizedQuery)}` : "/search";
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [normalizedQuery, router, searchable, startTransition]);

  return (
    <section className="-mx-4 -mt-4 min-h-screen overflow-hidden bg-[#111] pb-24 text-white lg:hidden">
      {isPending && <TransitionLoader label="Searching" />}
      <header className="px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {searchable && <form onSubmit={(event) => { event.preventDefault(); startTransition(() => { router.push(normalizedQuery ? `/search?term=${encodeURIComponent(normalizedQuery)}` : "/search"); }); }} className="flex h-16 items-center gap-3 rounded bg-[#1d1d1f] px-4 shadow-[0_14px_44px_rgba(0,0,0,0.28)]">
          <SearchIcon className="h-6 w-6 shrink-0 text-[#a9a9ad]" />
          <input value={query} maxLength={inputLimits.searchTerm} onChange={(event) => onQuery(event.target.value)} placeholder="Search" autoFocus className="min-w-0 flex-1 bg-transparent text-2xl font-medium text-white outline-none placeholder:text-[#a9a9ad]" />
        </form>}
        <div className="scroll-fade-x mt-3 flex gap-4 overflow-x-auto pr-4 text-sm font-semibold text-[#b9b9bd] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["New & Popular", "Originals", "Kids & Family", "Action & Adventure", "Comedy", "Documentary", "Drama", "Horror", "Reality", "Sci-Fi & Fantasy", "Thriller", "Showtime", "Sports"].map((item) => (
            <button key={item} type="button" onClick={() => onQuery(item)} className="min-h-11 shrink-0 whitespace-nowrap px-1 hover:text-white">{item}</button>
          ))}
        </div>
      </header>
      <div className="space-y-8">
        {data.length ? (
          <>
            <MobilePosterRail title={normalizedQuery ? "Results" : "Top Searches"} channels={topSearches} onOpen={onOpen} />
            <MobilePosterRail title="Your Next Watch" channels={nextWatch} onOpen={onOpen} />
            <MobilePosterRail title="Independent Films" channels={independent.length ? independent : data.slice(3, 15)} onOpen={onOpen} />
          </>
        ) : <div className="px-5 py-12 text-sm font-semibold text-[#b3b3b3]">No results found.</div>}
      </div>
    </section>
  );
}

function CategoriesRail({ channels: categoryChannels, onSelect }: { channels: Channel[]; onSelect: (category: string) => void }) {
  const categories = Array.from(new Set(categoryChannels.flatMap((channel) => [channel.category, ...channel.tags]))).filter(Boolean).slice(0, 14);
  if (!categories.length) return null;

  return (
    <section id="categories" className="relative mt-8 hidden scroll-mt-24 lg:block">
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase text-[#b3b3b3]">Browse by genre</p>
        <h2 className="mt-1 text-xl font-bold">Categories</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button key={category} type="button" onClick={() => onSelect(category)} className="rounded border border-white/15 bg-[#181818] px-4 py-2 text-xs font-bold uppercase text-[#bcbcbc] transition hover:border-white/30 hover:bg-[#232323] hover:text-white">
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}

function CreatorFilmDetailPage({ channel, onBack, clerkConfigured, viewerUsername }: { channel: Channel; onBack: () => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const title = channel.catalogTitle ?? channel.displayName;
  const canPlay = Boolean(channel.playbackUrl);

  const enterFullscreen = () => {
    playerShellRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const share = () => {
    const url = `${window.location.origin}/`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#141414] pb-24 text-white">
      <section className="relative bg-black">
        <header className="relative z-10 flex min-w-0 items-center gap-3 px-4 py-4 text-sm font-bold text-white/72 sm:gap-6 sm:px-8 sm:py-5 lg:px-14">
          <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center text-white transition hover:text-white/75" aria-label="Back to browse">
            <BackArrowIcon className="h-5 w-5" />
          </button>
          <BrandLogo className="hidden h-7 w-auto shrink-0 sm:block" />
          <span className="min-w-0 flex-1 truncate text-white">{title}</span>
        </header>
        <div ref={playerShellRef} className="relative mx-auto aspect-video max-h-[72vh] w-full max-w-6xl overflow-hidden bg-black">
          {canPlay && channel.playbackProvider === "mux" ? (
            <MuxPlayer playbackId={channel.playbackUrl ?? ""} streamType="on-demand" metadata={{ video_title: title }} className="absolute inset-0 h-full w-full [--media-object-fit:contain]" />
          ) : canPlay ? (
            <video src={channel.playbackUrl ?? undefined} controls playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[#101014] px-6 text-center">
              <div>
                <p className="text-lg font-black">Video unavailable</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/60">This creator film is published, but no playable video has been attached yet.</p>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="px-5 py-8 sm:px-8 lg:px-14">
        <div className="max-w-4xl">
          <p className="text-xs font-medium uppercase text-[#b3b3b3]">Creator film</p>
          <h1 className="mt-3 break-words text-4xl font-black uppercase leading-none sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#d2d2d2]">{channel.bio || "Independent creator film."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={share} className="rounded bg-white/12 px-4 py-3 text-sm font-black hover:bg-white/18">Share</button>
            {canPlay && <button type="button" onClick={enterFullscreen} className="rounded bg-white px-4 py-3 text-sm font-black text-black hover:bg-[#e5e5e5]">Fullscreen</button>}
          </div>
        </div>
      </section>
      <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </div>
  );
}

function SeriesDetailPage({ channel, continueWatching, onBack, clerkConfigured, viewerUsername }: { channel: Channel; continueWatching: ContinueWatchingItem[]; onBack: () => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const [playingEpisode, setPlayingEpisode] = useState<CatalogEpisode | null>(null);
  const title = channel.catalogTitle ?? channel.displayName;
  const progressByEpisode = useMemo(() => new Map(continueWatching.map((item) => [item.episodeId, item])), [continueWatching]);
  const episodes = seriesEpisodes(channel, progressByEpisode);
  const currentEpisodeIndex = playingEpisode ? episodes.findIndex((episode) => episode.id === playingEpisode.id) : -1;
  const previousPlayableEpisode = currentEpisodeIndex > 0
    ? episodes.slice(0, currentEpisodeIndex).reverse().find((episode) => episode.muxPlaybackId)
    : undefined;
  const nextPlayableEpisode = currentEpisodeIndex >= 0
    ? episodes.slice(currentEpisodeIndex + 1).find((episode) => episode.muxPlaybackId)
    : undefined;
  const description = seriesDescriptions[title] ?? "A dark anime saga unfolds across a season of battles, secrets, and impossible choices.";
  const totalWatching = episodes.reduce((sum, episode) => sum + episode.viewers, 0);
  const openEpisode = (episode: CatalogEpisode) => {
    setPlayingEpisode(episode);
    pushBrowseHistory("episode");
  };
  const closeEpisode = useCallback(() => setPlayingEpisode(null), []);
  const goBackFromEpisode = useCallback(() => backThroughBrowseHistory("episode", closeEpisode), [closeEpisode]);

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

  useEffect(() => {
    if (!playingEpisode) return;

    const closeOnHistoryBack = (event: PopStateEvent) => {
      if (event.state?.[browseHistoryKey] !== "episode") {
        closeEpisode();
      }
    };

    window.addEventListener("popstate", closeOnHistoryBack);
    return () => window.removeEventListener("popstate", closeOnHistoryBack);
  }, [closeEpisode, playingEpisode]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#141414] pb-24 text-white">
      <section className="relative min-h-[100svh] overflow-hidden bg-black sm:min-h-[620px]">
        <HeroTrailerBackground channel={channel} className="absolute inset-0" showMuteControl />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/38 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/88 via-[#141414]/16 to-black/8" />
        <header className="relative z-10 flex min-w-0 items-center gap-3 px-4 py-4 text-sm font-bold text-white/72 sm:gap-6 sm:px-8 sm:py-5 lg:px-14">
          <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center text-white transition hover:text-white/75" aria-label="Back to browse">
            <BackArrowIcon className="h-5 w-5" />
          </button>
          <BrandLogo className="hidden h-7 w-auto shrink-0 sm:block" />
          <span className="min-w-0 flex-1 truncate text-white sm:flex-none">{title}</span>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#episodes" className="hover:text-white">Episodes</a>
            <a href="#about" className="hover:text-white">About</a>
          </nav>
        </header>
        <div className="relative z-10 flex min-h-[calc(100svh-76px)] max-w-4xl flex-col justify-end px-5 pb-14 sm:min-h-[520px] sm:px-8 sm:pb-16 lg:px-14">
          <h1 className="max-w-3xl break-words text-[clamp(2.75rem,14vw,5rem)] font-black uppercase leading-none tracking-normal sm:text-7xl lg:text-8xl">{title}</h1>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-base text-[#bcbcbc]">
            <span>{channel.category}</span>
            <span>2026</span>
            <span>1 Season</span>
            <span className="border border-[#bcbcbc] px-1.5 text-sm text-[#bcbcbc]">TV-14</span>
            <span>{formatViewers(totalWatching)} watching</span>
          </div>
          <p className="mt-6 text-base font-medium text-[#46d369]">New episodes with live watch sessions</p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white sm:text-lg">{description}</p>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-[#b3b3b3]"><span className="text-[#777]">Featuring:</span> elite hunters, cursed warriors, rival clans, and a season-long battle for survival.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            {episodes[0]?.muxPlaybackId ? <button type="button" onClick={() => openEpisode(episodes[0])} className="flex min-h-12 min-w-0 items-center gap-3 rounded bg-white px-5 text-sm font-bold text-black sm:px-6 sm:text-base"><PlayIcon />{episodes[0].positionSeconds ? "Resume S1 E1" : "Watch S1 E1"}</button> : <button type="button" disabled className="flex min-h-12 min-w-0 cursor-not-allowed items-center gap-3 rounded bg-white/14 px-5 text-sm font-bold text-white/45 sm:px-6 sm:text-base"><PlayIcon />Video unavailable</button>}
          </div>
        </div>
      </section>

      <section id="episodes" className="px-5 pb-12 sm:px-8 lg:px-14">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-[#b3b3b3]">Season guide</p>
              <h2 className="mt-2 text-3xl font-bold">Full Episodes</h2>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto text-sm font-bold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 rounded bg-white px-4 py-2 text-black">Season 1</span>
              <span className="shrink-0 rounded border border-white/15 px-4 py-2 text-[#b3b3b3]">{episodes.length} Episodes</span>
              <span className="shrink-0 rounded border border-white/15 px-4 py-2 text-[#b3b3b3]">Live chat</span>
            </div>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {episodes.map((episode) => (
              <EpisodeCard key={episode.code} episode={episode} onPlay={() => openEpisode(episode)} />
            ))}
          </div>
      </section>

      <section id="about" className="px-5 pb-12 sm:px-8 lg:px-14">
        <div className="max-w-4xl border-t border-white/10 pt-8">
          <p className="text-xs font-medium uppercase text-[#b3b3b3]">About</p>
          <h2 className="mt-2 text-3xl font-bold">{title}</h2>
          <p className="mt-4 text-base leading-7 text-[#d2d2d2]">{description}</p>
        </div>
      </section>

      {playingEpisode?.muxPlaybackId && <EpisodePlaybackOverlay key={`${title}-${playingEpisode.code}`} title={title} episode={playingEpisode} nextEpisode={nextPlayableEpisode} previousEpisode={previousPlayableEpisode} viewerUsername={viewerUsername} onClose={goBackFromEpisode} onNext={setPlayingEpisode} />}

      <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </div>
  );
}

function EpisodeCard({ episode, onPlay }: { episode: CatalogEpisode; onPlay: () => void }) {
  const cardBody = (
    <>
                <span className="relative block aspect-video overflow-hidden rounded bg-[#181818]">
                  <Image src={episode.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded bg-[#e50914] px-2 py-1 text-[10px] font-bold uppercase text-white">Live</span>
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white">{formatViewers(episode.viewers)} watching</span>
                  {episode.progressPercent > 0 && <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><i className="block h-full bg-[#e50914]" style={{ width: `${episode.progressPercent}%` }} /></span>}
                  <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"><PlayIcon className="h-10 w-10" /></span>
                </span>
                <h3 className="mt-4 text-lg font-bold"><span>{episode.code}</span> <span className="font-medium">{episode.name}</span></h3>
                <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-[#b3b3b3]">{episode.description}</p>
                <p className="mt-2 text-sm font-medium text-[#808080]">{episode.progressPercent > 0 ? `${episode.progressPercent}% watched` : episode.duration}  {episode.date}  ·  {formatViewers(episode.viewers)} live</p>
    </>
  );

  if (episode.muxPlaybackId) {
    return <button type="button" onClick={onPlay} className="group text-left">{cardBody}</button>;
  }

  return <button type="button" disabled className="group cursor-not-allowed text-left opacity-55">{cardBody}</button>;
}

export function BrowseApp({ persistedChannels = [], followedChannels = [], recommendedChannels = [], catalogChannels = [], creatorFilmChannels = [], continueWatching = [], demoFallback = true, initialQuery = "", clerkConfigured = false, viewerIdentity, viewerUsername, mobileBrowse = false, pagination }: BrowseAppProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [isPagePending, startPageTransition] = useTransition();
  void persistedChannels;
  void recommendedChannels;
  const followedUsernames = useMemo(() => new Set(followedChannels.map((channel) => channel.username)), [followedChannels]);
  const catalogSource = catalogChannels.length ? catalogChannels : (demoFallback ? demoCatalogTitles : []);
  const animeChannels = catalogSource
    .filter((channel) => !query.trim() || channel.catalogTitle?.toLowerCase().includes(query.trim().toLowerCase()))
    .sort(prioritizePlayableCatalog);
  const searchResultChannels = animeChannels;
  const spotlightChannel = animeChannels[0];
  const independentFilms = creatorFilmChannels.length ? creatorFilmChannels : [...animeChannels.slice(2), ...animeChannels.slice(0, 2)];
  const creatorFilms = animeChannels.filter((channel) => channel.kind === "creator");
  const creatorFilmBlock = creatorFilms.length ? creatorFilms : animeChannels;
  const openChannel = useCallback((channel: Channel) => {
    setSelected(channel);
    pushBrowseHistory("detail");
  }, []);
  const closeSelected = useCallback(() => setSelected(null), []);
  const goBackFromSelected = useCallback(() => backThroughBrowseHistory("detail", closeSelected), [closeSelected]);

  useEffect(() => {
    if (!selected) return;

    const closeOnHistoryBack = (event: PopStateEvent) => {
      if (event.state?.[browseHistoryKey] !== "detail" && event.state?.[browseHistoryKey] !== "episode") {
        closeSelected();
      }
    };

    window.addEventListener("popstate", closeOnHistoryBack);
    return () => window.removeEventListener("popstate", closeOnHistoryBack);
  }, [closeSelected, selected]);

  if (selected?.playbackUrl) {
    return <CreatorFilmDetailPage channel={selected} onBack={goBackFromSelected} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />;
  }

  if (selected && !selected.hostIdentity) {
    return <SeriesDetailPage channel={selected} continueWatching={continueWatching} onBack={goBackFromSelected} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />;
  }

  if (selected) return <div className="min-h-screen bg-black"><ChannelPage channel={selected} initialFollowing={followedUsernames.has(selected.username)} canFollow={!selected.hostIdentity || selected.hostIdentity !== viewerIdentity} authenticated={Boolean(viewerIdentity)} /><MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} /></div>;

  return (
    <div className="app-shell min-h-screen text-[#f1f1f3]">
      {isPagePending && <TransitionLoader />}
      <div className="hidden lg:block"><SiteTopbar query={query} onQuery={setQuery} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} active={mobileBrowse ? "search" : "home"} /></div>
      <div>
        <div className="px-4 pb-24 pt-4 lg:px-7 lg:pb-6">
          <main className="min-w-0">
            {mobileBrowse ? <MobileChannelFeed query={query} onQuery={setQuery} data={searchResultChannels} onOpen={openChannel} searchable /> : <MobileStreamingHome channels={animeChannels} independentChannels={creatorFilmChannels} liveFeatures={false} onOpen={openChannel} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />}
            <Hero channel={spotlightChannel} liveFeatures={false} onOpen={openChannel} />
            <MovieBlockRail id="movies-series" title="Movies & Series" channels={animeChannels.slice(0, 14)} variant="first" onOpen={openChannel} />
            <ContinueWatchingMovieBlock items={continueWatching} onOpen={openChannel} />
            <MovieBlockRail title="Independent Films" channels={independentFilms} onOpen={openChannel} />
            <MovieBlockRail title="Top 10 Today" channels={animeChannels.slice(0, 10)} variant="top10" onOpen={openChannel} />
            <CategoriesRail channels={animeChannels} onSelect={setQuery} />
            <MovieBlockRail id="creator-films" title="Creator Films" channels={creatorFilmBlock} onOpen={openChannel} />
            <MovieBlockRail title="Because you watch anime" channels={[...animeChannels].reverse()} onOpen={openChannel} />
            {pagination && (pagination.page > 1 || pagination.hasNext) && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Channel pages">{pagination.page > 1 && <Link href={`${pagination.baseHref}${pagination.page - 1}`} onClick={(event) => { event.preventDefault(); startPageTransition(() => { router.push(`${pagination.baseHref}${pagination.page - 1}`); }); }} className="rounded bg-white/10 px-4 py-2 text-xs font-bold">Previous</Link>}<span className="text-xs text-[#94949f]">Page {pagination.page}</span>{pagination.hasNext && <Link href={`${pagination.baseHref}${pagination.page + 1}`} onClick={(event) => { event.preventDefault(); startPageTransition(() => { router.push(`${pagination.baseHref}${pagination.page + 1}`); }); }} className="rounded bg-[#e50914] px-4 py-2 text-xs font-bold">Next</Link>}</nav>}
          </main>
        </div>
      </div>
      {mobileBrowse && <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} active="search" />}
    </div>
  );
}
