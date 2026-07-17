"use client";

import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { onCreateWatchClub } from "@/actions/watch-club";
import { BrandLogo } from "@/components/brand-logo";
import { SearchIcon } from "@/components/icons";
import type { EpgProgram, LiveTvChannel, WatchClub } from "@/lib/live-tv-service";
import { inputLimits } from "@/lib/validation";

export function LiveTelevisionApp({
  channels,
  clerkConfigured,
  schedule,
  viewerUsername,
  watchClubs,
}: {
  channels: LiveTvChannel[];
  clerkConfigured: boolean;
  schedule: Record<string, EpgProgram[]>;
  viewerUsername?: string;
  watchClubs: WatchClub[];
}) {
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id ?? "");
  const [now, setNow] = useState(() => Date.now());
  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  const programs = selectedChannel ? schedule[selectedChannel.id] ?? [] : [];
  const currentProgram = programs.find((program) => new Date(program.startsAt).getTime() <= now && new Date(program.endsAt).getTime() > now) ?? programs[0];

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!selectedChannel) {
    return <div className="grid min-h-screen place-items-center bg-black text-white">No live television channels configured.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-black/86 px-4 backdrop-blur sm:px-8">
        <Link href="/" aria-label="Argus home"><BrandLogo className="h-8 w-auto" /></Link>
        <nav className="hidden gap-6 text-sm font-bold text-white/70 md:flex">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/live" className="text-white">Live Television</Link>
          <Link href={viewerUsername ? `/${viewerUsername}` : "/profile"} className="hover:text-white">Profile</Link>
        </nav>
        <Link href="/search" className="ml-auto grid h-10 w-10 place-items-center text-white/75 hover:text-white" aria-label="Search"><SearchIcon className="h-6 w-6" /></Link>
      </header>

      <main className="grid gap-6 px-4 py-5 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:pb-5">
        <section className="min-w-0">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#27d7ff]">Live television</p>
            <h1 className="mt-2 text-3xl font-black leading-none sm:text-5xl">Live Television</h1>
            <h2 className="mt-2 text-xl font-black leading-tight text-white/85 sm:text-3xl">{selectedChannel.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">{selectedChannel.description}</p>
          </div>

          <LiveTvPlayer channel={selectedChannel} />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <button key={channel.id} type="button" onClick={() => setSelectedChannelId(channel.id)} className={`flex min-h-24 items-center gap-3 rounded border p-3 text-left ${selectedChannel.id === channel.id ? "border-[#27d7ff] bg-[#16262c]" : "border-white/10 bg-[#18181f] hover:bg-[#202028]"}`}>
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-black">
                  {channel.posterUrl ? <Image src={channel.posterUrl} alt="" fill sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs font-black text-white/45">TV</span>}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{channel.name}</strong>
                  <span className="mt-1 block truncate text-xs text-white/55">{channel.streamType.toUpperCase()}</span>
                </span>
              </button>
            ))}
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-white/45">Electronic Program Guide</p>
                <h2 className="mt-1 text-2xl font-black">Now and next</h2>
              </div>
            </div>
            <div className="overflow-hidden rounded border border-white/10 bg-[#15151b]">
              {programs.map((program) => <ProgramRow key={program.id} program={program} active={program.id === currentProgram?.id} />)}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <CreateWatchClubPanel channels={channels} currentProgram={currentProgram} clerkConfigured={clerkConfigured} />
          <section className="rounded border border-white/10 bg-[#15151b] p-4">
            <h2 className="text-lg font-black">Watch clubs</h2>
            <p className="mt-1 text-xs leading-5 text-white/55">Create a room around a live channel block and invite viewers to watch together.</p>
            <div className="mt-4 space-y-3">
              {watchClubs.length ? watchClubs.map((club) => <WatchClubCard key={club.id} club={club} channel={channels.find((item) => item.id === club.channelId)} />) : <p className="rounded border border-dashed border-white/15 p-4 text-sm text-white/55">No watch clubs yet.</p>}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function LiveTvPlayer({ channel }: { channel: LiveTvChannel }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError("");

    if (channel.streamType === "vod") {
      video.src = channel.streamUrl;
      return;
    }

    let player: { destroy: () => Promise<void>; load: (url: string) => Promise<void> } | null = null;
    let disposed = false;

    import("shaka-player").then((module) => {
      if (disposed) return;
      const ShakaPlayer = module.default.Player;
      if (!ShakaPlayer.isBrowserSupported()) {
        video.src = channel.streamUrl;
        return;
      }
      player = new ShakaPlayer(video);
      player.load(channel.streamUrl).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load live TV channel"));
    }).catch(() => {
      video.src = channel.streamUrl;
    });

    return () => {
      disposed = true;
      void player?.destroy();
    };
  }, [channel]);

  return (
    <div className="relative aspect-video overflow-hidden rounded border border-white/10 bg-black">
      <video ref={videoRef} controls playsInline poster={channel.posterUrl} className="h-full w-full bg-black object-contain" />
      {error && <div className="absolute inset-x-0 bottom-0 bg-black/80 p-3 text-xs text-red-200">{error}</div>}
    </div>
  );
}

