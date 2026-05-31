"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { LiveVideoPlayer } from "@/components/live-video-player";
import { LiveChatPanel } from "@/components/live-chat-panel";
import { LiveKitSession } from "@/components/livekit-session";
import { FollowButton } from "@/components/follow-button";
import { BellIcon, FullscreenIcon, MoreIcon, SendIcon, VolumeIcon } from "@/components/icons";
import { formatViewers, type Channel } from "@/lib/channels";

const initialMessages = [
  ["nightowl", "This run is looking clean"],
  ["emilycodes", "Just followed, glad I found this stream"],
  ["pixel_fan", "That was such a good play!"],
  ["orbit", "chat is moving fast tonight"],
];

export function ChannelPage({ channel, onBack, initialFollowing = false, canFollow = true, authenticated = false }: { channel: Channel; onBack?: () => void; initialFollowing?: boolean; canFollow?: boolean; authenticated?: boolean }) {
  if (channel.hostIdentity && channel.live) {
    return <LiveKitSession hostIdentity={channel.hostIdentity}><ChannelContent channel={channel} onBack={onBack} initialFollowing={initialFollowing} canFollow={canFollow} authenticated={authenticated} /></LiveKitSession>;
  }

  return <ChannelContent channel={channel} onBack={onBack} initialFollowing={initialFollowing} canFollow={canFollow} authenticated={authenticated} />;
}

function ChannelContent({ channel, onBack, initialFollowing, canFollow, authenticated }: { channel: Channel; onBack?: () => void; initialFollowing: boolean; canFollow: boolean; authenticated: boolean }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const send = () => {
    if (!message.trim()) return;
    setMessages([...messages, ["you", message.trim()]]);
    setMessage("");
  };

  const fallback = (
    <>
      <div className="absolute inset-0 opacity-90" style={{ background: `radial-gradient(circle at 30% 20%, ${channel.colors[0]}, transparent 45%), linear-gradient(135deg, ${channel.colors[1]}, #08080a)` }} />
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl font-black">{channel.initials}</div><p className="text-lg font-bold">{channel.live ? `${channel.displayName} is live` : `${channel.displayName} is offline`}</p><p className="mt-2 text-sm text-white/60">{channel.hostIdentity ? "Waiting for a LiveKit broadcast" : "Demo stream preview"}</p></div></div>
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <section className="min-w-0 flex-1">
        <div className="relative aspect-video max-h-[72vh] w-full overflow-hidden bg-black">
          {channel.hostIdentity && channel.live ? <LiveVideoPlayer fallback={fallback} /> : fallback}
          {(!channel.hostIdentity || !channel.live) && <div className="absolute bottom-0 inset-x-0 flex items-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-4">
            <VolumeIcon />
            <span className="text-xs font-bold text-red-400">LIVE</span>
            <span className="text-xs text-white/80">{formatViewers(channel.viewers)} viewers</span>
            <FullscreenIcon className="ml-auto h-5 w-5" />
          </div>}
        </div>
        <div className="p-4 sm:p-5">
          {onBack ? (
            <button onClick={onBack} className="mb-4 text-xs font-bold text-[#bf94ff] hover:underline">← Back to browse</button>
          ) : (
            <Link href="/" className="mb-4 block text-xs font-bold text-[#bf94ff] hover:underline">← Back to browse</Link>
          )}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Avatar channel={channel} size="lg" />
            <div className="min-w-0 flex-1"><h1 className="text-lg font-black">{channel.displayName}</h1><p className="mt-1 truncate text-sm font-semibold">{channel.title}</p><p className="mt-1 text-sm text-[#bf94ff]">{channel.category}</p></div>
            <div className="flex w-full items-start gap-2 sm:w-auto">
              {canFollow && <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}
              <button className="rounded bg-[#2f2f35] p-2"><BellIcon className="h-5 w-5" /></button>
              <button className="rounded p-2 hover:bg-[#2f2f35]"><MoreIcon className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="mt-6 rounded-md bg-[#18181b] p-5"><h2 className="font-black">About {channel.displayName}</h2>{typeof channel.followerCount === "number" && <p className="mt-1 text-xs font-semibold text-[#adadb8]">{channel.followerCount} followers</p>}<p className="mt-3 text-sm leading-6 text-[#adadb8]">{channel.bio || "Welcome to the stream. Follow along for regular broadcasts, live chat, and community events."}</p></div>
        </div>
      </section>
      {channel.hostIdentity && channel.live ? <LiveChatPanel hostIdentity={channel.hostIdentity} /> : <aside className={`${chatOpen ? "w-[340px]" : "w-12"} hidden shrink-0 border-l border-[#29292f] bg-[#18181b] transition-[width] md:flex md:flex-col`}>
        <div className="flex h-12 items-center justify-between border-b border-[#29292f] px-3">
          {chatOpen && <span className="text-xs font-black uppercase">Stream chat</span>}
          <button onClick={() => setChatOpen(!chatOpen)} className="ml-auto rounded p-1 text-[#adadb8] hover:bg-[#2f2f35]">{chatOpen ? "→" : "←"}</button>
        </div>
        {chatOpen && <>
          <div className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">{messages.map(([user, text], index) => <p key={`${user}-${index}`}><strong className="mr-2 text-[#bf94ff]">{user}:</strong><span className="text-[#dedee3]">{text}</span></p>)}</div>
          <div className="border-t border-[#29292f] p-3">
            <div className="flex rounded-md border border-[#3f3f46] bg-[#242429] focus-within:border-[#9147ff]"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Send a message" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><button onClick={send} className="px-3 text-[#bf94ff]"><SendIcon className="h-4 w-4" /></button></div>
            <p className="mt-2 text-[11px] text-[#adadb8]">Chat messages are local until WebSockets are connected.</p>
          </div>
        </>}
      </aside>}
    </div>
  );
}
