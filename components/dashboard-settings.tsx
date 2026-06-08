"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { onUpdateStream } from "@/actions/stream";
import { onUpdateBio, onUpdateUsername } from "@/actions/user";
import { ThumbnailUpload } from "@/components/thumbnail-upload";
import { inputLimits } from "@/lib/validation";

export function DashboardSettings({ username, bio: initialBio, persistChanges, stream, uploadConfigured }: { username: string; bio: string; persistChanges: boolean; stream: { name: string; thumbnailUrl: string | null; isChatEnabled: boolean; isChatDelayed: boolean; isChatFollowersOnly: boolean }; uploadConfigured: boolean }) {
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState(username);
  const [usernameValue, setUsernameValue] = useState(username);
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
          .catch(() => {
            setSettings((current) => ({ ...current, [key]: !enabled }));
            setStatus("Unable to update chat settings");
          });
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

  const saveUsername = () => {
    if (!persistChanges) {
      setCurrentUsername(usernameValue.trim().toLowerCase());
      setStatus("Demo username updated locally");
      return;
    }

    startTransition(() => {
      onUpdateUsername(usernameValue)
        .then((user) => {
          setCurrentUsername(user.username);
          setUsernameValue(user.username);
          setStatus("Username updated");
          router.replace(`/u/${user.username}`);
          router.refresh();
        })
        .catch((cause: unknown) => setStatus(cause instanceof Error ? cause.message : "Unable to update username"));
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#141414] px-4 py-5 text-white sm:px-6 sm:py-8 lg:px-10">
      <section className="relative overflow-hidden rounded border border-white/10 bg-[#181818]">
        {stream.thumbnailUrl && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${stream.thumbnailUrl})` }} />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.5),rgba(0,0,0,0.16)),radial-gradient(circle_at_85%_0%,rgba(229,9,20,0.24),transparent_20rem)]" />
        <div className="relative z-10 p-5 sm:p-7 lg:p-9">
          <p className="text-xs font-black uppercase text-[#e50914]">Creator Dashboard</p>
          <h1 className="mt-3 max-w-3xl break-words text-3xl font-black uppercase leading-none sm:text-5xl">{currentUsername}&apos;s stream</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d2d2d2]">Manage your live room, profile, stream art, and chat rules from one studio view.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#d2d2d2]">
            <span className="rounded bg-[#e50914] px-2 py-1 text-white">LIVE READY</span>
            <span className="rounded border border-white/15 bg-black/35 px-2 py-1">Chat {settings.isChatEnabled ? "On" : "Off"}</span>
            <span className="rounded border border-white/15 bg-black/35 px-2 py-1">Followers {settings.isChatFollowersOnly ? "Only" : "Open"}</span>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded border border-white/10 bg-[#181818] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.32)] sm:p-6">
        <h2 className="text-xl font-black">Stream information</h2>
        <label className="mt-5 block text-xs font-bold uppercase text-[#b3b3b3]">Username</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input value={usernameValue} maxLength={inputLimits.username} onChange={(event) => setUsernameValue(event.target.value)} className="min-w-0 flex-1 rounded border border-white/15 bg-black/55 px-3 py-3 text-sm text-white outline-none placeholder:text-[#808080] focus:border-[#e50914]" />
          <button onClick={saveUsername} disabled={isPending} className="rounded bg-white px-4 py-3 text-xs font-black text-black hover:bg-[#e5e5e5] disabled:opacity-50">Save username</button>
        </div>
        <p className="mt-2 text-xs text-[#808080]">Use 3-24 letters, numbers, underscores, or hyphens.</p>
        <label className="mt-5 block text-xs font-bold uppercase text-[#b3b3b3]">Title</label>
        <input value={title} maxLength={inputLimits.streamName} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm text-white outline-none placeholder:text-[#808080] focus:border-[#e50914]" />
        <button onClick={saveTitle} disabled={isPending} className="mt-3 rounded bg-[#e50914] px-4 py-3 text-xs font-black hover:bg-[#f50723] disabled:opacity-50">Save title</button>
        <label className="mt-6 block text-xs font-bold uppercase text-[#b3b3b3]">Creator bio</label>
        <textarea value={bio} maxLength={inputLimits.bio} onChange={(event) => setBio(event.target.value)} rows={4} className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm text-white outline-none placeholder:text-[#808080] focus:border-[#e50914]" />
        <button onClick={saveBio} disabled={isPending} className="mt-3 rounded bg-white/12 px-4 py-3 text-xs font-black hover:bg-white/18 disabled:opacity-50">Save bio</button>
        {status && <p className="mt-4 rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d2d2d2]">{status}</p>}
      </section>

      <div className="space-y-5">
        <section className="rounded border border-white/10 bg-[#181818] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
          <label className="mb-3 block text-xs font-black uppercase text-[#b3b3b3]">Thumbnail</label>
          <ThumbnailUpload configured={uploadConfigured && persistChanges} thumbnailUrl={stream.thumbnailUrl} />
        </section>
        <section className="rounded border border-white/10 bg-[#181818] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
          <h2 className="text-xl font-black">Chat settings</h2>
          <div className="mt-4 divide-y divide-white/10">
            <Setting label="Enable chat" description="Allow viewers to send messages." enabled={settings.isChatEnabled} disabled={isPending} onToggle={() => toggle("isChatEnabled")} />
            <Setting label="Slow mode" description="Allow one server-validated message per viewer every 15 seconds." enabled={settings.isChatDelayed} disabled={isPending} onToggle={() => toggle("isChatDelayed")} />
            <Setting label="Followers only" description="Only followers can send messages." enabled={settings.isChatFollowersOnly} disabled={isPending} onToggle={() => toggle("isChatFollowersOnly")} />
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

function Setting({ label, description, enabled, disabled, onToggle }: { label: string; description: string; enabled: boolean; disabled: boolean; onToggle: () => void }) {
  return <div className="flex items-center gap-4 py-4"><div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-[#b3b3b3]">{description}</p></div><button onClick={onToggle} disabled={disabled} className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${enabled ? "bg-[#e50914]" : "bg-[#4a4a52]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-[left] ${enabled ? "left-6" : "left-1"}`} /></button></div>;
}
