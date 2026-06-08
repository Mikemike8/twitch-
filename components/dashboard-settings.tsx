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
    <div className="space-y-6 bg-[#141414] p-4 text-white sm:p-6 lg:p-10">
      <div>
        <p className="text-xs font-bold uppercase text-[#e50914]">Stream</p>
        <h1 className="mt-2 break-words text-3xl font-black uppercase leading-none sm:text-5xl">{currentUsername}&apos;s stream</h1>
        <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">Manage your stream information and live chat rules.</p>
      </div>
      <section className="rounded border border-white/10 bg-[#181818] p-5">
        <h2 className="text-xl font-bold">Stream information</h2>
        <label className="mt-4 block text-xs font-bold text-[#b3b3b3]">Username</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input value={usernameValue} maxLength={inputLimits.username} onChange={(event) => setUsernameValue(event.target.value)} className="min-w-0 flex-1 rounded border border-white/20 bg-black px-3 py-2 text-sm outline-none focus:border-[#e50914]" />
          <button onClick={saveUsername} disabled={isPending} className="rounded bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50">Save username</button>
        </div>
        <p className="mt-2 text-xs text-[#808080]">Use 3-24 letters, numbers, underscores, or hyphens.</p>
        <label className="mt-4 block text-xs font-bold text-[#b3b3b3]">Title</label>
        <input value={title} maxLength={inputLimits.streamName} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded border border-white/20 bg-black px-3 py-2 text-sm outline-none focus:border-[#e50914]" />
        <button onClick={saveTitle} disabled={isPending} className="mt-3 rounded bg-[#e50914] px-3 py-2 text-xs font-bold hover:bg-[#f50723] disabled:opacity-50">Save title</button>
        <label className="mt-5 block text-xs font-bold text-[#b3b3b3]">Creator bio</label>
        <textarea value={bio} maxLength={inputLimits.bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mt-2 w-full rounded border border-white/20 bg-black px-3 py-2 text-sm outline-none focus:border-[#e50914]" />
        <button onClick={saveBio} disabled={isPending} className="mt-3 rounded bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50">Save bio</button>
        {status && <p className="mt-3 text-xs text-[#b3b3b3]">{status}</p>}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-bold text-[#b3b3b3]">Thumbnail</label>
          <ThumbnailUpload configured={uploadConfigured && persistChanges} thumbnailUrl={stream.thumbnailUrl} />
        </div>
      </section>
      <section className="rounded border border-white/10 bg-[#181818] p-5">
        <h2 className="text-xl font-bold">Chat settings</h2>
        <div className="mt-4 divide-y divide-white/10">
          <Setting label="Enable chat" description="Allow viewers to send messages." enabled={settings.isChatEnabled} disabled={isPending} onToggle={() => toggle("isChatEnabled")} />
          <Setting label="Slow mode" description="Allow one server-validated message per viewer every 15 seconds." enabled={settings.isChatDelayed} disabled={isPending} onToggle={() => toggle("isChatDelayed")} />
          <Setting label="Followers only" description="Only followers can send messages." enabled={settings.isChatFollowersOnly} disabled={isPending} onToggle={() => toggle("isChatFollowersOnly")} />
        </div>
      </section>
    </div>
  );
}

function Setting({ label, description, enabled, disabled, onToggle }: { label: string; description: string; enabled: boolean; disabled: boolean; onToggle: () => void }) {
  return <div className="flex items-center gap-4 py-4"><div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-[#b3b3b3]">{description}</p></div><button onClick={onToggle} disabled={disabled} className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${enabled ? "bg-[#e50914]" : "bg-[#4a4a52]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-[left] ${enabled ? "left-6" : "left-1"}`} /></button></div>;
}
