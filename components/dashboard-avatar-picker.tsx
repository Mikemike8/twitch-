"use client";

import { useState, useTransition } from "react";
import { onUpdateAvatar } from "@/actions/user";
import { avatarIdFromImageUrl, creatorAvatars, type CreatorAvatar } from "@/lib/avatar-library";

export function DashboardAvatarPicker({ currentImageUrl, username }: { currentImageUrl: string; username: string }) {
  const [selectedId, setSelectedId] = useState(avatarIdFromImageUrl(currentImageUrl) ?? "red");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const selected = creatorAvatars.find((avatar) => avatar.id === selectedId) ?? creatorAvatars[0];
  const main = creatorAvatars.filter((avatar) => avatar.group === "Main / Popular");
  const others = creatorAvatars.filter((avatar) => avatar.group === "All Others");

  const save = () => {
    setStatus("");
    startTransition(() => {
      onUpdateAvatar(selectedId)
        .then(() => setStatus("Avatar updated"))
        .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Unable to update avatar"));
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#141414] px-3 py-4 text-white sm:px-6 sm:py-8 lg:px-10">
      <section className="border-b border-white/10 pb-6">
        <p className="text-xs font-black uppercase text-[#e50914]">Creator profile</p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-none sm:text-5xl">Avatar</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b3b3b3]">Choose the avatar viewers see in your profile, live cards, and creator menu.</p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded border border-white/10 bg-[#181818] p-5">
          <p className="text-xs font-black uppercase text-[#808080]">Preview</p>
          <div className="mt-5 flex items-center gap-4">
            <AvatarBubble avatar={selected} size="small" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">@{username}</p>
              <p className="mt-1 text-xs text-[#808080]">{selected.label}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center">
            <ProfileTile avatar={selected} selected />
            <button type="button" onClick={save} disabled={isPending} className="mt-6 w-full rounded bg-white px-4 py-3 text-sm font-black text-black hover:bg-[#e5e5e5] disabled:opacity-50">Save avatar</button>
            {status && <p className="mt-4 w-full rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d2d2d2]">{status}</p>}
          </div>
        </aside>

        <section className="min-w-0 space-y-9">
          <AvatarGroup title="Main / Popular" avatars={main} selectedId={selectedId} onSelect={setSelectedId} />
          <AvatarGroup title="All Others" avatars={others} selectedId={selectedId} onSelect={setSelectedId} />
        </section>
      </div>
    </div>
  );
}

function AvatarGroup({ title, avatars, selectedId, onSelect }: { title: string; avatars: CreatorAvatar[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section>
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(144px,1fr))]">
        {avatars.map((avatar) => (
          <button key={avatar.id} type="button" onClick={() => onSelect(avatar.id)} className="group flex flex-col items-center gap-3 focus:outline-none" aria-label={`Choose ${avatar.label}`}>
            <span className={`rounded p-1 transition ${selectedId === avatar.id ? "bg-white" : "bg-transparent group-hover:bg-white/55"}`}>
              <AvatarBubble avatar={avatar} size="large" />
            </span>
            <span className={`text-xs font-bold ${selectedId === avatar.id ? "text-white" : "text-[#808080] group-hover:text-white"}`}>{avatar.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfileTile({ avatar, selected = false }: { avatar: CreatorAvatar; selected?: boolean }) {
  return (
    <div className="flex h-[189px] w-36 flex-col items-center gap-4">
      <span className={`rounded p-1 ${selected ? "bg-white" : "bg-transparent"}`}>
        <AvatarBubble avatar={avatar} size="large" />
      </span>
      <span className="text-xl font-bold text-[#e5e5e5]">You</span>
    </div>
  );
}

function AvatarBubble({ avatar, size }: { avatar: CreatorAvatar; size: "small" | "large" }) {
  const dimensions = size === "large" ? "h-36 w-36 text-4xl" : "h-8 w-8 text-xs";

  return (
    <span className={`${dimensions} grid place-items-center rounded bg-[#333] font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]`} style={{ background: `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})` }}>
      {avatar.face}
    </span>
  );
}
