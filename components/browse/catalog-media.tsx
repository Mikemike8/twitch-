"use client";

import Image from "next/image";
import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "@/lib/channels";

export const heroTrailerTitle = "Dandadan";

const heroTrailerPlaybackId = "xEjUkmnCYchvtR5CnnWc6QxGwko027FsIfrE7dBRLeKw";

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

export function CatalogArtwork({ channel, className = "" }: { channel: Channel; className?: string }) {
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

export function HeroTrailerBackground({ channel, className = "", showMuteControl = false }: { channel?: Channel; className?: string; showMuteControl?: boolean }) {
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
      {poster && <Image src={poster} alt="" fill priority sizes="100vw" className="absolute inset-0 z-0 h-full w-full object-cover object-center" />}
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
          style={{ width: "100%", height: "100%", minWidth: "100%", minHeight: "100%", aspectRatio: "auto", ["--media-object-fit" as string]: "cover", ["--media-object-position" as string]: "center" }}
        />
      )}
      {showMuteControl && (
        <button type="button" onClick={(event) => { event.stopPropagation(); toggleTrailerAudio(); }} className="absolute bottom-5 right-5 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur transition hover:border-white/70 hover:bg-white/20" aria-label={muted ? "Unmute trailer" : "Mute trailer"}>
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      )}
    </div>
  );
}

function MutedIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m20 9-6 6M14 9l6 6" /></svg>;
}

function SoundIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
}
