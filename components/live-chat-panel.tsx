"use client";

import { useState } from "react";
import { useChat, useParticipants } from "@livekit/components-react";
import { SendIcon } from "@/components/icons";
import { onBlock } from "@/actions/block";
import { onKickParticipant } from "@/actions/participant";

import { useLiveKitSession, type ViewerToken } from "@/components/livekit-session";

export function LiveChatPanel({ hostIdentity }: { hostIdentity: string }) {
  const [open, setOpen] = useState(true);
  const { viewer, error, ready } = useLiveKitSession();

  return (
    <aside className={`${open ? "w-[340px]" : "w-12"} hidden shrink-0 border-l border-[#29292f] bg-[#18181b] transition-[width] md:flex md:flex-col`}>
      <div className="flex h-12 items-center justify-between border-b border-[#29292f] px-3">
        {open && <span className="text-xs font-black uppercase">Stream chat</span>}
        <button onClick={() => setOpen(!open)} className="ml-auto rounded p-1 text-[#adadb8] hover:bg-[#2f2f35]">{open ? "→" : "←"}</button>
      </div>
      {open && (!ready || !viewer ? <ChatNotice>{error || "Connecting to chat..."}</ChatNotice> : <RealtimeChat viewer={viewer} hostIdentity={hostIdentity} />)}
    </aside>
  );
}

function RealtimeChat({ viewer, hostIdentity }: { viewer: ViewerToken; hostIdentity: string }) {
  const { chatMessages, send, isSending } = useChat();
  const participants = useParticipants();
  const [value, setValue] = useState("");
  const [sendingDelayed, setSendingDelayed] = useState(false);
  const [variant, setVariant] = useState<"chat" | "community">("chat");
  const disabled = !viewer.canChat || isSending || sendingDelayed;

  const submit = () => {
    if (!value.trim() || disabled) return;
    const message = value.trim();
    setValue("");

    if (viewer.isChatDelayed) {
      setSendingDelayed(true);
      window.setTimeout(() => {
        send(message).finally(() => setSendingDelayed(false));
      }, 3000);
      return;
    }

    void send(message);
  };

  return <>
    <div className="flex items-center border-b border-[#29292f] px-3 py-2 text-[11px] text-[#adadb8]"><span>{participants.length} connected</span><button onClick={() => setVariant(variant === "chat" ? "community" : "chat")} className="ml-auto font-bold text-[#bf94ff]">{variant === "chat" ? "Community" : "Chat"}</button></div>
    {variant === "chat" ? <><div className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">
      {chatMessages.length === 0 && <p className="text-center text-xs text-[#adadb8]">Welcome to the chat room.</p>}
      {chatMessages.map((message) => { const name = message.from?.name ?? message.from?.identity ?? "guest"; return <p key={`${message.timestamp}-${message.from?.identity}`}><strong className="mr-2" style={{ color: stringToColor(name) }}>{name}:</strong><span className="text-[#dedee3]">{message.message}</span></p>; })}
    </div>
    <div className="border-t border-[#29292f] p-3">
      <div className="flex rounded-md border border-[#3f3f46] bg-[#242429] focus-within:border-[#9147ff]"><input value={value} disabled={disabled} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder={viewer.canChat ? "Send a message" : "Chat is restricted"} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60" /><button onClick={submit} disabled={disabled} className="px-3 text-[#bf94ff] disabled:opacity-40"><SendIcon className="h-4 w-4" /></button></div>
      {!viewer.isChatEnabled && <p className="mt-2 text-[11px] text-[#adadb8]">Chat is disabled.</p>}
      {viewer.isChatFollowersOnly && !viewer.isFollowing && <p className="mt-2 text-[11px] text-[#adadb8]">Followers only chat is enabled.</p>}
      {viewer.isChatDelayed && <p className="mt-2 text-[11px] text-[#adadb8]">Messages are delayed by 3 seconds.</p>}
    </div>
    </> : <Community participants={participants} viewer={viewer} hostIdentity={hostIdentity} />}
  </>;
}

function Community({ participants, viewer, hostIdentity }: { participants: ReturnType<typeof useParticipants>; viewer: ViewerToken; hostIdentity: string }) {
  const [filter, setFilter] = useState("");
  const visible = participants.filter((participant) => (participant.name ?? participant.identity).toLowerCase().includes(filter.toLowerCase()));
  const isHost = viewer.identity === hostIdentity;

  return <div className="flex-1 overflow-y-auto p-3"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search participants" className="mb-3 w-full rounded border border-[#3f3f46] bg-[#242429] px-3 py-2 text-xs outline-none" />{visible.map((participant) => { const name = participant.name ?? participant.identity; return <div key={participant.identity} className="flex items-center gap-2 border-b border-[#29292f] py-3 text-xs"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: stringToColor(name) }} /><span className="min-w-0 flex-1 truncate font-bold">{name}</span>{isHost && participant.identity !== viewer.identity && <button onClick={() => { onBlock(participant.identity).catch(() => onKickParticipant(participant.identity)); }} className="text-[#bf94ff] hover:underline">Block</button>}</div>; })}</div>;
}

function stringToColor(value: string) {
  let hash = 0;
  for (const character of value) hash = character.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 70% 65%)`;
}

function ChatNotice({ children }: { children: React.ReactNode }) {
  return <div className="grid flex-1 place-items-center p-4 text-center text-xs text-[#adadb8]">{children}</div>;
}
