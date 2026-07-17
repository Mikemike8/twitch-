"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { LiveVideoPlayer } from "@/components/live-video-player";
import { LiveChatPanel } from "@/components/live-chat-panel";
import { LiveKitSession } from "@/components/livekit-session";
import { FollowButton } from "@/components/follow-button";
import { FullscreenIcon, ShareIcon, VolumeIcon } from "@/components/icons";
import { formatViewers, type Channel } from "@/lib/channels";

export function ChannelPage({ channel, initialFollowing = false, canFollow = true, authenticated = false }: { channel: Channel; initialFollowing?: boolean; canFollow?: boolean; authenticated?: boolean }) {
  if (channel.hostIdentity && channel.live) {
    return <LiveKitSession hostIdentity={channel.hostIdentity}><ChannelContent channel={channel} initialFollowing={initialFollowing} canFollow={canFollow} authenticated={authenticated} /></LiveKitSession>;
  }

  return <ChannelContent channel={channel} initialFollowing={initialFollowing} canFollow={canFollow} authenticated={authenticated} />;
}

function ChannelContent({ channel, initialFollowing, canFollow, authenticated }: { channel: Channel; initialFollowing: boolean; canFollow: boolean; authenticated: boolean }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [playerControlsOpen, setPlayerControlsOpen] = useState(false);
  const playerShellRef = useRef<HTMLDivElement | null>(null);

  const enterFullscreen = () => {
    playerShellRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const share = () => {
    const url = `${window.location.origin}/${channel.username}`;
    if (navigator.share) {
      navigator.share({ title: channel.displayName, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  const fallback = (
    <>
      <div className="absolute inset-0 opacity-90" style={{ background: `radial-gradient(circle at 30% 20%, ${channel.colors[0]}, transparent 45%), linear-gradient(135deg, ${channel.colors[1]}, #08080a)` }} />
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl font-black">{channel.initials}</div><p className="text-lg font-bold">{channel.live ? `${channel.displayName} is live` : `${channel.displayName} is offline`}</p><p className="mt-2 text-sm text-white/60">{channel.hostIdentity ? "Waiting for a LiveKit broadcast" : "Demo stream preview"}</p></div></div>
    </>
  );

  return (
    <div className="flex min-h-[100svh] overflow-x-hidden bg-black pb-16 text-[#efeff1] md:pb-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <div ref={playerShellRef} className="relative aspect-video max-h-[62svh] min-h-[220px] w-full overflow-hidden bg-black md:max-h-none lg:min-h-0 lg:flex-1 lg:aspect-auto">
          {channel.hostIdentity && channel.live ? <LiveVideoPlayer fallback={fallback} /> : fallback}
          <button onClick={() => setPlayerControlsOpen(!playerControlsOpen)} className="absolute inset-0 z-[5]" aria-label={playerControlsOpen ? "Hide player controls" : "Show player controls"} />
          {playerControlsOpen && <PlayerControlsOverlay channel={channel} onFullscreen={enterFullscreen} onShare={share} />}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2 md:hidden">
            <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-black/70 text-xl text-white backdrop-blur" aria-label="Return home">←</Link>
            <button onClick={() => setDetailsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-black/70 text-xl text-white backdrop-blur" aria-label="Open stream details">›</button>
          </div>
          {!channel.hostIdentity && <div className="absolute bottom-0 inset-x-0 flex items-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-4">
            <span title="Demo audio controls are not available" className="opacity-50"><VolumeIcon /></span>
            <span className="text-xs font-bold text-red-400">DEMO</span>
            <span className="text-xs text-white/80">{formatViewers(channel.viewers)} viewers</span>
            <span title="Demo fullscreen controls are not available" className="ml-auto opacity-50"><FullscreenIcon className="h-5 w-5" /></span>
          </div>}
        </div>
      </section>
      {channel.hostIdentity && channel.live ? <LiveChatPanel hostIdentity={channel.hostIdentity} creatorHeader={<StreamCreatorHeader channel={channel} expanded={playerControlsOpen} onDetails={() => setDetailsOpen(true)} initialFollowing={initialFollowing} authenticated={authenticated} />} /> : <aside className={`${chatOpen ? "w-[380px] xl:w-[460px]" : "w-12"} hidden shrink-0 border-l border-[#29292f] bg-[#18181b] transition-[width] md:flex md:flex-col`}>
        {chatOpen && <StreamCreatorHeader channel={channel} expanded={playerControlsOpen} onDetails={() => setDetailsOpen(true)} initialFollowing={initialFollowing} authenticated={authenticated} />}
        <div className="flex h-12 items-center justify-between border-b border-[#29292f] px-3">
          {chatOpen && <span className="text-xs font-black uppercase">Stream chat</span>}
          <button onClick={() => setChatOpen(!chatOpen)} className="ml-auto rounded p-1 text-[#adadb8] hover:bg-[#2f2f35]">{chatOpen ? "→" : "←"}</button>
        </div>
        {chatOpen && <div className="grid flex-1 place-items-center p-4 text-center text-xs text-[#adadb8]">Chat is available only while the channel is live.</div>}
      </aside>}
      {detailsOpen && <StreamDetails channel={channel} canFollow={canFollow} initialFollowing={initialFollowing} authenticated={authenticated} onClose={() => setDetailsOpen(false)} />}
    </div>
  );
}

function StreamCreatorHeader({ channel, expanded, onDetails, initialFollowing, authenticated }: { channel: Channel; expanded: boolean; onDetails: () => void; initialFollowing: boolean; authenticated: boolean }) {
  if (expanded) return <div className="flex h-20 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b border-[#29292f] px-3"><Link href="/" className="grid h-9 w-9 shrink-0 place-items-center rounded text-xl text-[#adadb8] hover:bg-[#2f2f35] hover:text-white" aria-label="Return home">←</Link><Avatar channel={channel} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{channel.displayName}</strong><i className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[11px] not-italic text-[#d2d2d8]"><span>{formatViewers(channel.viewers)}</span><b className="h-2 w-2 shrink-0 rounded-full bg-red-600" /><span>LIVE</span></i></span><button onClick={onDetails} className="grid h-9 w-7 shrink-0 place-items-center rounded text-2xl text-[#adadb8] hover:bg-[#2f2f35] hover:text-white" aria-label="Open stream details">›</button><FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} compact /></div>;

  return <div className="flex h-20 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b border-[#29292f] px-3"><Avatar channel={channel} /><span className="min-w-0 flex-1" /><FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} compact /></div>;
}

function PlayerControlsOverlay({ channel, onFullscreen, onShare }: { channel: Channel; onFullscreen: () => void; onShare: () => void }) {
  return <div className="pointer-events-none absolute inset-0 z-[6] bg-black/60"><span className="absolute inset-0 grid place-items-center"><i className="flex gap-2"><b className="h-10 w-3 bg-white" /><b className="h-10 w-3 bg-white" /></i></span><div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/90 to-transparent pb-5 pl-4 pr-4 pt-14 text-white sm:gap-6 sm:pl-20 sm:pr-5"><span className="text-xs font-bold">{formatViewers(channel.viewers)} viewers</span><button type="button" onClick={(event) => { event.stopPropagation(); onShare(); }} className="pointer-events-auto ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/50 hover:bg-black/80" aria-label="Share channel"><ShareIcon className="h-5 w-5" /></button><button type="button" onClick={(event) => { event.stopPropagation(); onFullscreen(); }} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/50 hover:bg-black/80" aria-label="Enter fullscreen"><FullscreenIcon className="h-5 w-5" /></button></div></div>;
}

function StreamDetails({ channel, canFollow, initialFollowing, authenticated, onClose }: { channel: Channel; canFollow: boolean; initialFollowing: boolean; authenticated: boolean; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 md:items-center md:p-6"><button onClick={onClose} className="absolute inset-0" aria-label="Close stream details" /><section className="relative z-10 max-h-[calc(100dvh-env(safe-area-inset-top))] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#101014] p-5 shadow-2xl md:rounded-2xl md:p-8"><button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center text-3xl text-white" aria-label="Close stream details">×</button><div className="flex min-w-0 items-center gap-4 pr-10"><Avatar channel={channel} size="lg" /><span className="min-w-0"><strong className="block truncate text-xl font-black">{channel.displayName}</strong><i className="mt-1 block text-sm not-italic text-[#d2d2d8]">{formatViewers(channel.viewers)} watching live</i></span></div><h2 className="mt-7 break-words text-xl font-black leading-tight">{channel.title}</h2><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded bg-[#29292f] px-3 py-1.5 text-xs font-bold text-[#efeff1]">{channel.category}</span>{channel.tags.map((tag) => <span key={tag} className="rounded-full bg-[#29292f] px-3 py-1.5 text-xs font-bold text-[#d2d2d8]">{tag}</span>)}</div>{typeof channel.followerCount === "number" && <p className="mt-5 text-xs font-semibold text-[#adadb8]">{channel.followerCount} followers</p>}<p className="mt-4 text-sm leading-6 text-[#adadb8]">{channel.bio || "Welcome to the stream. Follow along for regular broadcasts, live chat, and community events."}</p><div className="mt-7 flex flex-wrap gap-3">{canFollow && <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}<Link href={`/${channel.username}`} className="rounded bg-[#29292f] px-4 py-2 text-sm font-bold hover:bg-[#35353d]">View profile</Link></div></section></div>;
}
