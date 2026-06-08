"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { onBlock, onUnblock } from "@/actions/block";
import { onKickParticipant } from "@/actions/participant";

type LiveParticipant = {
  identity: string;
  name: string;
};

type BlockedUser = {
  id: string;
  username: string;
};

export function DashboardChatModeration({
  channelHref,
  initialParticipants,
  initialBlockedUsers,
  livekitConfigured,
}: {
  channelHref: string;
  initialParticipants: LiveParticipant[];
  initialBlockedUsers: BlockedUser[];
  livekitConfigured: boolean;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const kick = (participant: LiveParticipant) => {
    startTransition(() => {
      setMessage("");
      onKickParticipant(participant.identity)
        .then(() => {
          setParticipants((current) => current.filter((item) => item.identity !== participant.identity));
          setMessage(`${participant.name} was removed from the room.`);
        })
        .catch(() => setMessage("Unable to remove participant."));
    });
  };

  const block = (participant: LiveParticipant) => {
    startTransition(() => {
      setMessage("");
      onBlock(participant.identity)
        .then((result) => {
          setParticipants((current) => current.filter((item) => item.identity !== participant.identity));
          setBlockedUsers((current) => current.some((item) => item.id === result.blockedId)
            ? current
            : [...current, { id: result.blockedId, username: result.blocked.username }]);
          setMessage(`${participant.name} was blocked.`);
        })
        .catch(() => setMessage("Unable to block participant."));
    });
  };

  const unblock = (user: BlockedUser) => {
    startTransition(() => {
      setMessage("");
      onUnblock(user.id)
        .then(() => {
          setBlockedUsers((current) => current.filter((item) => item.id !== user.id));
          setMessage(`${user.username} can access the channel again.`);
        })
        .catch(() => setMessage("Unable to unblock this user."));
    });
  };

  return (
    <div className="min-w-0 space-y-5 p-3 sm:p-6 lg:p-10">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#bf94ff]">Creator tools</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Chat moderation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#adadb8]">Remove active participants, block abusive users, and restore access for blocked community members.</p>
      </div>

      <section className="rounded-lg border border-[#303038] bg-[#18181b] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-black">Live participants</h2>
            <p className="mt-1 text-xs text-[#adadb8]">{livekitConfigured ? "Current LiveKit room members are listed when the room is active." : "LiveKit credentials are not configured."}</p>
          </div>
          <Link href={channelHref} className="w-full rounded bg-[#303038] px-3 py-2 text-center text-xs font-bold hover:bg-[#3b3b44] sm:w-auto">Open channel</Link>
        </div>
        <div className="mt-5 divide-y divide-[#303038] overflow-hidden rounded-lg border border-[#303038]">
          {participants.length ? participants.map((participant) => (
            <div key={participant.identity} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 bg-[#111114] p-4 sm:flex sm:flex-wrap sm:items-center">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9147ff] text-xs font-black">{participant.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{participant.name}</p>
                <p className="truncate text-xs text-[#adadb8]">{participant.identity}</p>
              </div>
              <button disabled={isPending} onClick={() => kick(participant)} className="col-span-1 rounded bg-[#303038] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] disabled:opacity-50 sm:col-auto">Kick</button>
              <button disabled={isPending} onClick={() => block(participant)} className="col-span-1 rounded bg-red-600 px-3 py-2 text-xs font-bold hover:bg-red-500 disabled:opacity-50 sm:col-auto">Block</button>
            </div>
          )) : <p className="bg-[#111114] p-5 text-sm text-[#adadb8]">No active participants found.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-[#303038] bg-[#18181b] p-4 sm:p-5">
        <h2 className="font-black">Blocked users</h2>
        <p className="mt-1 text-xs text-[#adadb8]">Blocked users cannot watch or chat until restored.</p>
        <div className="mt-5 divide-y divide-[#303038] overflow-hidden rounded-lg border border-[#303038]">
          {blockedUsers.length ? blockedUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 bg-[#111114] p-4 sm:flex sm:flex-wrap sm:items-center">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#303038] text-xs font-black">{user.username.slice(0, 2).toUpperCase()}</div>
              <p className="min-w-0 flex-1 break-words text-sm font-bold">{user.username}</p>
              <button disabled={isPending} onClick={() => unblock(user)} className="col-span-2 rounded bg-[#303038] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] disabled:opacity-50 sm:col-auto">Unblock</button>
            </div>
          )) : <p className="bg-[#111114] p-5 text-sm text-[#adadb8]">No blocked users.</p>}
        </div>
      </section>

      {message && <p className="rounded border border-white/10 bg-white/5 p-3 text-xs text-[#d8d8df]">{message}</p>}
    </div>
  );
}
