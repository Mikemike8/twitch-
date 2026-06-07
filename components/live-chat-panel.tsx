"use client";

import { useState, type KeyboardEvent } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useChat, useParticipants } from "@livekit/components-react";
import { SendIcon } from "@/components/icons";
import { onBlock } from "@/actions/block";
import { onSendChatMessage } from "@/actions/chat";
import { onKickParticipant } from "@/actions/participant";

import { useLiveKitSession, type ViewerToken } from "@/components/livekit-session";
import { inputLimits } from "@/lib/validation";

export function LiveChatPanel({ hostIdentity, creatorHeader }: { hostIdentity: string; creatorHeader?: React.ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { viewer, error, ready } = useLiveKitSession();
  const content = !ready || !viewer ? <ChatNotice>{error || "Connecting to chat..."}</ChatNotice> : <RealtimeChat viewer={viewer} hostIdentity={hostIdentity} />;

  return (
    <>
      <aside className={`${desktopOpen ? "w-[380px] xl:w-[460px] 2xl:w-[540px]" : "w-12"} hidden shrink-0 border-l border-[#29292f] bg-[#18181b] transition-[width] md:flex md:flex-col`}>
        {desktopOpen && creatorHeader}
        <ChatHeader open={desktopOpen} onToggle={() => setDesktopOpen(!desktopOpen)} />
        {desktopOpen && content}
      </aside>
      <button onClick={() => setMobileOpen(true)} className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20 rounded-full bg-[#9147ff] px-4 py-3 text-sm font-black shadow-lg md:hidden" aria-label="Open stream chat">Chat</button>
      {mobileOpen && <>
        <button onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-label="Close stream chat" />
        <aside className="fixed inset-x-0 bottom-0 z-50 flex h-[min(72vh,620px)] flex-col rounded-t-xl border-t border-[#3f3f46] bg-[#18181b] pb-[env(safe-area-inset-bottom)] md:hidden">
          {creatorHeader}
          <ChatHeader open onToggle={() => setMobileOpen(false)} />
          {content}
        </aside>
      </>}
    </>
  );
}

function ChatHeader({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#29292f] px-3"><span className="text-xs font-black uppercase">Stream chat</span><button onClick={onToggle} className="grid h-10 w-10 place-items-center rounded text-[#adadb8] hover:bg-[#2f2f35]" aria-label={open ? "Close stream chat" : "Open stream chat"}>{open ? "×" : "←"}</button></div>;
}

function RealtimeChat({ viewer, hostIdentity }: { viewer: ViewerToken; hostIdentity: string }) {
  const { chatMessages } = useChat();
  const participants = useParticipants();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [variant, setVariant] = useState<"chat" | "community">("chat");
  const disabled = !viewer.canChat || sending;

  const submit = () => {
    if (!value.trim() || disabled) return;
    const message = value.trim();
    setValue("");
    setError("");
    setSending(true);
    onSendChatMessage(hostIdentity, message)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to send chat message"))
      .finally(() => setSending(false));
  };
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };
  const restriction = getChatRestriction(viewer);

  return <>
    <div className="flex items-center border-b border-[#29292f] px-3 py-2 text-[11px] text-[#adadb8]"><span>{participants.length} connected</span><button onClick={() => setVariant(variant === "chat" ? "community" : "chat")} className="ml-auto font-bold text-[#bf94ff]">{variant === "chat" ? "Community" : "Chat"}</button></div>
    {variant === "chat" ? <><div className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">
      {chatMessages.length === 0 && <p className="text-center text-xs text-[#adadb8]">Welcome to the chat room.</p>}
      {chatMessages.map((message) => { const serverMessage = message as typeof message & { senderName?: string }; const name = message.from?.name ?? message.from?.identity ?? serverMessage.senderName ?? "guest"; return <p key={`${message.timestamp}-${message.from?.identity ?? serverMessage.senderName ?? "server"}`}><strong className="mr-2" style={{ color: stringToColor(name) }}>{name}:</strong><span className="text-[#dedee3]">{message.message}</span></p>; })}
    </div>
    <form className="border-t border-[#29292f] p-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      {viewer.canChat ? (
        <div className="flex rounded-md border border-[#3f3f46] bg-[#242429] focus-within:border-[#9147ff]">
          <input type="text" enterKeyHint="send" value={value} maxLength={inputLimits.chatMessage} disabled={sending} onChange={(event) => setValue(event.target.value)} onKeyDown={submitOnEnter} placeholder="Send a message" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-[#858590] disabled:opacity-60 md:py-2 md:text-sm" />
          <button type="submit" disabled={disabled || !value.trim()} className="px-3 text-[#bf94ff] disabled:opacity-40" aria-label="Send chat message"><SendIcon className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="rounded-md border border-[#3f3f46] bg-[#242429] p-3 text-xs text-[#adadb8]">
          <p>{restriction}</p>
          {!viewer.isAuthenticated && (
            <SignInButton>
              <button type="button" className="mt-2 inline-flex rounded bg-[#9147ff] px-3 py-2 font-black text-white">Sign in to chat</button>
            </SignInButton>
          )}
        </div>
      )}
      {viewer.isChatDelayed && viewer.canChat && <p className="mt-2 text-[11px] text-[#adadb8]">Slow mode is enabled. You can send one message every 15 seconds.</p>}
      {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
    </form>
    </> : <Community participants={participants} viewer={viewer} hostIdentity={hostIdentity} />}
  </>;
}

function getChatRestriction(viewer: ViewerToken) {
  if (!viewer.isChatEnabled) return "Chat is disabled for this stream.";
  if (!viewer.isAuthenticated) return "Sign in to send chat messages.";
  if (viewer.isChatFollowersOnly && !viewer.isFollowing) return "Followers only chat is enabled.";
  return "Chat is restricted for this stream.";
}

function Community({ participants, viewer, hostIdentity }: { participants: ReturnType<typeof useParticipants>; viewer: ViewerToken; hostIdentity: string }) {
  const [filter, setFilter] = useState("");
  const visible = participants.filter((participant) => (participant.name ?? participant.identity).toLowerCase().includes(filter.toLowerCase()));
  const isHost = viewer.identity === hostIdentity;

  return <div className="flex-1 overflow-y-auto p-3"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search participants" className="mb-3 w-full rounded border border-[#3f3f46] bg-[#242429] px-3 py-2 text-xs outline-none" />{visible.map((participant) => { const name = participant.name ?? participant.identity; return <div key={participant.identity} className="flex items-center gap-2 border-b border-[#29292f] py-3 text-xs"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: stringToColor(name) }} /><span className="min-w-0 flex-1 truncate font-bold">{name}</span>{isHost && participant.identity !== viewer.participantIdentity && participant.identity !== hostIdentity && <button onClick={() => { onBlock(participant.identity).catch(() => onKickParticipant(participant.identity)); }} className="text-[#bf94ff] hover:underline">Block</button>}</div>; })}</div>;
}

function stringToColor(value: string) {
  let hash = 0;
  for (const character of value) hash = character.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 70% 65%)`;
}

function ChatNotice({ children }: { children: React.ReactNode }) {
  return <div className="grid flex-1 place-items-center p-4 text-center text-xs text-[#adadb8]">{children}</div>;
}
