"use client";

import { LiveKitRoom, useChat, useParticipants } from "@livekit/components-react";
import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { SignInButton } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createEpisodeChatToken } from "@/actions/episode-token";
import { recordVideoEvent, savePlaybackProgress } from "@/actions/catalog";
import { formatViewers } from "@/lib/channels";
import { episodeRoomName, type CatalogEpisode } from "@/lib/catalog-episodes";
import { normalizeLiveKitWsUrl } from "@/lib/livekit-url";
import { inputLimits } from "@/lib/validation";

type EpisodeChatToken = Awaited<ReturnType<typeof createEpisodeChatToken>>;

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

export function EpisodePlaybackOverlay({
  title,
  episode,
  nextEpisode,
  previousEpisode,
  viewerUsername,
  onClose,
  onNext,
}: {
  title: string;
  episode: CatalogEpisode;
  nextEpisode?: CatalogEpisode;
  previousEpisode?: CatalogEpisode;
  viewerUsername?: string;
  onClose: () => void;
  onNext?: (episode: CatalogEpisode) => void;
}) {
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
      <button type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] grid h-11 w-11 place-items-center text-white transition hover:text-white/75 sm:left-5" aria-label="Back to episode details">
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
            style={{ width: "100%", height: "100%", ["--media-object-position" as string]: "center" }}
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
    <aside className="flex h-[38dvh] max-h-[44dvh] min-h-[220px] shrink-0 flex-col overflow-hidden border-t border-white/10 bg-[#08080b] text-white md:h-full md:max-h-none md:min-h-0 md:w-[360px] md:border-l md:border-t-0" onClick={(event) => event.stopPropagation()}>
      {children}
    </aside>
  );
}

function EpisodeHoverChat({ episode, nextEpisode, previousEpisode, onNext, session, viewerUsername, error }: { episode: CatalogEpisode; nextEpisode?: CatalogEpisode; previousEpisode?: CatalogEpisode; onNext?: (episode: CatalogEpisode) => void; session: EpisodeChatToken; viewerUsername?: string; error: string }) {
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
      <EpisodeChatHeader nextEpisode={nextEpisode} previousEpisode={previousEpisode} onNext={onNext} viewerCount={viewerCount} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs leading-5">
        {displayMessages.length ? displayMessages.map((message) => (
          <p key={message.id}>
            <strong className="mr-2 text-[#e5e5e5]">{message.from?.name ?? viewerUsername ?? "viewer"}:</strong>
            <span className="text-white/85">{message.message}</span>
          </p>
        )) : <p className="text-white/55">Chat is live.</p>}
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

function EpisodeHoverChatFallback({ episode, nextEpisode, previousEpisode, onNext, error }: { episode: CatalogEpisode; nextEpisode?: CatalogEpisode; previousEpisode?: CatalogEpisode; onNext?: (episode: CatalogEpisode) => void; error: string }) {
  return (
    <EpisodeChatShell>
      <EpisodeChatHeader nextEpisode={nextEpisode} previousEpisode={previousEpisode} onNext={onNext} viewerCount={episode.viewers} />
      <div className="min-h-0 flex-1 px-4 py-4 text-xs leading-5 text-white/60">
        {error || "Joining live chat..."}
      </div>
    </EpisodeChatShell>
  );
}

function EpisodeChatHeader({ nextEpisode, previousEpisode, onNext, viewerCount }: { nextEpisode?: CatalogEpisode; previousEpisode?: CatalogEpisode; onNext?: (episode: CatalogEpisode) => void; viewerCount: number }) {
  return (
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
  );
}

function BackArrowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
}

function ForwardIcon({ className = "h-4 w-4", direction = "next" }: { className?: string; direction?: "next" | "previous" }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4"><g className={direction === "previous" ? "origin-center rotate-180" : ""}><path d="M5 6l8 6-8 6V6Z" fill="currentColor" stroke="none" /><path d="M16 6v12" strokeLinecap="round" /></g></svg>;
}
