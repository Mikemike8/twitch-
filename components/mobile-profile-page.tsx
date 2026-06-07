"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { BellIcon, SearchIcon, VideoIcon } from "@/components/icons";
import { SiteTopbar } from "@/components/site-topbar";
import type { Channel } from "@/lib/channels";

export function MobileProfilePage({
  channel,
  isSelf,
  initialFollowing = false,
  authenticated = false,
  clerkConfigured = false,
}: {
  channel: Channel;
  isSelf: boolean;
  initialFollowing?: boolean;
  authenticated?: boolean;
  clerkConfigured?: boolean;
}) {
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-[#07070a] pb-24 text-[#f4f4f5]">
      <div className="hidden lg:block">
        <SiteTopbar clerkConfigured={clerkConfigured} viewerUsername={isSelf ? channel.username : undefined} active="profile" />
      </div>
      <main className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-10 lg:px-10">
        <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
          <Link href="/" className="text-sm font-bold text-[#a970ff]">Back</Link>
          {isSelf ? <Link href={`/u/${channel.username}`} className="rounded-md border border-white/20 px-4 py-2 text-sm font-bold text-[#bf94ff]">Creator Dashboard</Link> : <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}
        </div>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#11111a]">
          <div className="relative min-h-56 overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${channel.colors[0]}, ${channel.colors[1]})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11111a] via-[#11111a]/45 to-black/10" />
            <div className="relative flex min-h-56 flex-col justify-end p-5 sm:p-7">
              <Avatar channel={channel} size="lg" />
              <h1 className="mt-4 truncate text-4xl font-black tracking-tight sm:text-5xl">{channel.displayName}</h1>
              <p className="mt-1 text-sm font-bold text-[#a1a1aa]">@{channel.username}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4d4dd]">{channel.bio || "Anime fan, streamer, and ARGUS community member."}</p>
            </div>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <ProfileStat label="Followers" value={`${channel.followerCount ?? 0}`} />
            <ProfileStat label="Category" value={channel.category} />
            <ProfileStat label="Status" value={channel.live ? "Live now" : "Offline"} strong={channel.live} />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#101015]">
          <ProfileMenuLink href="/search" icon={<ClipsIcon />} title="Watchlist" detail="Save anime, movies, and series for later" />
          <ProfileMenuLink href="/" icon={<HomeIcon />} title="Continue Watching" detail="Resume episodes and live watch rooms" />
          <ProfileMenuLink href="/live" icon={<LiveTvIcon />} title="Live Rooms" detail="Jump back into active community streams" />
          <ProfileMenuLink href={isSelf ? `/u/${channel.username}` : `/${channel.username}`} icon={<ProfileIcon />} title={isSelf ? "Edit Profile" : "View Channel"} detail={isSelf ? "Update your public identity" : "Open this creator channel"} />
        </section>

        {isSelf && <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#101015]">
          <ProfileMenuLink href={`/u/${channel.username}/keys`} icon={<VideoIcon className="h-5 w-5" />} title="Connection Keys" detail="Manage stream connection details" />
          <ProfileMenuLink href={`/u/${channel.username}/chat`} icon={<SearchIcon className="h-5 w-5" />} title="Chat Moderation" detail="Review chat controls and community safety" />
          <ProfileMenuLink href={`/u/${channel.username}`} icon={<BellIcon className="h-5 w-5" />} title="Creator Dashboard" detail="Open the full creator workspace" />
        </section>}

        <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#101015]">
          <label className="flex min-h-16 items-center gap-4 border-b border-white/10 px-4 py-4 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[#bf94ff]"><BellIcon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">Notifications</span>
              <span className="mt-1 block text-xs leading-5 text-[#8f8f9b]">Stream updates and episode activity</span>
            </span>
            <input checked={updatesEnabled} onChange={(event) => setUpdatesEnabled(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#244ed8]" />
          </label>
          {isSelf && <div className="px-4 py-4">
            <SignOutButton>
              <button type="button" className="min-h-12 rounded-md border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-red-100">
                Log out
              </button>
            </SignOutButton>
          </div>}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-[#0f0f12]/98 px-2 pb-[env(safe-area-inset-bottom)] text-white/55 shadow-[0_-18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">
        <Link href="/" className={itemClass}><HomeIcon />Home</Link>
        <Link href="/search" className={itemClass}><BrowseIcon />Search</Link>
        <Link href="/live" className={itemClass}><LiveTvIcon />Live</Link>
        <span className={`${itemClass} text-white`}><i className="absolute top-0 h-0.5 w-8 rounded-full bg-white" /><ProfileIcon />Profile</span>
      </nav>
    </div>
  );
}

function ProfileStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[11px] font-black uppercase tracking-wide text-[#8f8f9b]">{label}</p><p className={`mt-1 truncate text-sm font-black ${strong ? "text-[#4ade80]" : "text-white"}`}>{value}</p></div>;
}

function ProfileMenuLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return <Link href={href} className="flex min-h-16 items-center gap-4 border-b border-white/10 px-4 py-4 text-left last:border-b-0 hover:bg-white/[0.04]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[#bf94ff]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{title}</span><span className="mt-1 block truncate text-xs text-[#8f8f9b]">{detail}</span></span><span className="text-xl text-white/35">›</span></Link>;
}

function BrowseIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></svg>;
}

const itemClass = "relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 pb-1 pt-2 text-[10px] font-black uppercase tracking-wide";

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
