"use client";

import { useState, useTransition } from "react";
import { onUpdateStream } from "@/actions/stream";
import { onUpdateBio } from "@/actions/user";
import { ThumbnailUpload } from "@/components/thumbnail-upload";

export function DashboardSettings({ username, bio: initialBio, persistChanges, stream, uploadConfigured }: { username: string; bio: string; persistChanges: boolean; stream: { name: string; thumbnailUrl: string | null; isChatEnabled: boolean; isChatDelayed: boolean; isChatFollowersOnly: boolean }; uploadConfigured: boolean }) {
  const [settings, setSettings] = useState({
    isChatEnabled: stream.isChatEnabled,
    isChatDelayed: stream.isChatDelayed,
    isChatFollowersOnly: stream.isChatFollowersOnly,
  });
  const [title, setTitle] = useState(stream.name);
  const [bio, setBio] = useState(initialBio);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggle = (key: keyof typeof settings) => {
    const enabled = !settings[key];
    setSettings((current) => ({ ...current, [key]: enabled }));

    if (persistChanges) {
      startTransition(() => {
        onUpdateStream({ [key]: enabled })
          .then(() => setStatus("Chat settings updated"))
          .catch(() => setStatus("Unable to update chat settings"));
      });
    }
  };

  const saveTitle = () => {
    if (!persistChanges) {
      setStatus("Demo title updated locally");
      return;
    }

    startTransition(() => {
      onUpdateStream({ name: title })
        .then(() => setStatus("Stream title updated"))
        .catch(() => setStatus("Unable to update stream title"));
    });
  };

  const saveBio = () => {
    if (!persistChanges) {
      setStatus("Demo bio updated locally");
      return;
    }

    startTransition(() => {
      onUpdateBio(bio)
        .then(() => setStatus("Creator bio updated"))
        .catch(() => setStatus("Unable to update creator bio"));
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#bf94ff]">Stream</p>
        <h1 className="mt-2 break-words text-2xl font-black sm:text-3xl">{username}&apos;s stream</h1>
        <p className="mt-2 text-sm text-[#adadb8]">Manage your stream information and live chat rules.</p>
      </div>
      <section className="rounded-lg border border-[#303038] bg-[#18181b] p-5">
        <h2 className="font-black">Stream information</h2>
        <label className="mt-4 block text-xs font-bold text-[#adadb8]">Title</label>
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-md border border-[#3f3f46] bg-[#242429] px-3 py-2 text-sm outline-none focus:border-[#9147ff]" />
        <button onClick={saveTitle} disabled={isPending} className="mt-3 rounded bg-[#9147ff] px-3 py-2 text-xs font-bold hover:bg-[#a970ff] disabled:opacity-50">Save title</button>
        <label className="mt-5 block text-xs font-bold text-[#adadb8]">Creator bio</label>
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mt-2 w-full rounded-md border border-[#3f3f46] bg-[#242429] px-3 py-2 text-sm outline-none focus:border-[#9147ff]" />
        <button onClick={saveBio} disabled={isPending} className="mt-3 rounded bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] disabled:opacity-50">Save bio</button>
        {status && <p className="mt-3 text-xs text-[#adadb8]">{status}</p>}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-bold text-[#adadb8]">Thumbnail</label>
          <ThumbnailUpload configured={uploadConfigured && persistChanges} thumbnailUrl={stream.thumbnailUrl} />
        </div>
      </section>
      <section className="rounded-lg border border-[#303038] bg-[#18181b] p-5">
        <h2 className="font-black">Chat settings</h2>
        <div className="mt-4 divide-y divide-[#303038]">
          <Setting label="Enable chat" description="Allow viewers to send messages." enabled={settings.isChatEnabled} disabled={isPending} onToggle={() => toggle("isChatEnabled")} />
          <Setting label="Slow mode" description="Delay messages by three seconds." enabled={settings.isChatDelayed} disabled={isPending} onToggle={() => toggle("isChatDelayed")} />
          <Setting label="Followers only" description="Only followers can send messages." enabled={settings.isChatFollowersOnly} disabled={isPending} onToggle={() => toggle("isChatFollowersOnly")} />
        </div>
      </section>
    </div>
  );
}

function Setting({ label, description, enabled, disabled, onToggle }: { label: string; description: string; enabled: boolean; disabled: boolean; onToggle: () => void }) {
  return <div className="flex items-center gap-4 py-4"><div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-[#adadb8]">{description}</p></div><button onClick={onToggle} disabled={disabled} className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${enabled ? "bg-[#9147ff]" : "bg-[#4a4a52]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-[left] ${enabled ? "left-6" : "left-1"}`} /></button></div>;
}
