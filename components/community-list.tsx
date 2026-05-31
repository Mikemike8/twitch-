"use client";

import { useState, useTransition } from "react";
import { onUnblock } from "@/actions/block";

type BlockedUser = {
  id: string;
  username: string;
};

export function CommunityList({ initialUsers }: { initialUsers: BlockedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  if (!users.length) {
    return <p className="mt-6 rounded-lg border border-[#303038] bg-[#18181b] p-5 text-sm text-[#adadb8]">No blocked users.</p>;
  }

  return <div className="mt-6 overflow-hidden rounded-lg border border-[#303038] bg-[#18181b]">{users.map((user) => <div key={user.id} className="flex items-center gap-4 border-b border-[#303038] p-4 last:border-0"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#9147ff] text-xs font-black">{user.username.slice(0, 2).toUpperCase()}</div><p className="flex-1 text-sm font-bold">{user.username}</p><button disabled={isPending} onClick={() => startTransition(() => { onUnblock(user.id).then(() => setUsers((current) => current.filter((item) => item.id !== user.id))); })} className="rounded bg-[#303038] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] disabled:opacity-50">Unblock</button></div>)}</div>;
}
