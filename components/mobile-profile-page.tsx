"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { SearchIcon, VideoIcon } from "@/components/icons";
import type { Channel } from "@/lib/channels";

export function MobileProfilePage({ channel, isSelf }: { channel: Channel; isSelf: boolean }) {
  return (
    <div className="min-h-screen bg-[#07070a] pb-20 text-[#f1f1f3] lg:hidden">
      <section className="relative h-44 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 15%, ${channel.colors[0]}, transparent 42%), linear-gradient(135deg, ${channel.colors[1]}, #16131f)` }} />
        <div className="absolute inset-0 bg-black/15" />
        <Link href="/" className="absolute left-4 top-5 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-xl text-white">←</Link>
        {isSelf && <Link href={`/u/${channel.username}`} className="absolute right-4 top-5 rounded-full bg-black/60 px-4 py-2 text-sm font-black text-white">Edit Profile</Link>}
      </section>
      <section className="px-4">
        <div className="-mt-8 flex items-end gap-4">
          <Avatar channel={channel} size="lg" />
          <div className="min-w-0 pb-1"><h1 className="truncate text-3xl font-black">{channel.displayName}</h1><p className="mt-1 text-sm text-[#adadb8]">{channel.live ? "Live now" : "Offline"}</p></div>
        </div>
        <p className="mt-8 text-base leading-6 text-[#adadb8]">{channel.bio || "Anime fan, streamer, and ARGUS community member."}</p>
        {isSelf && <div className="mt-7 grid grid-cols-2 gap-3">
          <Link href={`/u/${channel.username}/keys`} className="flex items-center justify-center gap-3 rounded-xl bg-[#18181b] px-3 py-5 text-center text-sm font-black"><VideoIcon className="h-6 w-6" />Stream Manager</Link>
          <Link href={`/u/${channel.username}`} className="flex items-center justify-center gap-3 rounded-xl bg-[#18181b] px-3 py-5 text-center text-sm font-black"><SearchIcon className="h-6 w-6" />Analytics</Link>
        </div>}
        <div className="mt-8 flex gap-7 overflow-x-auto border-b border-white/10 text-base font-black">
          {["Home", "About", "Clips", "Videos", "Schedule"].map((tab, index) => <span key={tab} className={`shrink-0 pb-3 ${index === 0 ? "border-b-4 border-[#8b3cff] text-[#8b3cff]" : ""}`}>{tab}</span>)}
        </div>
        <h2 className="mt-6 text-xl font-black">Recent Highlights And Uploads</h2>
        <div className="mt-4 space-y-4">
          {["Latest live anime discussion", "Community watch party highlights", "ARGUS ranking climb"].map((title, index) => <div key={title} className="flex gap-3"><div className="grid h-20 w-32 shrink-0 place-items-center rounded bg-gradient-to-br from-[#251739] to-[#9147ff] text-xs font-black text-white">{index + 1}:0{index + 3}</div><div><p className="line-clamp-2 text-sm font-black">{title}</p><p className="mt-2 text-xs text-[#adadb8]">{32 + index * 11} views · recent</p></div></div>)}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/5 bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] text-white/55 backdrop-blur-2xl">
        <Link href="/" className={itemClass}><HomeIcon />Home</Link>
        <Link href="/search" className={itemClass}><BrowseIcon />Search</Link>
        <Link href="/search" className={itemClass}><ClipsIcon />Clips</Link>
        <Link href="/live" className={itemClass}><LiveTvIcon />Live TV</Link>
        <span className={`${itemClass} text-white`}><ProfileIcon />Profile</span>
      </nav>
    </div>
  );
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
