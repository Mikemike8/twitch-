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
    <div className="min-h-screen bg-[#0e0e10]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#29292e] bg-[#18181b] px-3 sm:gap-4 sm:px-4">
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded hover:bg-[#303038] lg:hidden" aria-label="Open creator navigation"><MenuIcon className="h-5 w-5" /></button>
        <Link href="/" aria-label="Argus home"><BrandLogo /></Link>
        <span className="truncate font-black"><span className="hidden sm:inline">Creator </span>Dashboard</span>
        <Link href="/" className="ml-auto rounded bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44]">Exit</Link>
      </header>
      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 top-14 z-30 bg-black/60 lg:hidden" aria-label="Close creator navigation" />}
      <aside className={`${collapsed ? "lg:w-[60px]" : "lg:w-[220px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed bottom-0 left-0 top-14 z-30 w-[min(280px,85vw)] border-r border-[#29292e] bg-[#1f1f23] transition-[transform,width] lg:translate-x-0`}>
        <div className="flex h-12 items-center px-3">
          {!collapsed && <p className="truncate text-xs font-bold uppercase text-[#adadb8]">Creator tools</p>}
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded p-2 hover:bg-[#303038] lg:hidden" aria-label="Close creator navigation">×</button>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden rounded p-2 hover:bg-[#303038] lg:block" aria-label="Toggle creator navigation"><ChevronIcon className={`h-4 w-4 ${collapsed ? "rotate-180" : ""}`} /></button>
        </div>
        {items.map(({ label, href, icon: Icon }) => {
          const path = `${base}${href}`;
          const active = pathname === path;
          return <Link key={label} href={path} onClick={() => setMobileOpen(false)} className={`flex h-11 items-center gap-3 px-5 text-sm font-semibold ${active ? "bg-[#303038] text-white" : "text-[#adadb8] hover:bg-[#29292e] hover:text-white"}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && label}</Link>;
        })}
      </aside>
      <main className={`${collapsed ? "lg:ml-[60px]" : "lg:ml-[220px]"} pt-14 transition-[margin]`}>{children}</main>
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
