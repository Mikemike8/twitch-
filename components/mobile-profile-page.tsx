"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { SearchIcon, VideoIcon } from "@/components/icons";
import type { Channel } from "@/lib/channels";

export function MobileProfilePage({
  channel,
  isSelf,
  initialFollowing = false,
  authenticated = false,
}: {
  channel: Channel;
  isSelf: boolean;
  initialFollowing?: boolean;
  authenticated?: boolean;
}) {
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-[#07070a] pb-24 text-[#f4f4f5]">
      <main className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-10 lg:px-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-[#a970ff]">Back</Link>
          {isSelf ? <Link href={`/u/${channel.username}`} className="rounded-md border border-white/20 px-4 py-2 text-sm font-bold text-[#bf94ff]">Creator Dashboard</Link> : <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}
        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Account</h1>

        <section className="mt-7 border-t border-white/15">
          <ProfileRow title="Profile">
            <Detail label="Display name" value={channel.displayName} />
            <Detail label="Username" value={`@${channel.username}`} />
            <Action href={isSelf ? `/u/${channel.username}` : `/${channel.username}`} label={isSelf ? "Edit Profile" : "View Channel"} />
          </ProfileRow>

          <ProfileRow title="Creator Identity">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar channel={channel} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{channel.displayName}</p>
                <p className="mt-1 text-sm text-[#a1a1aa]">{channel.bio || "Anime fan, streamer, and ARGUS community member."}</p>
              </div>
            </div>
          </ProfileRow>

          <ProfileRow title="Stream">
            <Detail label="Title" value={channel.title} />
            <Detail label="Status" value={channel.live ? "Live now" : "Offline"} strong={channel.live} />
            <Action href={channel.live ? `/live` : isSelf ? `/u/${channel.username}/keys` : `/search`} label={channel.live ? "Watch Live" : isSelf ? "Stream Keys" : "Browse Live"} />
          </ProfileRow>

          {isSelf && <ProfileRow title="Creator Tools">
            <ToolLink href={`/u/${channel.username}/keys`} icon={<VideoIcon className="h-5 w-5" />} label="Connection keys" />
            <ToolLink href={`/u/${channel.username}/chat`} icon={<SearchIcon className="h-5 w-5" />} label="Chat moderation" />
            <Action href={`/u/${channel.username}`} label="Manage" />
          </ProfileRow>}

          <ProfileRow title="Community">
            <Detail label="Followers" value={`${channel.followerCount ?? 0}`} />
            <Detail label="Category" value={channel.category} />
            <Action href="/search" label="Discover" />
          </ProfileRow>

          <ProfileRow title="Notifications">
            <label className="flex min-w-0 items-start gap-3 text-[#a1a1aa]">
              <input checked={updatesEnabled} onChange={(event) => setUpdatesEnabled(event.target.checked)} type="checkbox" className="mt-1 h-5 w-5 accent-[#244ed8]" />
              <span>Yes, I would like to receive stream updates, community activity, and ARGUS creator notifications.</span>
            </label>
          </ProfileRow>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] text-white/55 backdrop-blur-2xl lg:hidden">
        <Link href="/" className={itemClass}><HomeIcon />Home</Link>
        <Link href="/search" className={itemClass}><BrowseIcon />Search</Link>
        <Link href="/search" className={itemClass}><ClipsIcon />Clips</Link>
        <Link href="/live" className={itemClass}><LiveTvIcon />Live TV</Link>
        <span className={`${itemClass} text-white`}><ProfileIcon />Profile</span>
      </nav>
    </div>
  );
}

function ProfileRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-white/15 py-6 sm:py-7 lg:grid-cols-[280px_1fr] lg:gap-10">
      <h2 className="text-2xl font-black tracking-tight sm:text-[26px]">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-start">{children}</div>
    </div>
  );
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="min-w-0"><p className="text-xl text-[#8f8f9b]">{label}</p><p className={`mt-2 break-words text-xl ${strong ? "font-black text-white" : "font-bold text-[#f4f4f5]"}`}>{value}</p></div>;
}

function Action({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="justify-self-start text-xl font-medium text-[#bf94ff] sm:justify-self-end">{label}</Link>;
}

function ToolLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="flex min-h-12 items-center gap-3 rounded-md border border-white/20 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white">{icon}{label}</Link>;
}

function BrowseIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></svg>;
}

const itemClass = "flex min-h-[74px] flex-col items-center justify-center gap-1.5 pb-1 pt-2 text-[10px] font-black uppercase tracking-wide";

function HomeIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}

function ClipsIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 4h10M5 8h14v12H5z" /><path d="m10 11 5 3-5 3Z" /></svg>;
}

function LiveTvIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="13" rx="1" /><path d="m10 9 5 2.5-5 2.5ZM8 21h8" /></svg>;
}

function ProfileIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}
