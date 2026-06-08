"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ChevronIcon, MenuIcon, UsersIcon, VideoIcon } from "@/components/icons";

const items = [
  { label: "Stream", href: "", icon: VideoIcon },
  { label: "Keys", href: "/keys", icon: KeyIcon },
  { label: "Chat", href: "/chat", icon: ChatIcon },
  { label: "Community", href: "/community", icon: UsersIcon },
  { label: "Plan", href: "/subscription", icon: PlanIcon },
];

export function DashboardShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/u/${username}`;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_0%,rgba(229,9,20,0.2),transparent_24rem),linear-gradient(180deg,rgba(0,0,0,0.96),rgba(20,20,20,0))]" />
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 min-w-0 items-center gap-2 border-b border-white/10 bg-black/78 px-2 backdrop-blur-xl sm:gap-4 sm:px-5">
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-white/5 hover:bg-white/10 lg:hidden" aria-label="Open creator navigation"><MenuIcon className="h-5 w-5" /></button>
        <Link href="/" aria-label="Argus home" className="flex min-w-0 shrink items-center"><BrandLogo className="h-7 w-auto max-w-[112px] sm:h-8 sm:max-w-none" /></Link>
        <span className="min-w-0 truncate text-xs font-black uppercase tracking-normal text-[#e5e5e5] sm:text-base">Creator Studio</span>
        <Link href="/" className="ml-auto shrink-0 rounded bg-white px-2.5 py-2 text-xs font-black text-black hover:bg-[#e5e5e5] sm:px-3">Exit</Link>
      </header>
      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-30 bg-black/70 lg:hidden" aria-label="Close creator navigation" />}
      <aside className={`${collapsed ? "lg:w-[68px]" : "lg:w-[236px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed bottom-0 left-0 top-16 z-30 w-[min(292px,88vw)] border-r border-white/10 bg-black/88 shadow-[18px_0_48px_rgba(0,0,0,0.36)] backdrop-blur-xl transition-[transform,width] lg:translate-x-0`}>
        <div className="flex h-16 items-center px-4">
          {!collapsed && <div className="min-w-0"><p className="truncate text-[11px] font-black uppercase text-[#e50914]">Creator tools</p><p className="mt-1 truncate text-xs text-[#8c8c8c]">@{username}</p></div>}
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded p-2 text-2xl leading-none hover:bg-white/10 lg:hidden" aria-label="Close creator navigation">×</button>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden rounded border border-white/10 bg-white/5 p-2 hover:bg-white/10 lg:block" aria-label="Toggle creator navigation"><ChevronIcon className={`h-4 w-4 ${collapsed ? "rotate-180" : ""}`} /></button>
        </div>
        {items.map(({ label, href, icon: Icon }) => {
          const path = `${base}${href}`;
          const active = pathname === path;
          return <Link key={label} href={path} onClick={() => setMobileOpen(false)} className={`mx-2 mb-1 flex h-12 items-center gap-3 rounded border-l-2 px-4 text-sm font-bold ${active ? "border-[#e50914] bg-white/12 text-white" : "border-transparent text-[#b3b3b3] hover:bg-white/8 hover:text-white"}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && label}</Link>;
        })}
      </aside>
      <main className={`${collapsed ? "lg:ml-[68px]" : "lg:ml-[236px]"} relative min-w-0 overflow-x-hidden pt-16 transition-[margin]`}>{children}</main>
    </div>
  );
}

function KeyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m12 12 9-9M15 9l3 3M18 6l3 3" /></svg>;
}

function ChatIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>;
}

function PlanIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
}
