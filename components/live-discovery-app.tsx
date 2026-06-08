"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Avatar } from "@/components/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { FullscreenIcon, HeartIcon, SearchIcon, VolumeIcon } from "@/components/icons";
import { LiveKitSession } from "@/components/livekit-session";
import { LiveVideoPlayer } from "@/components/live-video-player";
import { demoStreamers, formatViewers, type Channel } from "@/lib/channels";

type DiscoveryFilter = "All" | "Following" | "Gaming" | "Music" | "Art" | "IRL" | "New Creators" | "Hidden Gems";

const filters: DiscoveryFilter[] = ["All", "Following", "Gaming", "Music", "Art", "IRL", "New Creators", "Hidden Gems"];

export function LiveDiscoveryApp({ liveChannels, followedChannels, clerkConfigured, viewerUsername }: { liveChannels: Channel[]; followedChannels: Channel[]; clerkConfigured: boolean; viewerUsername?: string }) {
  const discoveryChannels = useMemo(() => {
    const usernames = new Set(liveChannels.map((channel) => channel.username));
    return [...liveChannels, ...demoStreamers.filter((channel) => !usernames.has(channel.username))];
  }, [liveChannels]);
  const [selected, setSelected] = useState<Channel | null>(discoveryChannels[0] ?? null);
  const [filter, setFilter] = useState<DiscoveryFilter>("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followedUsernames = useMemo(() => new Set(followedChannels.map((channel) => channel.username)), [followedChannels]);
  const visibleChannels = useMemo(() => discoveryChannels.filter((channel, index) => matchesFilter(channel, index, filter, followedUsernames) && `${channel.displayName} ${channel.title} ${channel.category}`.toLowerCase().includes(query.trim().toLowerCase())), [discoveryChannels, filter, followedUsernames, query]);

  useEffect(() => () => {
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const pointerX = event.clientX;
    const viewportWidth = event.currentTarget.clientWidth;
    setChromeVisible(true);
    setGuideVisible((current) => pointerX < 220 || (current && pointerX < Math.min(600, viewportWidth * 0.4)));
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => {
      if (!searchOpen) {
        setChromeVisible(false);
        setGuideVisible(false);
        setNavVisible(false);
      }
    }, 1800);
  }

  if (!selected) return <div className="grid min-h-screen place-items-center bg-black text-sm text-white/70">No live streamers are available.</div>;

  return (
    <>
      {!desktop && <MobileLiveTv selected={selected} channels={visibleChannels} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} onSelect={setSelected} />}
      {desktop && <div className="relative min-h-screen overflow-hidden bg-black text-white" onMouseMove={handleMouseMove} onMouseLeave={() => { setChromeVisible(false); setGuideVisible(false); setNavVisible(false); }}>
        <StreamerBackdrop channel={selected} />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30 transition-opacity duration-300 ${chromeVisible ? "opacity-100" : "opacity-0"}`} />
        <button onMouseEnter={() => setNavVisible(true)} className={`fixed left-1/2 top-6 z-40 -translate-x-1/2 text-sm font-medium text-white/90 transition-opacity duration-300 ${chromeVisible && !guideVisible && !navVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>Menu</button>
        <header onMouseLeave={() => setNavVisible(false)} className={`fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-7 border-b border-white/10 bg-black/80 px-5 backdrop-blur-lg transition-opacity duration-300 sm:px-10 lg:px-16 ${navVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <Link href="/" aria-label="Argus home"><BrandLogo className="h-8 w-auto" /></Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-white/75 md:flex">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/" className="hover:text-white">Browse</Link>
            <Link href="/live" className="text-white">Live</Link>
            <Link href={viewerUsername ? `/${viewerUsername}` : "/sign-in"} className="hover:text-white">Profile</Link>
          </nav>
          <button onClick={() => { setSearchOpen(!searchOpen); setGuideVisible(true); }} className="ml-auto text-white/80 hover:text-white" aria-label="Search streamers"><SearchIcon className="h-6 w-6" /></button>
        </header>
        <div className={`absolute bottom-0 left-0 top-20 w-[min(38rem,48vw)] bg-gradient-to-r from-black via-black/90 to-transparent transition-opacity duration-300 ${guideVisible ? "opacity-100" : "pointer-events-none opacity-0"}`} />
        <main className={`relative z-10 min-h-screen max-w-[38rem] px-5 pb-24 pt-32 transition duration-300 sm:px-8 lg:px-10 ${guideVisible ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-10 opacity-0"}`}>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 overflow-x-auto pb-2 text-base text-white/70 sm:gap-8 sm:text-lg">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 border-b-2 pb-1 transition ${filter === item ? "border-white text-white" : "border-transparent hover:text-white"}`}>{item}</button>)}</nav>
          </div>
          {searchOpen && <label className="mt-4 flex h-11 max-w-lg items-center gap-3 rounded-full border border-white/15 bg-black/25 px-4 backdrop-blur-xl"><SearchIcon className="h-4 w-4 text-white/60" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search live streamers" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45" /></label>}
          <section className="mt-8 max-w-2xl">
            <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-2 sm:space-y-4">{visibleChannels.map((channel, index) => <StreamerGuideRow key={channel.username} channel={channel} selected={channel.username === selected.username} index={index} onSelect={() => setSelected(channel)} />)}</div>
          </section>
        </main>
        <footer className={`fixed inset-x-0 bottom-0 z-20 flex h-20 items-center gap-5 bg-gradient-to-t from-black/85 to-transparent px-5 transition-opacity duration-300 sm:px-10 lg:px-16 ${chromeVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}><span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-sm font-bold tracking-[0.16em]"><i className="h-2.5 w-2.5 rounded-full bg-red-600" />LIVE</span><button onClick={() => setMuted(!muted)} className="ml-auto text-white/90" aria-label={muted ? "Unmute preview" : "Mute preview"}><VolumeIcon className={`h-8 w-8 ${muted ? "opacity-40" : ""}`} /></button><button className="text-white/90" aria-label="Enter fullscreen"><FullscreenIcon className="h-8 w-8" /></button></footer>
      </div>}
    </>
  );
}

function MobileLiveTv({ selected, channels, clerkConfigured, viewerUsername, onSelect }: { selected: Channel; channels: Channel[]; clerkConfigured: boolean; viewerUsername?: string; onSelect: (channel: Channel) => void }) {
  const featured = channels.slice(0, 6);
  return <div className="min-h-[100svh] bg-black pb-[78px] text-white lg:hidden landscape:fixed landscape:inset-0 landscape:z-50 landscape:min-h-0 landscape:pb-0">
    <header className="sticky top-0 z-30 bg-gradient-to-b from-black via-black/92 to-black/0 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] landscape:hidden">
      <div className="flex items-center justify-center">
        <Link href="/" aria-label="Argus home"><BrandLogo className="h-9 w-auto" /></Link>
        <SearchIcon className="absolute right-5 h-6 w-6 text-white/80" />
      </div>
      <nav className="scroll-fade-x mt-6 flex items-center gap-5 overflow-x-auto text-sm font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", "Following", "Gaming", "Music", "IRL"].map((item, index) => <button key={item} type="button" className={`shrink-0 ${index === 0 ? "text-white" : "text-[#b3b3b3]"}`}>{item}</button>)}
      </nav>
    </header>
    <section className="relative mx-5 h-[58vh] min-h-[410px] overflow-hidden rounded border border-white/10 bg-[#181818] landscape:mx-0 landscape:h-full landscape:rounded-none landscape:border-0">
      <StreamerBackdrop channel={selected} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/15" />
      <div className="absolute inset-x-0 top-0 flex items-start gap-3 bg-gradient-to-b from-black/75 to-transparent px-4 py-4 landscape:px-6">
        <span className="rounded bg-[#e50914] px-2 py-1 text-[10px] font-bold uppercase">LIVE</span>
        <CastIcon className="ml-auto h-6 w-6" />
        <FullscreenIcon className="h-6 w-6" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs font-bold uppercase text-[#e50914]">Live now</p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none">{selected.displayName}</h1>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#d2d2d2]">{selected.title}</p>
        <p className="mt-3 text-xs text-[#b3b3b3]">{selected.category} · {formatViewers(selected.viewers)} watching</p>
      </div>
    </section>
    <div className="landscape:hidden">
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <Link href={`/${selected.username}`} className="rounded bg-white px-3 py-3 text-center text-sm font-bold text-black">Watch</Link>
        <button type="button" className="rounded bg-white/20 px-3 py-3 text-sm font-bold text-white">Notify Me</button>
      </div>
      <section className="mt-8">
        <h2 className="px-5 text-xl font-bold">Featured Live</h2>
        <div className="scroll-fade-x mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featured.map((channel, index) => <button type="button" key={`featured-${channel.username}`} onClick={() => onSelect(channel)} className="w-[58vw] max-w-72 shrink-0 text-left"><span className="relative block aspect-video overflow-hidden rounded border border-white/8 bg-[#181818]"><StreamerBackdrop channel={channel} /><span className="absolute left-2 top-2 rounded bg-[#e50914] px-2 py-1 text-[10px] font-bold uppercase">Live</span><i className="absolute inset-x-0 bottom-0 h-1 bg-[#e50914]" /></span><strong className="mt-2 block truncate text-sm">{channel.displayName}</strong><span className="mt-1 block truncate text-xs text-[#808080]">{formatViewers(channel.viewers || 40 + index * 9)} watching</span></button>)}
        </div>
      </section>
      <section className="mt-7">
        <h2 className="px-5 text-xl font-bold">All Live Rooms</h2>
        <div className="mt-2">{channels.map((channel, index) => <MobileLiveRow key={channel.username} channel={channel} selected={channel.username === selected.username} index={index} onSelect={() => onSelect(channel)} />)}</div>
      </section>
      <MobileLiveBottomNav viewerUsername={viewerUsername} clerkConfigured={clerkConfigured} />
    </div>
  </div>;
}

function MobileLiveRow({ channel, selected, index, onSelect }: { channel: Channel; selected: boolean; index: number; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`flex min-h-24 w-full items-center gap-4 border-b border-white/10 px-5 py-4 text-left ${selected ? "bg-[#181818]" : "bg-black"}`}><Avatar channel={channel} size="md" /><span className="min-w-0 flex-1"><strong className="block truncate text-base font-semibold">{channel.displayName}</strong><span className="mt-1 block truncate text-xs text-[#808080]">{channel.category} · {formatViewers(channel.viewers || 40 + index * 9)} watching</span></span>{selected && <span className="rounded bg-[#e50914] px-3 py-2 text-[10px] font-bold uppercase">Watching</span>}<span className="text-xl text-white/45">›</span></button>;
}

function MobileLiveBottomNav({ viewerUsername, clerkConfigured }: { viewerUsername?: string; clerkConfigured: boolean }) {
  const itemClass = "relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 pb-1 pt-2 text-[10px] font-bold uppercase";
  const profileItem = clerkConfigured ? (
    <>
      <Show when="signed-in">
        <Link href={viewerUsername ? `/${viewerUsername}` : "/"} className={itemClass}><ProfileIcon />Profile</Link>
      </Show>
      <Show when="signed-out">
        <SignInButton>
          <button type="button" className={itemClass}><ProfileIcon />Profile</button>
        </SignInButton>
      </Show>
    </>
  ) : (
    <Link href="/sign-in" className={itemClass}><ProfileIcon />Profile</Link>
  );
  return <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/92 px-2 pb-[env(safe-area-inset-bottom)] text-white/55 backdrop-blur-xl"><Link href="/" className={itemClass}><HomeIcon />Home</Link><Link href="/search" className={itemClass}><SearchIcon className="h-7 w-7" />Search</Link><span className={`${itemClass} text-white`}><i className="absolute top-0 h-0.5 w-8 rounded-full bg-[#e50914]" /><LiveTvIcon />Live</span>{profileItem}</nav>;
}

function CastIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M3 13a6 6 0 0 1 6 6M3 8a11 11 0 0 1 11 11" /><path d="M5 5h15a1 1 0 0 1 1 1v11" /></svg>;
}

function HomeIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}

function LiveTvIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="13" rx="1" /><path d="m10 9 5 2.5-5 2.5ZM8 21h8" /></svg>;
}

function ProfileIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function StreamerBackdrop({ channel }: { channel: Channel }) {
  const fallback = <BackdropFallback channel={channel} />;

  if (channel.hostIdentity && channel.live) {
    return (
      <div className="absolute inset-0">
        <LiveKitSession key={channel.hostIdentity} hostIdentity={channel.hostIdentity}>
          <LiveVideoPlayer fallback={fallback} preview />
        </LiveKitSession>
      </div>
    );
  }

  return fallback;
}

function BackdropFallback({ channel }: { channel: Channel }) {
  return (
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `${channel.thumbnailUrl ? `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18)), url("${channel.thumbnailUrl}")` : `radial-gradient(circle at 72% 46%, ${channel.colors[0]}, transparent 30%), radial-gradient(circle at 58% 72%, ${channel.colors[1]}, transparent 32%), linear-gradient(135deg, #020203, #111119)`}` }} />
  );
}

