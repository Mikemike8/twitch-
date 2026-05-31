"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ChannelPage } from "@/components/channel-page";
import { ChevronIcon, MenuIcon, SearchIcon, UsersIcon, VideoIcon } from "@/components/icons";
import { channels, formatViewers, type Channel } from "@/lib/channels";

function Navbar({ query, onQuery, clerkConfigured, viewerUsername, onOpenSidebar }: { query: string; onQuery: (value: string) => void; clerkConfigured: boolean; viewerUsername?: string; onOpenSidebar: () => void }) {
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-[#29292e] bg-[#18181b] px-3 shadow-md sm:gap-4">
      <button onClick={onOpenSidebar} className="grid h-10 w-10 shrink-0 place-items-center rounded hover:bg-[#303038] lg:hidden" aria-label="Open navigation menu"><MenuIcon className="h-5 w-5" /></button>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[#9147ff] text-sm font-black">A</div>
        <span className="hidden text-lg font-black tracking-tight sm:block">Argus</span>
      </div>
      <nav className="hidden items-center gap-4 text-sm font-semibold md:flex">
        <button className="text-[#bf94ff]">Browse</button>
        <button className="text-[#adadb8] hover:text-white">Following</button>
      </nav>
      <form onSubmit={(event) => { event.preventDefault(); router.push(`/search?term=${encodeURIComponent(query)}`); }} className="mx-auto flex h-9 min-w-0 flex-1 overflow-hidden rounded-md border border-[#3f3f46] bg-[#26262c] focus-within:border-[#9147ff] sm:max-w-xl">
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search channels" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#8d8d99]" />
        <button type="submit" className="grid w-10 place-items-center bg-[#313138]"><SearchIcon className="h-4 w-4" /></button>
      </form>
      <div className="flex items-center gap-2">
        {clerkConfigured ? <><Show when="signed-out"><SignInButton><button className="rounded bg-[#2f2f35] px-2 py-2 text-xs font-bold hover:bg-[#3b3b44] sm:px-3">Log in</button></SignInButton><SignUpButton><button className="hidden rounded bg-[#9147ff] px-3 py-2 text-xs font-bold hover:bg-[#a970ff] sm:block">Sign up</button></SignUpButton></Show><Show when="signed-in">{viewerUsername && <Link href={`/u/${viewerUsername}`} className="hidden rounded bg-[#9147ff] px-3 py-2 text-xs font-bold hover:bg-[#a970ff] sm:block"><span className="hidden xl:inline">Creator </span>Dashboard</Link>}<UserButton /></Show></> : <><button className="hidden rounded bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] sm:block">Log in</button><button className="hidden rounded bg-[#9147ff] px-3 py-2 text-xs font-bold hover:bg-[#a970ff] sm:block">Sign up</button><button className="grid h-8 w-8 place-items-center rounded-full bg-[#3b3b44] text-xs font-bold">MH</button></>}
      </div>
    </header>
  );
}

function Sidebar({ collapsed, mobileOpen, onToggle, onClose, onOpen, data, followed }: { collapsed: boolean; mobileOpen: boolean; onToggle: () => void; onClose: () => void; onOpen: (channel: Channel) => void; data: Channel[]; followed: Channel[] }) {
  return (
    <>
    {mobileOpen && <button onClick={onClose} className="fixed inset-0 top-14 z-30 bg-black/60 lg:hidden" aria-label="Close navigation menu" />}
    <aside className={`${collapsed ? "lg:w-[60px]" : "lg:w-[240px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed bottom-0 left-0 top-14 z-30 w-[min(280px,85vw)] border-r border-[#26262c] bg-[#1f1f23] transition-[transform,width] lg:translate-x-0`}>
      <div className="flex h-12 items-center justify-between px-3">
        {!collapsed && <span className="text-xs font-bold uppercase">For you</span>}
        <button onClick={onClose} className="ml-auto rounded p-2 hover:bg-[#303038] lg:hidden" aria-label="Close navigation menu">×</button>
        <button onClick={onToggle} className="ml-auto hidden rounded p-2 hover:bg-[#303038] lg:block" aria-label="Toggle sidebar">
          <ChevronIcon className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
      <ChannelList collapsed={collapsed} channels={followed} onOpen={(channel) => { onOpen(channel); onClose(); }} label="Following" />
      <ChannelList collapsed={collapsed} channels={data.filter((channel) => !followed.some((item) => item.username === channel.username)).slice(0, 7)} onOpen={(channel) => { onOpen(channel); onClose(); }} label="Recommended channels" />
      {!collapsed && <div className="mt-3 px-3"><div className="rounded-md bg-[#26262c] p-3"><UsersIcon className="mb-2 h-5 w-5 text-[#bf94ff]" /><p className="text-xs leading-5 text-[#adadb8]">Join the community and discover more live channels.</p></div></div>}
    </aside>
    </>
  );
}

function ChannelList({ collapsed, channels: data, onOpen, label }: { collapsed: boolean; channels: Channel[]; onOpen: (channel: Channel) => void; label: string }) {
  if (!data.length) return null;
  return <div className="mb-2 space-y-0.5">
    {!collapsed && <p className="px-3 py-2 text-[11px] font-bold uppercase text-[#adadb8]">{label}</p>}
        {data.map((channel) => (
          <button key={channel.username} onClick={() => onOpen(channel)} className="flex h-12 w-full items-center gap-3 px-3 text-left hover:bg-[#2d2d33]">
            <Avatar channel={channel} size="sm" />
            {!collapsed && <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{channel.displayName}</span>
                <span className="block truncate text-xs text-[#adadb8]">{channel.category}</span>
              </span>
              <span className="flex items-center gap-1 text-xs"><i className="h-2 w-2 rounded-full bg-red-500" />{formatViewers(channel.viewers)}</span>
            </>}
          </button>
        ))}
  </div>;
}

function StreamCard({ channel, onOpen }: { channel: Channel; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left">
      <div className="relative aspect-video overflow-hidden bg-[#26262c] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-[-6px_6px_0_#9147ff]">
        {channel.thumbnailUrl ? <Image src={channel.thumbnailUrl} alt="" fill className="object-cover" /> : <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${channel.colors[0]}, ${channel.colors[1]})` }} /><div className="absolute inset-0 grid place-items-center opacity-50"><VideoIcon className="h-14 w-14" /></div></>}
        <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold">LIVE</span>
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px]">{formatViewers(channel.viewers)} viewers</span>
      </div>
      <div className="mt-3 flex gap-3">
        <Avatar channel={channel} />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold group-hover:text-[#bf94ff]">{channel.title}</h3>
          <p className="mt-1 text-xs text-[#adadb8]">{channel.displayName}</p>
          <p className="text-xs text-[#adadb8]">{channel.category}</p>
          <div className="mt-2 flex flex-wrap gap-1">{channel.tags.map((tag) => <span key={tag} className="rounded-full bg-[#323239] px-2 py-0.5 text-[10px] font-semibold text-[#adadb8]">{tag}</span>)}</div>
        </div>
      </div>
    </button>
  );
}

export function BrowseApp({ persistedChannels = [], followedChannels = [], demoFallback = true, forceDemoData = false, initialQuery = "", clerkConfigured = false, viewerIdentity, viewerUsername }: { persistedChannels?: Channel[]; followedChannels?: Channel[]; demoFallback?: boolean; forceDemoData?: boolean; initialQuery?: string; clerkConfigured?: boolean; viewerIdentity?: string; viewerUsername?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<Channel | null>(null);
  const availableChannels = forceDemoData ? channels : persistedChannels.length || !demoFallback ? persistedChannels : channels;
  const filtered = useMemo(() => availableChannels.filter((channel) => `${channel.displayName} ${channel.title} ${channel.category}`.toLowerCase().includes(query.toLowerCase())), [availableChannels, query]);

  return (
    <div className="min-h-screen bg-[#0e0e10]">
      <Navbar query={query} onQuery={setQuery} clerkConfigured={clerkConfigured} viewerUsername={viewerUsername} onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <Sidebar collapsed={collapsed} mobileOpen={mobileSidebarOpen} onToggle={() => setCollapsed(!collapsed)} onClose={() => setMobileSidebarOpen(false)} onOpen={setSelected} data={availableChannels} followed={followedChannels} />
      <main className={`${collapsed ? "lg:ml-[60px]" : "lg:ml-[240px]"} pt-14 transition-[margin]`}>
        {selected ? <ChannelPage channel={selected} onBack={() => setSelected(null)} canFollow={!selected.hostIdentity || selected.hostIdentity !== viewerIdentity} authenticated={Boolean(viewerIdentity)} /> : (
          <div className="px-4 py-6 sm:px-5 sm:py-8 lg:px-8">
            <section className="mb-9 flex min-h-48 items-center overflow-hidden rounded-xl border border-[#29292f] bg-gradient-to-r from-[#271443] via-[#18181b] to-[#152134] p-6 lg:p-9">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#bf94ff]">Live now</p>
                <h1 className="max-w-2xl text-3xl font-black tracking-tight lg:text-5xl">Discover your next favorite stream.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#adadb8]">Watch live creators, join the chat, and follow the communities you care about.</p>
              </div>
            </section>
            <div className="mb-5 flex items-end justify-between">
              <div><h2 className="text-xl font-black"><span className="text-[#bf94ff]">Live channels</span> we think you&apos;ll like</h2><p className="mt-1 text-sm text-[#adadb8]">{filtered.length} channels streaming now</p></div>
              <MenuIcon className="h-5 w-5 text-[#adadb8]" />
            </div>
            {filtered.length ? <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map((channel) => <StreamCard key={channel.username} channel={channel} onOpen={() => setSelected(channel)} />)}</div> : <div className="rounded-lg border border-[#29292f] bg-[#18181b] p-10 text-center text-sm text-[#adadb8]">No channels found for &quot;{query}&quot;.</div>}
          </div>
        )}
      </main>
    </div>
  );
}
