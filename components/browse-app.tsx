"use client";

import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { LiveKitRoom, useChat, useParticipants } from "@livekit/components-react";
import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { recordVideoEvent, savePlaybackProgress } from "@/actions/catalog";
import { createEpisodeChatToken } from "@/actions/episode-token";
import { BrandLogo } from "@/components/brand-logo";
import { ChannelPage } from "@/components/channel-page";
import { BellIcon, SearchIcon } from "@/components/icons";
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

type PlayerProgressTarget = {
  currentTime: number;
  duration: number;
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

const heroTrailerPlaybackId = "xEjUkmnCYchvtR5CnnWc6QxGwko027FsIfrE7dBRLeKw";
const heroTrailerTitle = "Dandadan";

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
    <div className={`relative h-full w-full min-w-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden bg-[#171720]">
        {thumbnailUrl ? <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 1023px) 100vw, 33vw" className="h-full w-full object-cover object-center" /> : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${channel.colors[0]}, ${channel.colors[1]})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_34%),linear-gradient(0deg,rgba(0,0,0,0.22),transparent)]" />
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
    <div className={`relative h-full w-full min-w-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden bg-[#171720]">
        <Image src={artworkUrl} alt="" fill sizes="(max-width: 1023px) 100vw, 33vw" className="h-full w-full object-cover object-center" />
      </div>
    </div>
  );
}

function HeroTrailerBackground({ channel, className = "", showMuteControl = false }: { channel?: Channel; className?: string; showMuteControl?: boolean }) {
  const [muted, setMuted] = useState(true);
  const [shouldLoadTrailer, setShouldLoadTrailer] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<MuxPlayerRefAttributes | null>(null);
  const poster = channel?.posterUrl ?? channel?.thumbnailUrl ?? undefined;
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className);
  const applyTrailerAudio = useCallback((player: MuxPlayerRefAttributes | null, nextMuted: boolean) => {
    if (!player) return;

    player.muted = nextMuted;
    player.volume = nextMuted ? 0 : 1;
    (player as MuxPlayerRefAttributes & { defaultMuted?: boolean }).defaultMuted = nextMuted;
  }, []);
  const startPlayback = useCallback(() => {
    const player = playerRef.current;
    applyTrailerAudio(player, muted);
    if (!player) return;
    player.play().catch(() => undefined);
  }, [applyTrailerAudio, muted]);
  const setPlayerRef = useCallback((player: MuxPlayerRefAttributes | null) => {
    playerRef.current = player;
    if (!player) return;
    applyTrailerAudio(player, muted);
    window.requestAnimationFrame(() => {
      player.play().catch(() => undefined);
    });
  }, [applyTrailerAudio, muted]);
  const toggleTrailerAudio = useCallback(() => {
    setMuted((current) => {
      const nextMuted = !current;
      const player = playerRef.current;

      applyTrailerAudio(player, nextMuted);

      if (player) {
        player.play().catch(() => undefined);
      }

      return nextMuted;
    });
  }, [applyTrailerAudio]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateLoadState = () => {
      const rect = root.getBoundingClientRect();
      const hasLayout = rect.width > 0 && rect.height > 0;
      const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
      setShouldLoadTrailer(hasLayout && inViewport);
    };

    updateLoadState();

    if (typeof window.IntersectionObserver === "undefined") {
      window.addEventListener("resize", updateLoadState);
      window.addEventListener("scroll", updateLoadState, { passive: true });
      return () => {
        window.removeEventListener("resize", updateLoadState);
        window.removeEventListener("scroll", updateLoadState);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        setShouldLoadTrailer(entry.isIntersecting && rect.width > 0 && rect.height > 0);
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    observer.observe(root);
    window.addEventListener("resize", updateLoadState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLoadState);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadTrailer) return;

    const retryDelays = [0, 200, 600, 1200, 2400];
    const timeouts = retryDelays.map((delay) => window.setTimeout(startPlayback, delay));
    const playWhenVisible = () => {
      if (document.visibilityState === "visible") startPlayback();
    };

    document.addEventListener("visibilitychange", playWhenVisible);
    window.addEventListener("focus", startPlayback);

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      document.removeEventListener("visibilitychange", playWhenVisible);
      window.removeEventListener("focus", startPlayback);
    };
  }, [shouldLoadTrailer, startPlayback]);

  return (
    <div ref={rootRef} className={`${className} ${positioned ? "" : "relative"} h-full w-full overflow-hidden bg-black`}>
      {poster && (
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
      )}
      {shouldLoadTrailer && (
        <MuxPlayer
          ref={setPlayerRef}
          playbackId={heroTrailerPlaybackId}
          streamType="on-demand"
          autoPlay
          preload="auto"
          muted={muted}
          volume={muted ? 0 : 1}
          noMutedPref
          noVolumePref
          loop
          playsInline
          poster={poster}
          onLoadStart={startPlayback}
          onLoadedMetadata={startPlayback}
          onLoadedData={startPlayback}
          onCanPlay={startPlayback}
          onCanPlayThrough={startPlayback}
          metadata={{ video_title: `${heroTrailerTitle} trailer` }}
          className="pointer-events-none absolute inset-0 z-10 block h-full min-h-full w-full min-w-full max-w-none bg-black [--controls:none] [--media-object-fit:cover] [--media-object-position:center]"
          style={{
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            aspectRatio: "auto",
            ["--media-object-fit" as string]: "cover",
            ["--media-object-position" as string]: "center",
          }}
        />
      )}
      {showMuteControl && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleTrailerAudio();
          }}
          className="absolute bottom-5 right-5 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur transition hover:border-white/70 hover:bg-white/20"
          aria-label={muted ? "Unmute trailer" : "Mute trailer"}
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      )}
    </div>
  );
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

function CastIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M3 13a6 6 0 0 1 6 6M3 8a11 11 0 0 1 11 11" /><path d="M5 5h15a1 1 0 0 1 1 1v11" /></svg>;
}

function MutedIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m20 9-6 6M14 9l6 6" /></svg>;
}

function SoundIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
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

function ForwardIcon({ className = "h-4 w-4", direction = "next" }: { className?: string; direction?: "next" | "previous" }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4"><g className={direction === "previous" ? "origin-center rotate-180" : ""}><path d="M5 6l8 6-8 6V6Z" fill="currentColor" stroke="none" /><path d="M16 6v12" strokeLinecap="round" /></g></svg>;
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

function MobileStreamingHome({ channels: mobileChannels, liveFeatures = true, onOpen, clerkConfigured, viewerUsername }: { channels: Channel[]; liveFeatures?: boolean; onOpen: (channel: Channel) => void; clerkConfigured: boolean; viewerUsername?: string }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [listed, setListed] = useState(false);
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
  const topTen = mobileChannels.slice(0, 10);

  return (
    <section className="-mx-4 -mt-4 mobile-app-stage min-h-screen overflow-hidden pb-24 text-white lg:hidden">
      <div className="relative">
        <header className={`sticky top-0 z-30 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] transition-[background-color,box-shadow,backdrop-filter] duration-300 ${navScrolled ? "bg-black/86 shadow-[0_12px_34px_rgba(0,0,0,0.32)] backdrop-blur-xl" : "bg-transparent"}`}>
          <div className="flex items-center justify-center">
            <BrandLogo className="h-9 w-auto" />
            <button type="button" className="absolute right-5 grid h-10 w-10 place-items-center text-white/85" aria-label="Cast"><CastIcon className="h-7 w-7" /></button>
          </div>
        </header>

        <div className="px-5 pt-1">
          <div className="relative block h-[62vh] min-h-[480px] w-full overflow-hidden rounded border border-white/10 bg-[#181818] text-left shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
            <HeroTrailerBackground channel={spotlight} className="absolute inset-0" showMuteControl />
            <button type="button" onClick={() => onOpen(spotlight)} className="absolute inset-0 z-10" aria-label={`Watch ${animeTitle(spotlight, 0)}`} />
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
          <div className="mt-3 flex justify-center gap-1.5">
            {featured.map((channel, index) => <button key={`featured-dot-${channel.username}`} type="button" onClick={() => setFeaturedIndex(index)} className={`h-1.5 rounded-full transition ${index === featuredIndex ? "w-7 bg-[#e50914]" : "w-1.5 bg-white/35"}`} aria-label={`Feature ${animeTitle(channel, index)}`} />)}
          </div>
        </div>

        <div className="relative z-10 mt-5 px-5">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onOpen(spotlight)} className="flex items-center justify-center gap-2 rounded bg-white px-3 py-3 text-sm font-bold text-black"><PlayIcon className="h-4 w-4" />Play</button>
            <button type="button" onClick={() => setListed(!listed)} className="rounded bg-white/20 px-3 py-3 text-sm font-bold text-white"><span className="mr-2 text-lg leading-none">{listed ? "✓" : "+"}</span>My List</button>
          </div>
        </div>

        <div className="relative z-10 mt-8 px-5">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            {(liveFeatures ? ["Series", "Anime", "Live"] : ["Series", "Anime", "Movies"]).map((item) => <button key={item} type="button" className="rounded border border-white/15 bg-[#181818] px-2 py-2 text-[#e5e5e5]">{item}</button>)}
          </div>
        </div>

        <div className="relative z-10 mt-9 space-y-9">
          <MobileLandscapeRail title="Continue Watching" channels={keepWatching} onOpen={onOpen} compact />
          <MobileTopTenRail title="Top 10 Today" channels={topTen} onOpen={onOpen} />
          <MobilePosterRail title="Movies & Series" channels={nextWatch} onOpen={onOpen} />
          <MobileFeatureBlocks channels={comedy.slice(0, 3)} onOpen={onOpen} />
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
  return <section><h2 className="px-5 text-xl font-bold">{title}</h2><div className="scroll-fade-x mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className={`${compact ? "w-[68vw]" : "w-[50vw]"} max-w-72 shrink-0 text-left`}><span className="relative block aspect-video overflow-hidden rounded border border-white/8 bg-[#181818]"><CatalogArtwork channel={channel} className="absolute inset-0" />{liveFeatures && <LiveViewerBadge viewers={channel.viewers} className="absolute left-2 top-2" />}<i className="absolute inset-x-0 bottom-0 h-1 bg-[#e50914]" /></span><span className="mt-2 block text-xs text-[#808080]">{2022 + index} · {96 + index * 9}min</span><strong className="mt-1 block truncate text-sm font-medium">{animeTitle(channel, index)}</strong></button>)}</div></section>;
}

function MobileTopTenRail({ title, channels: railChannels, onOpen }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void }) {
  return <section><h2 className="px-5 text-xl font-bold">{title}</h2><div className="scroll-fade-x mt-3 flex gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{railChannels.map((channel, index) => <button type="button" key={`${title}-${channel.username}-${index}`} onClick={() => onOpen(channel)} className="relative flex w-[44vw] max-w-56 shrink-0 items-end text-left"><span className="mr-[-0.65rem] min-w-[2.8rem] text-7xl font-black leading-none text-black [-webkit-text-stroke:1.5px_#808080]">{index + 1}</span><span className="relative block aspect-[2/3] w-full overflow-hidden rounded border border-white/8 bg-[#181818]"><CatalogArtwork channel={channel} className="absolute inset-0" /><span className="absolute left-2 top-2 rounded bg-[#e50914] px-1.5 py-1 text-[9px] font-bold uppercase">Top 10</span></span></button>)}</div></section>;
}

function MobileFeatureBlocks({ channels: featureChannels, onOpen }: { channels: Channel[]; onOpen: (channel: Channel) => void }) {
  const channelsToShow = featureChannels.filter(Boolean).slice(0, 3);
  if (!channelsToShow.length) return null;

  return (
    <section className="space-y-3 px-5">
      {channelsToShow.map((channel, index) => <MovieFeatureBlock key={`mobile-feature-${channel.username}-${index}`} channel={channel} index={index} onOpen={onOpen} compact />)}
    </section>
  );
}

function MovieFeatureBlock({ channel, index = 0, onOpen, compact = false }: { channel: Channel; index?: number; onOpen: (channel: Channel) => void; compact?: boolean }) {
  const title = animeTitle(channel, index);
  return <button type="button" onClick={() => onOpen(channel)} className={`relative w-full overflow-hidden rounded border border-white/10 bg-[#181818] text-left ${compact ? "min-h-[220px]" : "min-h-[320px]"}`}><CatalogArtwork channel={channel} className="absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-r from-black/76 via-black/28 to-transparent" /><div className={`relative z-10 flex max-w-[70%] flex-col justify-end p-4 ${compact ? "min-h-[220px]" : "min-h-[320px] p-6"}`}><p className="text-[11px] font-bold uppercase text-[#e50914]">Featured Movie</p><h2 className={`mt-1.5 font-black uppercase leading-none ${compact ? "text-2xl" : "text-4xl"}`}>{title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#d2d2d2]">{channel.title || "A featured anime title picked from the ARGUS movie library."}</p><span className="mt-4 w-fit rounded bg-white px-3.5 py-2 text-xs font-bold text-black">More Info</span></div></button>;
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
        <div className="scroll-fade-x mt-5 flex gap-7 overflow-x-auto pr-4 text-sm font-semibold text-[#b9b9bd] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["New & Popular", "Originals", "Kids & Family", "Action & Adventure", "Comedy", "Documentary", "Drama", "Horror", "Reality", "Sci-Fi & Fantasy", "Thriller", "Showtime", "Sports"].map((item) => (
            <button key={item} type="button" onClick={() => onQuery(item)} className="shrink-0 whitespace-nowrap hover:text-white">{item}</button>
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

function RailCard({ channel, index, onOpen, horizontal = false }: { channel: Channel; index: number; onOpen: () => void; horizontal?: boolean }) {
  return <button onClick={onOpen} aria-label={`Watch ${animeTitle(channel, index)} live`} className="group min-w-0 transition duration-300 hover:z-10 hover:scale-[1.035] focus:z-10 focus:scale-[1.035] focus:outline-none"><div className={`relative overflow-hidden rounded border border-white/8 bg-[#181818] ${horizontal ? "aspect-video" : "aspect-[2/3]"}`}><CatalogArtwork channel={channel} className="absolute inset-0 transition duration-500 group-hover:scale-110" /><div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold leading-3 text-white"><i className="h-1 w-1 rounded-full bg-[#e50914]" />LIVE · 1M</span></div></button>;
}

function ContentRail({ title, channels: railChannels, onOpen, horizontal = false }: { title: string; channels: Channel[]; onOpen: (channel: Channel) => void; horizontal?: boolean }) {
  if (!railChannels.length) return null;
  return <section className="relative mt-8 hidden lg:block"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-medium uppercase text-[#b3b3b3]">Explore ARGUS</p><h2 className="mt-1 text-xl font-bold">{title}</h2></div><Link href={`/search?term=${encodeURIComponent(title)}`} className="text-xs font-bold text-[#b3b3b3] transition hover:text-white">See all</Link></div><div className={`scroll-fade-x grid grid-flow-col gap-3 overflow-x-auto pb-5 ${horizontal ? "auto-cols-[260px] xl:auto-cols-[310px]" : "auto-cols-[180px] xl:auto-cols-[205px]"}`}>{railChannels.map((channel, index) => <RailCard key={`${title}-${channel.username}`} channel={channel} index={index} onOpen={() => onOpen(channel)} horizontal={horizontal} />)}</div></section>;
}

function MovieFeatureGrid({ channels: featureChannels, onOpen }: { channels: Channel[]; onOpen: (channel: Channel) => void }) {
  const channelsToShow = featureChannels.filter(Boolean).slice(0, 4);
  if (!channelsToShow.length) return null;

  return (
    <section className="mt-8 hidden lg:block">
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase text-[#b3b3b3]">Featured picks</p>
        <h2 className="mt-1 text-xl font-bold">Movie Blocks</h2>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {channelsToShow.map((channel, index) => <MovieFeatureBlock key={`desktop-feature-${channel.username}-${index}`} channel={channel} index={index} onOpen={onOpen} />)}
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
  "Solo Leveling": [
    "Ughp4MfIu01Nvt602FFsOLRiJ8Yo01rx7AXzE1TrL8DKZQ",
    "JfkMiMlayLLeNLUNcWu6iMfwJ7Z4svBAkPa6ZcgsqWM",
    "01vDllqA01v332iTjKRDQBMyWUcZWJREgimQhuBJbpxP4",
  ],
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

function EpisodePlaybackOverlay({ title, episode, nextEpisode, previousEpisode, viewerUsername, onClose, onNext }: { title: string; episode: SeriesEpisode; nextEpisode?: SeriesEpisode; previousEpisode?: SeriesEpisode; viewerUsername?: string; onClose: () => void; onNext?: (episode: SeriesEpisode) => void }) {
  const [session, setSession] = useState<EpisodeChatToken | null>(null);
  const lastProgressSyncAt = useRef(0);
  const resumed = useRef(false);
  const episodePlayerRef = useRef<MuxPlayerRefAttributes | null>(null);
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

  useEffect(() => {
    const lockLandscapeOnFullscreen = () => {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: "landscape") => Promise<void>;
        unlock?: () => void;
      };

      if (document.fullscreenElement) {
        orientation.lock?.("landscape").catch(() => undefined);
        return;
      }

      orientation.unlock?.();
    };

    document.addEventListener("fullscreenchange", lockLandscapeOnFullscreen);
    document.addEventListener("webkitfullscreenchange", lockLandscapeOnFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", lockLandscapeOnFullscreen);
      document.removeEventListener("webkitfullscreenchange", lockLandscapeOnFullscreen);
      (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
    };
  }, []);

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

  const enableEpisodeAudio = useCallback((player = episodePlayerRef.current) => {
    if (!player) return;

    player.muted = false;
    player.volume = 1;
    (player as MuxPlayerRefAttributes & { defaultMuted?: boolean }).defaultMuted = false;
  }, []);

  const resumePlayback = (event: { currentTarget: EventTarget | null }) => {
    const player = getPlayerProgressTarget(event);
    if (!player || resumed.current || !episode.positionSeconds) return;
    enableEpisodeAudio(player as MuxPlayerRefAttributes);
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
    <div className="fixed inset-0 z-50 h-[100dvh] overflow-hidden bg-black text-white">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] grid h-11 w-11 place-items-center text-white transition hover:text-white/75 sm:left-5"
        aria-label="Back to episode details"
      >
        <BackArrowIcon className="h-5 w-5" />
      </button>
      <div className="flex h-full min-h-0 flex-col overscroll-none md:flex-row">
        <div className="relative min-h-0 flex-1 md:basis-auto">
          <MuxPlayer
            ref={episodePlayerRef}
            playbackId={episode.muxPlaybackId}
            metadata={{ video_title: `${title} ${episode.code} ${episode.name}` }}
            streamType="on-demand"
            autoPlay
            muted={false}
            volume={1}
            noMutedPref
            noVolumePref
            onEnded={(event) => {
              const player = getPlayerProgressTarget(event);
              if (player) syncProgress(player, "VIDEO_COMPLETED");
            }}
            onLoadedMetadata={(event) => {
              enableEpisodeAudio(event.currentTarget as MuxPlayerRefAttributes);
              resumePlayback(event);
            }}
            onCanPlay={(event) => {
              enableEpisodeAudio(event.currentTarget as MuxPlayerRefAttributes);
            }}
            onPause={(event) => {
              const player = getPlayerProgressTarget(event);
              if (player) syncProgress(player, "VIDEO_PAUSED");
            }}
            onPlay={(event) => {
              const player = getPlayerProgressTarget(event);
              enableEpisodeAudio(event.currentTarget as MuxPlayerRefAttributes);
              if (player) syncProgress(player, "VIDEO_STARTED");
            }}
            onSeeked={(event) => {
              const player = getPlayerProgressTarget(event);
              if (player) syncProgress(player, "VIDEO_SEEKED");
            }}
            onTimeUpdate={syncWhilePlaying}
            className="absolute inset-0 block h-full w-full bg-black [--media-object-fit:contain]"
            style={{
              width: "100%",
              height: "100%",
              ["--media-object-position" as string]: "center",
            }}
          />
        </div>
        {serverUrl && session ? (
          <LiveKitRoom token={session.token} serverUrl={serverUrl} connect video={false} audio={false} className="contents">
            <EpisodeHoverChat episode={episode} nextEpisode={nextEpisode} previousEpisode={previousEpisode} onNext={onNext} session={session} viewerUsername={viewerUsername} error={error} />
          </LiveKitRoom>
        ) : (
          <EpisodeHoverChatFallback episode={episode} nextEpisode={nextEpisode} previousEpisode={previousEpisode} onNext={onNext} error={error} />
        )}
      </div>
    </div>
  );
}

function EpisodeChatShell({ children }: { children: React.ReactNode }) {
  return (
    <aside
      className="flex h-[38dvh] max-h-[44dvh] min-h-[220px] shrink-0 flex-col overflow-hidden border-t border-white/10 bg-[#08080b] text-white md:h-full md:max-h-none md:min-h-0 md:w-[360px] md:border-l md:border-t-0"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </aside>
  );
}

function EpisodeHoverChat({ episode, nextEpisode, previousEpisode, onNext, session, viewerUsername, error }: { episode: SeriesEpisode; nextEpisode?: SeriesEpisode; previousEpisode?: SeriesEpisode; onNext?: (episode: SeriesEpisode) => void; session: EpisodeChatToken; viewerUsername?: string; error: string }) {
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
    <EpisodeChatShell>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide">Live chat</p>
          <p className="mt-1 text-[11px] text-white/60">{formatViewers(viewerCount)} watching</p>
        </div>
        <div className="flex items-center gap-1">
          {previousEpisode?.muxPlaybackId && (
            <button type="button" onClick={(event) => { event.stopPropagation(); onNext?.(previousEpisode); }} className="flex items-center gap-1 rounded px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 hover:bg-white/10 hover:text-white" aria-label={`Play ${previousEpisode.code}`}>
              <ForwardIcon className="h-3.5 w-3.5" direction="previous" /> Prev
            </button>
          )}
          {nextEpisode?.muxPlaybackId && (
            <button type="button" onClick={(event) => { event.stopPropagation(); onNext?.(nextEpisode); }} className="flex items-center gap-1 rounded px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 hover:bg-white/10 hover:text-white" aria-label={`Play ${nextEpisode.code}`}>
              <ForwardIcon className="h-3.5 w-3.5" /> Next
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs leading-5">
        {displayMessages.length ? displayMessages.map((message) => (
          <p key={message.id}>
            <strong className="mr-2 text-[#e5e5e5]">{message.from?.name ?? viewerUsername ?? "viewer"}:</strong>
            <span className="text-white/85">{message.message}</span>
          </p>
        )) : (
          <p className="text-white/55">Chat is live.</p>
        )}
        {error && <p className="text-white/55">{error}</p>}
      </div>
      <form className="border-t border-white/10 p-3" onSubmit={(event) => { event.preventDefault(); void sendChatMessage(); }}>
        {session.canChat ? (
          <div className="flex rounded-md border border-white/15 bg-black/35 focus-within:border-[#2f80ed]">
            <input type="text" enterKeyHint="send" value={chatMessage} maxLength={inputLimits.chatMessage} onChange={(event) => setChatMessage(event.target.value)} onKeyDown={sendOnEnter} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); }} placeholder="Chat" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-white/40 md:py-2 md:text-xs" />
            <button type="submit" disabled={!canSend} className="px-3 text-xs font-bold text-[#e50914] disabled:cursor-not-allowed disabled:text-white/25">Send</button>
          </div>
        ) : (
          <div className="rounded-md border border-white/15 bg-black/35 p-3 text-xs text-white/60">
            <p>Sign in to chat.</p>
            <SignInButton>
              <button type="button" className="mt-2 rounded bg-[#e50914] px-3 py-2 font-bold text-white">Sign in</button>
            </SignInButton>
          </div>
        )}
      </form>
    </EpisodeChatShell>
  );
}

function EpisodeHoverChatFallback({ episode, nextEpisode, previousEpisode, onNext, error }: { episode: SeriesEpisode; nextEpisode?: SeriesEpisode; previousEpisode?: SeriesEpisode; onNext?: (episode: SeriesEpisode) => void; error: string }) {
  return (
    <EpisodeChatShell>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide">Live chat</p>
          <p className="mt-1 text-[11px] text-white/60">{formatViewers(episode.viewers)} watching</p>
        </div>
        <div className="flex items-center gap-1">
          {previousEpisode?.muxPlaybackId && (
            <button type="button" onClick={(event) => { event.stopPropagation(); onNext?.(previousEpisode); }} className="flex items-center gap-1 rounded px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 hover:bg-white/10 hover:text-white" aria-label={`Play ${previousEpisode.code}`}>
              <ForwardIcon className="h-3.5 w-3.5" direction="previous" /> Prev
            </button>
          )}
          {nextEpisode?.muxPlaybackId && (
            <button type="button" onClick={(event) => { event.stopPropagation(); onNext?.(nextEpisode); }} className="flex items-center gap-1 rounded px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 hover:bg-white/10 hover:text-white" aria-label={`Play ${nextEpisode.code}`}>
              <ForwardIcon className="h-3.5 w-3.5" /> Next
            </button>
          )}
        </div>
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
  const currentEpisodeIndex = playingEpisode ? episodes.findIndex((episode) => episode.id === playingEpisode.id) : -1;
  const previousPlayableEpisode = currentEpisodeIndex > 0
    ? episodes.slice(0, currentEpisodeIndex).reverse().find((episode) => episode.muxPlaybackId)
    : undefined;
  const nextPlayableEpisode = currentEpisodeIndex >= 0
    ? episodes.slice(currentEpisodeIndex + 1).find((episode) => episode.muxPlaybackId)
    : undefined;
  const description = seriesDescriptions[title] ?? "A dark anime saga unfolds across a season of battles, secrets, and impossible choices.";
  const totalWatching = episodes.reduce((sum, episode) => sum + episode.viewers, 0);
  const openEpisode = (episode: SeriesEpisode) => {
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
            {episodes[0]?.muxPlaybackId ? <button type="button" onClick={() => openEpisode(episodes[0])} className="flex min-h-12 min-w-0 items-center gap-3 rounded bg-white px-5 text-sm font-bold text-black sm:px-6 sm:text-base"><PlayIcon />{episodes[0].positionSeconds ? "Resume S1 E1" : "Watch S1 E1"}</button> : <a href={episodes[0]?.trailerUrl} target="_blank" rel="noreferrer" className="flex min-h-12 min-w-0 items-center gap-3 rounded bg-white px-5 text-sm font-bold text-black sm:px-6 sm:text-base"><PlayIcon />Watch S1 E1 Trailer</a>}
            <button type="button" onClick={() => setListed(!listed)} className="grid h-12 w-12 place-items-center rounded-full border border-[#bcbcbc] text-3xl leading-none">{listed ? "✓" : "+"}</button>
            <span className="text-sm font-bold">My List</span>
            <button type="button" className="ml-0 grid h-12 w-12 place-items-center rounded-full border border-[#bcbcbc] lg:ml-5" aria-label="Notify"><BellIcon className="h-6 w-6" /></button>
            <span className="text-sm font-bold">Notify</span>
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

function EpisodeCard({ episode, onPlay }: { episode: SeriesEpisode; onPlay: () => void }) {
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

  return <a href={episode.trailerUrl} target="_blank" rel="noreferrer" className="group text-left">{cardBody}</a>;
}

function ContinueWatchingRail({ items, onOpen }: { items: ContinueWatchingItem[]; onOpen: (channel: Channel) => void }) {
  if (!items.length) return null;

  return (
    <section id="continue-watching" className="relative mt-8 hidden scroll-mt-24 lg:block">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase text-[#b3b3b3]">Resume</p>
          <h2 className="mt-1 text-xl font-bold">Continue watching</h2>
        </div>
      </div>
      <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-5 xl:auto-cols-[310px]">
        {items.map((item) => (
          <button key={item.episodeId} type="button" onClick={() => onOpen(item.channel)} className="group min-w-0 text-left transition duration-300 hover:z-10 hover:scale-105 focus:z-10 focus:scale-105 focus:outline-none">
            <span className="relative block aspect-video overflow-hidden rounded bg-[#181818]">
              <CatalogArtwork channel={item.channel} className="absolute inset-0 transition duration-500 group-hover:scale-110" />
              <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><i className="block h-full bg-[#e50914]" style={{ width: `${item.progressPercent}%` }} /></span>
              <span className="absolute bottom-3 left-3 rounded bg-black/75 px-2 py-1 text-[10px] font-bold uppercase text-white">{item.progressPercent}% watched</span>
            </span>
            <strong className="mt-3 block truncate text-sm">{item.channel.catalogTitle ?? item.channel.displayName}</strong>
            <span className="mt-1 block truncate text-xs font-semibold text-[#b3b3b3]">{item.episodeCode} {item.episodeTitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function BrowseApp({ persistedChannels = [], followedChannels = [], recommendedChannels = [], catalogChannels = [], continueWatching = [], demoFallback = true, initialQuery = "", clerkConfigured = false, viewerIdentity, viewerUsername, mobileBrowse = false, pagination }: BrowseAppProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [isPagePending, startPageTransition] = useTransition();
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
  const catalogSource = catalogChannels.length ? catalogChannels : channels;
  const animeChannels = catalogSource
    .filter((channel) => !query.trim() || channel.catalogTitle?.toLowerCase().includes(query.trim().toLowerCase()))
    .sort(prioritizePlayableCatalog);
  const searchResultChannels = Array.from(new Map([...animeChannels, ...displayChannels].map((channel) => [channel.username, channel])).values());
  const spotlightChannel = animeChannels[0];
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

  if (selected && !selected.hostIdentity) {
    return <SeriesDetailPage channel={selected} continueWatching={continueWatching} onBack={goBackFromSelected} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />;
  }

  if (selected) return <div className="min-h-screen bg-black"><ChannelPage channel={selected} initialFollowing={followedUsernames.has(selected.username)} canFollow={!selected.hostIdentity || selected.hostIdentity !== viewerIdentity} authenticated={Boolean(viewerIdentity)} /><MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} /></div>;

  return (
    <div className="app-shell min-h-screen text-[#f1f1f3]">
      {isPagePending && <TransitionLoader />}
      <div className="hidden lg:block"><SiteTopbar query={query} onQuery={setQuery} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} mode={mode} onMode={setMode} active={mobileBrowse ? "search" : "home"} /></div>
      <div>
        <div className="px-4 pb-24 pt-4 lg:px-7 lg:pb-6">
          <main className="min-w-0">
            {mobileBrowse ? <MobileChannelFeed query={query} onQuery={setQuery} data={searchResultChannels} onOpen={openChannel} searchable /> : <MobileStreamingHome channels={animeChannels} onOpen={openChannel} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} />}
            <Hero channel={spotlightChannel} onOpen={openChannel} />
            <ContinueWatchingRail items={continueWatching} onOpen={openChannel} />
            <div id="movies-series" className="scroll-mt-24"><ContentRail title="Movies & Series" channels={animeChannels.slice(0, 12)} onOpen={openChannel} horizontal /></div>
            <MovieFeatureGrid channels={[...animeChannels.slice(2), ...animeChannels.slice(0, 2)]} onOpen={openChannel} />
            <CategoriesRail channels={animeChannels} onSelect={setQuery} />
            <div id="live-anime"><ContentRail title="Live anime" channels={animeChannels} onOpen={openChannel} /></div>
            <ContentRail title="Because you watch anime" channels={[...animeChannels].reverse()} onOpen={openChannel} />
            {mode === "browse" && pagination && (pagination.page > 1 || pagination.hasNext) && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Channel pages">{pagination.page > 1 && <Link href={`${pagination.baseHref}${pagination.page - 1}`} onClick={(event) => { event.preventDefault(); startPageTransition(() => { router.push(`${pagination.baseHref}${pagination.page - 1}`); }); }} className="rounded bg-white/10 px-4 py-2 text-xs font-bold">Previous</Link>}<span className="text-xs text-[#94949f]">Page {pagination.page}</span>{pagination.hasNext && <Link href={`${pagination.baseHref}${pagination.page + 1}`} onClick={(event) => { event.preventDefault(); startPageTransition(() => { router.push(`${pagination.baseHref}${pagination.page + 1}`); }); }} className="rounded bg-[#e50914] px-4 py-2 text-xs font-bold">Next</Link>}</nav>}
          </main>
        </div>
      </div>
      {mobileBrowse && <MobileBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} active="search" />}
    </div>
  );
}