function StreamerGuideRow({ channel, selected, index, onSelect }: { channel: Channel; selected: boolean; index: number; onSelect: () => void }) {
  return <article className={`group flex min-h-20 items-center gap-3 rounded-xl px-1 py-1.5 transition sm:gap-4 ${selected ? "text-white" : "text-white/65 hover:text-white"}`}><button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"><span className="grid w-16 shrink-0 place-items-center sm:w-20"><Avatar channel={channel} size="md" /></span><i className="h-14 w-px shrink-0 bg-white/25" /><span className="min-w-0 flex-1">{selected && <span className="mb-1.5 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[9px] font-black tracking-[0.16em] backdrop-blur"><b className="h-2 w-2 rounded-full bg-red-600" />WATCHING</span>}<strong className="block truncate text-xl font-semibold sm:text-2xl">{channel.displayName}</strong><span className="mt-1 block truncate text-xs text-white/55 sm:text-sm">{formatViewers(channel.viewers || 40 + index * 9)} viewers &nbsp; {channel.category} &nbsp; {channel.title}</span></span></button><button onClick={onSelect} className={`mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${selected ? "bg-white/65 text-black" : "bg-white/10 text-white opacity-0 group-hover:opacity-100"}`} aria-label={`Play ${channel.displayName} inline`}><span className="ml-0.5 text-base">▶</span></button><HeartIcon className="hidden h-4 w-4 shrink-0 text-white/50 sm:block" /></article>;
}

function matchesFilter(channel: Channel, index: number, filter: DiscoveryFilter, followedUsernames: Set<string>) {
  if (filter === "Following") return followedUsernames.has(channel.username);
  if (filter === "Gaming") return !["Music", "Art", "Just Chatting"].includes(channel.category);
  if (filter === "Music") return channel.category === "Music";
  if (filter === "Art") return channel.category === "Art";
  if (filter === "IRL") return channel.category === "Just Chatting";
  if (filter === "New Creators") return index % 3 === 1;
  if (filter === "Hidden Gems") return (channel.viewers || 0) < 2_000;
  return true;
}