function ProgramRow({ active, program }: { active: boolean; program: EpgProgram }) {
  return (
    <div className={`grid gap-2 border-b border-white/10 p-4 last:border-0 sm:grid-cols-[140px_1fr] ${active ? "bg-[#16303a]" : "bg-transparent"}`}>
      <span className="text-xs font-black uppercase text-white/55">{formatTime(program.startsAt)} - {formatTime(program.endsAt)}</span>
      <span>
        <strong className="block text-sm">{program.title}</strong>
        <span className="mt-1 block text-xs leading-5 text-white/55">{program.description}</span>
      </span>
    </div>
  );
}

function CreateWatchClubPanel({ channels, clerkConfigured, currentProgram }: { channels: LiveTvChannel[]; clerkConfigured: boolean; currentProgram?: EpgProgram }) {
  const [fallbackStart] = useState(() => new Date(Date.now() + 15 * 60 * 1000).toISOString());
  const defaultStart = useMemo(() => {
    const value = currentProgram?.startsAt ? new Date(currentProgram.startsAt) : new Date(fallbackStart);
    return value.toISOString().slice(0, 16);
  }, [currentProgram, fallbackStart]);

  return (
    <section className="rounded border border-white/10 bg-[#15151b] p-4">
      <h2 className="text-lg font-black">Create watch club</h2>
      <p className="mt-1 text-xs leading-5 text-white/55">Start a shared viewing room around a live TV channel or EPG block.</p>
      {clerkConfigured ? (
        <>
          <Show when="signed-in">
            <form action={onCreateWatchClub} className="mt-4 space-y-3">
              <input name="title" maxLength={inputLimits.watchClubTitle} defaultValue={currentProgram ? `${currentProgram.title} watch club` : ""} placeholder="Club title" className="w-full rounded border border-white/15 bg-black/45 px-3 py-3 text-sm outline-none focus:border-[#27d7ff]" />
              <textarea name="description" maxLength={inputLimits.watchClubDescription} placeholder="Description" rows={3} className="w-full rounded border border-white/15 bg-black/45 px-3 py-3 text-sm outline-none focus:border-[#27d7ff]" />
              <select name="channelId" defaultValue={currentProgram?.channelId ?? channels[0]?.id} className="w-full rounded border border-white/15 bg-black/45 px-3 py-3 text-sm outline-none focus:border-[#27d7ff]">
                {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
              </select>
              <input type="hidden" name="programId" value={currentProgram?.id ?? ""} />
              <input type="datetime-local" name="startsAt" defaultValue={defaultStart} className="w-full rounded border border-white/15 bg-black/45 px-3 py-3 text-sm outline-none focus:border-[#27d7ff]" />
              <button type="submit" className="w-full rounded bg-white px-4 py-3 text-sm font-black text-black hover:bg-[#e5e5e5]">Create club</button>
            </form>
          </Show>
          <Show when="signed-out">
            <SignInButton><button type="button" className="mt-4 w-full rounded bg-white px-4 py-3 text-sm font-black text-black hover:bg-[#e5e5e5]">Sign in to create</button></SignInButton>
          </Show>
        </>
      ) : (
        <p className="mt-4 rounded border border-white/10 bg-black/30 p-3 text-xs text-white/55">Add Clerk keys to create persistent watch clubs.</p>
      )}
    </section>
  );
}

function WatchClubCard({ channel, club }: { channel?: LiveTvChannel; club: WatchClub }) {
  return (
    <article className="rounded border border-white/10 bg-black/30 p-3">
      <p className="text-sm font-black">{club.title}</p>
      <p className="mt-1 text-xs text-white/50">{channel?.name ?? club.channelId} · {formatDateTime(club.startsAt)}</p>
      {club.description && <p className="mt-2 text-xs leading-5 text-white/60">{club.description}</p>}
      <p className="mt-2 text-[11px] font-bold text-[#27d7ff]">Hosted by @{club.hostUsername}</p>
    </article>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
