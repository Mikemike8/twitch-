"use client";

import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton, SignOutButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ChannelPage } from "@/components/channel-page";
import { BellIcon, MoreIcon, SearchIcon } from "@/components/icons";
import { channels, formatViewers, type Channel } from "@/lib/channels";
import { inputLimits } from "@/lib/validation";

type BrowseMode = "browse" | "following";

type BrowseAppProps = {
  persistedChannels?: Channel[];
  followedChannels?: Channel[];
  recommendedChannels?: Channel[];
  demoFallback?: boolean;
  initialQuery?: string;
  clerkConfigured?: boolean;
  viewerIdentity?: string;
  viewerUsername?: string;
  mobileBrowse?: boolean;
  pagination?: { page: number; hasNext: boolean; baseHref: string };
};

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

function Topbar({ query, onQuery, clerkConfigured, viewerUsername, mode, onMode }: { query: string; onQuery: (value: string) => void; clerkConfigured: boolean; viewerUsername?: string; mode: BrowseMode; onMode: (mode: BrowseMode) => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-white/5 bg-black/95 px-4 text-[#f1f1f3] backdrop-blur-xl lg:h-[76px] lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <BrandLogo className="h-10 w-10 rounded-xl" />
        <span className="hidden text-xl font-black tracking-tight sm:block">ARGUS</span>
      </Link>
      <nav className="ml-5 hidden items-center gap-6 text-sm font-black uppercase tracking-wide lg:flex">
        <Link href="/" className="text-white">Home</Link>
        <Link href="/live" className="text-[#d8d8df] transition hover:text-white">Live</Link>
        <a href="#live-anime" className="text-[#d8d8df] transition hover:text-white">Anime</a>
        <Link href="/search" className="text-[#d8d8df] transition hover:text-white">Browse</Link>
        <button type="button" onClick={() => onMode(mode === "following" ? "browse" : "following")} className={mode === "following" ? "text-[#bf94ff]" : "text-[#d8d8df] transition hover:text-white"}>Following</button>
      </nav>
      <form onSubmit={(event) => { event.preventDefault(); const term = query.trim(); router.push(term ? `/search?term=${encodeURIComponent(term)}` : "/search"); }} className="ml-auto hidden h-10 min-w-0 flex-1 overflow-hidden rounded-full border border-white/15 bg-white/[0.06] transition focus-within:border-[#8b3cff] focus-within:bg-white/10 lg:flex lg:max-w-xs xl:max-w-md">
        <input value={query} maxLength={inputLimits.searchTerm} onChange={(event) => onQuery(event.target.value)} placeholder="Search ARGUS" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#858590]" />
        <button type="submit" className="grid w-12 place-items-center text-[#a8a8b3]" aria-label="Search"><SearchIcon className="h-5 w-5" /></button>
      </form>
      <Link href="/search" className="ml-auto grid h-10 w-10 place-items-center rounded-full text-[#c8c8d0] hover:bg-white/5 lg:hidden" aria-label="Search"><SearchIcon className="h-6 w-6" /></Link>
      <button type="button" className="relative grid h-10 w-10 place-items-center rounded-full text-[#c8c8d0] hover:bg-white/5" aria-label="Notifications"><BellIcon className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#a855f7]" /></button>
      {clerkConfigured ? <><Show when="signed-out"><div className="flex items-center gap-2"><SignInButton><button className="rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44]">Log in</button></SignInButton><SignUpButton><button className="rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff]">Sign up</button></SignUpButton></div></Show><Show when="signed-in"><div className="flex items-center gap-2">{viewerUsername && <><Link href={`/${viewerUsername}`} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#d4d4dd] hover:bg-white/5 xl:block">Profile</Link><Link href={`/u/${viewerUsername}`} className="hidden rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff] xl:block">Creator Dashboard</Link></>}<SignOutButton><button className="hidden rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] sm:block">Log out</button></SignOutButton><UserButton /></div></Show></> : <div className="flex items-center gap-2"><Link href="/sign-in" className="rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44]">Log in</Link><Link href="/sign-up" className="hidden rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff] sm:block">Sign up</Link></div>}
    </header>
  );
}

function MobileBottomNav({ viewerUsername, active = "home" }: { viewerUsername?: string; active?: "home" | "search" | "live" | "profile" }) {
  const itemClass = "flex min-h-[74px] flex-col items-center justify-center gap-1.5 px-1 pb-1 pt-2 text-[10px] font-black uppercase tracking-wide";
  const color = (item: typeof active) => item === active ? "text-white" : "text-white/55";
  return <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/5 bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
    <Link href="/" className={`${itemClass} ${color("home")}`}><HomeIcon className="h-7 w-7" />Home</Link>
    <Link href="/search" className={`${itemClass} ${color("search")}`}><BrowseIcon className="h-7 w-7" />Search</Link>
    <Link href="/search" className={`${itemClass} text-white/55`}><ClipsIcon className="h-7 w-7" />Clips</Link>
    <Link href="/live" className={`${itemClass} ${color("live")}`}><LiveTvIcon className="h-7 w-7" />Live TV</Link>
    <Link href={viewerUsername ? `/${viewerUsername}` : "/sign-in"} className={`${itemClass} ${color("profile")}`}><ProfileIcon className="h-7 w-7" />Profile</Link>
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

function MobileStreamingHome({ channels: mobileChannels, onOpen, viewerUsername }: { channels: Channel[]; onOpen: (channel: Channel) => void; viewerUsername?: string }) {
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
      <MobileBottomNav viewerUsername={viewerUsername} />
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

function seriesEpisodes(channel: Channel) {
  const title = channel.catalogTitle ?? channel.displayName;
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
    code: `S1 E${index + 1}`,
    name,
    date: `Mar ${1 + index * 7}, 2026`,
    duration: `${42 + (index % 3)}M`,
    description: index === 0
      ? `${title} begins as the hero steps into a first battle that changes the entire season.`
      : `The conflict expands as ${title} pushes its heroes into a darker and more dangerous mission.`,
    thumbnailUrl: thumbnails[index % thumbnails.length],
    viewers: Math.max(120, Math.round(channel.viewers * (1 - index * 0.085))),
    trailerUrl: trailer.embedId
      ? `https://www.youtube.com/watch?v=${trailer.embedId}`
      : trailer.url,
  }));
}

function SeriesDetailPage({ channel, onBack, viewerUsername }: { channel: Channel; onBack: () => void; viewerUsername?: string }) {
  const [listed, setListed] = useState(false);
  const [muted, setMuted] = useState(true);
  const title = channel.catalogTitle ?? channel.displayName;
  const episodes = seriesEpisodes(channel);
  const description = seriesDescriptions[title] ?? "A dark anime saga unfolds across a season of battles, secrets, and impossible choices.";
  const totalWatching = episodes.reduce((sum, episode) => sum + episode.viewers, 0);

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
            <a href={episodes[0]?.trailerUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-md bg-[#2554e8] px-6 text-sm font-black uppercase tracking-wide text-white"><PlayIcon />Watch S1 E1 Trailer</a>
            <button type="button" onClick={() => setListed(!listed)} className="grid h-14 w-14 place-items-center rounded-full border border-white/40 text-4xl leading-none">{listed ? "✓" : "+"}</button>
            <span className="text-sm font-black uppercase tracking-wide">My List</span>
            <button type="button" className="ml-0 grid h-14 w-14 place-items-center rounded-full border border-white/40 lg:ml-5" aria-label="Notify"><BellIcon className="h-6 w-6" /></button>
            <span className="text-sm font-black uppercase tracking-wide">Notify</span>
          </div>
        </div>
        <button type="button" onClick={() => setMuted(!muted)} className="absolute bottom-16 right-5 z-10 grid h-14 w-14 place-items-center rounded-full border border-white/40 text-xl font-black sm:right-8 lg:right-14" aria-label={muted ? "Unmute preview" : "Mute preview"}>{muted ? "x" : "!"}</button>
      </section>

      <section id="episodes" className="px-5 pb-12 sm:px-8 lg:px-14">
          <div className="mb-5 flex items-end gap-8">
            <h2 className="text-3xl font-black">Full Episodes</h2>
            <span className="pb-1 text-base text-white/75">Season 1</span>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {episodes.map((episode) => (
              <a key={episode.code} href={episode.trailerUrl} target="_blank" rel="noreferrer" className="group text-left">
                <span className="relative block aspect-video overflow-hidden rounded-md bg-white/5">
                  <Image src={episode.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Live</span>
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white">{formatViewers(episode.viewers)} watching</span>
                  <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"><PlayIcon className="h-10 w-10" /></span>
                </span>
                <h3 className="mt-4 text-lg font-black"><span>{episode.code}</span> <span className="font-medium">{episode.name}</span></h3>
                <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-[#a1a1aa]">{episode.description}</p>
                <p className="mt-2 text-sm font-bold text-[#8f8f99]">{episode.duration}  {episode.date}  ·  {formatViewers(episode.viewers)} live</p>
              </a>
            ))}
          </div>
      </section>

      <MobileBottomNav viewerUsername={viewerUsername} />
    </div>
  );
}

export function BrowseApp({ persistedChannels = [], followedChannels = [], recommendedChannels = [], demoFallback = true, initialQuery = "", clerkConfigured = false, viewerIdentity, viewerUsername, mobileBrowse = false, pagination }: BrowseAppProps) {
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
  const animeChannels = channels
    .filter((channel) => !query.trim() || channel.catalogTitle?.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => right.viewers - left.viewers);
  const spotlightChannel = animeChannels[0];

  if (selected && !selected.hostIdentity) {
    return <SeriesDetailPage channel={selected} onBack={() => setSelected(null)} viewerUsername={viewerUsername} />;
  }

  if (selected) return <div className="min-h-screen bg-black"><ChannelPage channel={selected} initialFollowing={followedUsernames.has(selected.username)} canFollow={!selected.hostIdentity || selected.hostIdentity !== viewerIdentity} authenticated={Boolean(viewerIdentity)} /><MobileBottomNav viewerUsername={viewerUsername} /></div>;

  return (
    <div className="min-h-screen bg-[#07070a] text-[#f1f1f3]">
      <div className="hidden lg:block"><Topbar query={query} onQuery={setQuery} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} mode={mode} onMode={setMode} /></div>
      <div>
        <div className="px-4 pb-24 pt-4 lg:px-7 lg:pb-6">
          <main className="min-w-0">
            {mobileBrowse ? <MobileChannelFeed query={query} onQuery={setQuery} data={trendingChannels.length ? trendingChannels : displayChannels} onOpen={setSelected} searchable /> : <MobileStreamingHome channels={animeChannels} onOpen={setSelected} viewerUsername={viewerUsername} />}
            <Hero channel={spotlightChannel} onOpen={setSelected} />
            <ContentRail title="Recommended for you" channels={recommendedDisplayChannels.slice(0, 12)} onOpen={setSelected} horizontal />
            <div id="live-streamers"><ContentRail title={mode === "following" ? "Your followed channels" : "Live streamers"} channels={(mode === "following" ? followedChannels : liveStreamerChannels).slice(0, 12)} onOpen={setSelected} horizontal /></div>
            <div id="live-anime"><ContentRail title="Live anime" channels={animeChannels} onOpen={setSelected} /></div>
            <ContentRail title="Because you watch anime" channels={[...animeChannels].reverse()} onOpen={setSelected} />
            {mode === "browse" && pagination && (pagination.page > 1 || pagination.hasNext) && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Channel pages">{pagination.page > 1 && <Link href={`${pagination.baseHref}${pagination.page - 1}`} className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold">Previous</Link>}<span className="text-xs text-[#94949f]">Page {pagination.page}</span>{pagination.hasNext && <Link href={`${pagination.baseHref}${pagination.page + 1}`} className="rounded-lg bg-[#8425e6] px-4 py-2 text-xs font-bold">Next</Link>}</nav>}
          </main>
        </div>
      </div>
      {mobileBrowse && <MobileBottomNav viewerUsername={viewerUsername} active="search" />}
    </div>
  );
}
