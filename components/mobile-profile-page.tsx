"use client";

import Link from "next/link";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { BellIcon } from "@/components/icons";
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
  const notificationKey = `argus:profile-notifications:${channel.username}`;
  const [updatesEnabled, setUpdatesEnabled] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(notificationKey) === "enabled",
  );
  const dashboardHref = isSelf ? `/u/${channel.username}` : "/u";
  const primaryHref = isSelf ? dashboardHref : "/live";
  const primaryLabel = isSelf ? "Edit Profile" : channel.live ? "Watch Live" : "Browse Live Rooms";

  const toggleNotifications = (enabled: boolean) => {
    setUpdatesEnabled(enabled);
    window.localStorage.setItem(notificationKey, enabled ? "enabled" : "disabled");
  };

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white">
      <div className="hidden lg:block">
        <SiteTopbar clerkConfigured={clerkConfigured} viewerUsername={isSelf ? channel.username : undefined} active="profile" />
      </div>
      <main className="mx-auto w-full max-w-[1180px] px-5 py-5 sm:px-8 sm:py-10 lg:px-10">
        <div className="mb-8 flex min-w-0 items-center justify-between gap-4 lg:hidden">
          <Link href="/" className="grid h-10 w-10 shrink-0 place-items-center text-white/80 hover:text-white" aria-label="Back home">←</Link>
          {!isSelf && <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}
        </div>

        <section className="overflow-hidden rounded border border-white/10 bg-[#181818]">
          <div className="relative min-h-[min(76svh,520px)] overflow-hidden lg:min-h-[520px]">
            {channel.thumbnailUrl ? (
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${channel.thumbnailUrl})` }} />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#232323,#000)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/32 to-black/20" />
            <div className="relative flex min-h-[min(76svh,520px)] flex-col justify-end p-5 sm:p-7 lg:min-h-[520px] lg:p-12">
              <div className="flex items-end gap-4">
                <Avatar channel={channel} size="lg" />
                {channel.live && <span className="mb-1 rounded bg-[#e50914] px-2 py-1 text-xs font-bold uppercase text-white">Live now</span>}
              </div>
              <h1 className="mt-5 max-w-4xl break-words text-[clamp(2.75rem,14vw,5rem)] font-black uppercase leading-none tracking-normal sm:text-7xl lg:text-8xl">{channel.displayName}</h1>
              <p className="mt-3 text-base font-medium text-[#b3b3b3]">@{channel.username}</p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#e5e5e5]">{channel.bio || "Anime fan, streamer, and ARGUS community member."}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={primaryHref} className="rounded bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/80">
                  {primaryLabel}
                </Link>
                {isSelf && <Link href={`${dashboardHref}/keys`} className="rounded bg-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">Stream Setup</Link>}
                {!isSelf && <FollowButton userId={channel.hostIdentity} initialFollowing={initialFollowing} authenticated={authenticated} />}
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <ProfileStat label="Followers" value={`${channel.followerCount ?? 0}`} />
            <ProfileStat label="Category" value={channel.category} />
            <ProfileStat label="Status" value={channel.live ? "Live now" : "Offline"} strong={channel.live} />
          </div>
        </section>

        {isSelf && (
          <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Link href={dashboardHref} className="group overflow-hidden rounded border border-[#e50914]/45 bg-[#e50914] p-5 text-white transition hover:bg-[#f50723] sm:p-6">
              <p className="text-xs font-bold uppercase text-white/75">Creator workspace</p>
              <h2 className="mt-3 text-3xl font-black leading-none sm:text-4xl">Creator Dashboard</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82">Manage your stream title, keys, chat safety, community list, and subscription plan from one place.</p>
              <span className="mt-6 inline-flex items-center text-sm font-bold">Open dashboard <span className="ml-2 transition group-hover:translate-x-1">›</span></span>
            </Link>
            <div className="rounded border border-white/10 bg-[#181818] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase text-[#b3b3b3]">Live control</p>
              <p className="mt-3 text-2xl font-bold">{channel.live ? "Your channel is live" : "Ready to go live"}</p>
              <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">{channel.live ? "Jump into your public profile or tune the stream from the dashboard." : "Set connection keys, update stream info, then start your broadcast."}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`${dashboardHref}/keys`} className="rounded bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/20">Keys</Link>
                <Link href={`${dashboardHref}/chat`} className="rounded bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/20">Chat</Link>
              </div>
            </div>
          </section>
        )}

        <ProfileActionList channel={channel} dashboardHref={dashboardHref} isSelf={isSelf} />

        <section className="mt-6 overflow-hidden rounded border border-white/10 bg-[#181818]">
          <label className="flex min-h-16 items-center gap-4 border-b border-white/10 px-4 py-4 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-white/[0.08] text-white"><BellIcon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Notifications</span>
              <span className="mt-1 block text-xs leading-5 text-[#b3b3b3]">{updatesEnabled ? "Enabled on this device" : "Stream updates and episode activity"}</span>
            </span>
            {authenticated || isSelf ? (
              <input checked={updatesEnabled} onChange={(event) => toggleNotifications(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#e50914]" />
            ) : (
              <SignInButton fallbackRedirectUrl={`/${channel.username}`}>
                <button type="button" className="rounded bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15">Sign in</button>
              </SignInButton>
            )}
          </label>
          {isSelf && <div className="px-4 py-4">
            <SignOutButton>
              <button type="button" className="min-h-12 rounded border border-[#e50914]/35 bg-[#e50914]/10 px-4 py-3 text-sm font-bold text-red-100">
                Log out
              </button>
            </SignOutButton>
          </div>}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-black/92 px-2 pb-[env(safe-area-inset-bottom)] text-white/55 backdrop-blur-xl lg:hidden">
        <Link href="/" className={itemClass}><HomeIcon />Home</Link>
        <Link href="/search" className={itemClass}><BrowseIcon />Search</Link>
        <Link href="/live" className={itemClass}><LiveTvIcon />Live</Link>
        <span className={`${itemClass} text-white`}><i className="absolute top-0 h-0.5 w-8 rounded-full bg-[#e50914]" /><ProfileIcon />Profile</span>
      </nav>
    </div>
  );
}

function ProfileActionList({ channel, dashboardHref, isSelf }: { channel: Channel; dashboardHref: string; isSelf: boolean }) {
  if (isSelf) {
    return (
      <section className="mt-6 overflow-hidden rounded border border-white/10 bg-[#181818]">
        <ProfileMenuLink href={dashboardHref} icon={<ProfileIcon />} title="Edit Profile" detail="Update username, bio, title, and channel artwork" />
        <ProfileMenuLink href={`${dashboardHref}/keys`} icon={<KeyIcon />} title="Stream Setup" detail="Copy connection keys and prepare your broadcast" />
        <ProfileMenuLink href={`${dashboardHref}/chat`} icon={<ChatIcon />} title="Chat Controls" detail="Manage slow mode, followers-only chat, and moderation" />
        <ProfileMenuLink href={`${dashboardHref}/subscription`} icon={<PlanIcon />} title="Creator Plan" detail="Review monetization and paid creator options" />
        <ProfileMenuLink href="/#continue-watching" icon={<HomeIcon />} title="Continue Watching" detail="Resume episodes and live watch rooms" />
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded border border-white/10 bg-[#181818]">
      <ProfileMenuLink href="/live" icon={<LiveTvIcon />} title={channel.live ? "Watch Live" : "Live Rooms"} detail={channel.live ? "Open the live room for this creator" : "Find creators currently streaming"} />
      <ProfileMenuLink href="/search" icon={<ClipsIcon />} title="Browse Library" detail="Find anime, movies, and series" />
      <ProfileMenuLink href="/#continue-watching" icon={<HomeIcon />} title="Continue Watching" detail="Resume episodes and live watch rooms" />
    </section>
  );
}

function ProfileStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[11px] font-bold uppercase text-[#808080]">{label}</p><p className={`mt-1 truncate text-sm font-bold ${strong ? "text-[#46d369]" : "text-white"}`}>{value}</p></div>;
}

function ProfileMenuLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return <Link href={href} className="flex min-h-16 items-center gap-4 border-b border-white/10 px-4 py-4 text-left last:border-b-0 hover:bg-white/[0.05]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-white/[0.08] text-white">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block truncate text-xs text-[#b3b3b3]">{detail}</span></span><span className="text-xl text-white/35">›</span></Link>;
}

function BrowseIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></svg>;
}

const itemClass = "relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 pb-1 pt-2 text-[10px] font-bold uppercase";

function HomeIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
}

function ClipsIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 4h10M5 8h14v12H5z" /><path d="m10 11 5 3-5 3Z" /></svg>;
}

function KeyIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m12 12 9-9M15 9l3 3M18 6l3 3" /></svg>;
}

function ChatIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>;
}

function PlanIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
}

function LiveTvIcon() {
  return <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="13" rx="1" /><path d="m10 9 5 2.5-5 2.5ZM8 21h8" /></svg>;
}

function ProfileIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}
