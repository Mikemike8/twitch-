"use client";

import Link from "next/link";
import { Show, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { SearchIcon } from "@/components/icons";
import { inputLimits } from "@/lib/validation";

export type SiteTopbarMode = "browse" | "following";
type SiteTopbarActive = "home" | "movies" | "categories" | "search" | "profile";

export function SiteTopbar({
  query = "",
  onQuery,
  clerkConfigured,
  viewerUsername,
  mode,
  onMode,
  active = "home",
  fixed = false,
  translucent = false,
}: {
  query?: string;
  onQuery?: (value: string) => void;
  clerkConfigured: boolean;
  viewerUsername?: string;
  mode?: SiteTopbarMode;
  onMode?: (mode: SiteTopbarMode) => void;
  active?: SiteTopbarActive;
  fixed?: boolean;
  translucent?: boolean;
}) {
  const canSearch = Boolean(onQuery);
  const navClass = (item: SiteTopbarActive) => item === active ? "text-white" : "text-[#b3b3b3] hover:text-white";
  const profileInitial = (viewerUsername?.slice(0, 1) || "A").toUpperCase();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const chromeClass = scrolled
    ? `border-white/10 ${translucent ? "bg-black/72" : "bg-black/88"} backdrop-blur-xl shadow-[0_12px_34px_rgba(0,0,0,0.28)]`
    : "border-transparent bg-transparent backdrop-blur-none";

  return (
    <header className={`${fixed ? "fixed inset-x-0 top-0" : "sticky top-0"} z-40 flex h-[68px] items-center gap-5 border-b px-8 text-white transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${chromeClass}`}>
      <Link href="/" className="flex items-center gap-2" aria-label="Argus home">
        <BrandLogo className="h-9 w-auto" />
      </Link>
      <nav className="ml-3 hidden items-center gap-6 text-sm font-medium xl:flex">
        <Link href="/" className={`transition ${navClass("home")}`}>Home</Link>
        <Link href="/#movies-series" className={`transition ${navClass("movies")}`}>Movies & Series</Link>
        <Link href="/#categories" className={`transition ${navClass("categories")}`}>Categories</Link>
        <Link href="/search" className={`transition ${navClass("search")}`}>Search</Link>
        <button type="button" className="cursor-not-allowed text-[#777]" title="Downloads are coming soon">Downloads</button>
        {onMode && mode && <button type="button" onClick={() => onMode(mode === "following" ? "browse" : "following")} className={`transition ${mode === "following" ? "text-white" : "text-[#b3b3b3] hover:text-white"}`}>My List</button>}
      </nav>
      {canSearch && <form action="/search" className="ml-2 hidden h-10 min-w-[180px] max-w-xs flex-1 items-center rounded border border-white/30 bg-black/60 2xl:flex">
        <input name="term" value={query} maxLength={inputLimits.searchTerm} onChange={(event) => onQuery?.(event.target.value)} placeholder="Search titles, genres" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#808080]" />
        <button type="submit" className="grid w-12 place-items-center text-[#b3b3b3]" aria-label="Search"><SearchIcon className="h-5 w-5" /></button>
      </form>}
      <Link href="/search" className={`${canSearch ? "2xl:hidden" : "lg:ml-auto"} ml-auto grid h-10 w-10 place-items-center text-[#b3b3b3] hover:text-white`} aria-label="Search"><SearchIcon className="h-6 w-6" /></Link>
      {clerkConfigured ? (
        <>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton><button className="rounded bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/20">Log in</button></SignInButton>
              <Link href="/sign-up" className="rounded bg-[#e50914] px-3 py-2 text-xs font-bold hover:bg-[#f50723]">Sign up</Link>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-2">
              {viewerUsername ? (
                <details className="group relative">
                  <summary className="flex h-9 list-none items-center gap-2 rounded text-sm font-bold text-white marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="grid h-8 w-8 place-items-center rounded bg-[#e50914] text-sm font-black text-white">{profileInitial}</span>
                    <span className="hidden text-[#b3b3b3] group-open:rotate-180 sm:inline">⌄</span>
                  </summary>
                  <div className="absolute right-0 top-11 w-56 overflow-hidden rounded border border-white/15 bg-black/95 py-2 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                    <Link href={`/${viewerUsername}`} className="block px-4 py-3 text-sm font-bold text-white hover:bg-white/10">Profile</Link>
                    <Link href="/search" className="block px-4 py-3 text-sm text-[#b3b3b3] hover:bg-white/10 hover:text-white">Search</Link>
                    <Link href="/" className="block px-4 py-3 text-sm text-[#b3b3b3] hover:bg-white/10 hover:text-white">Home</Link>
                    <div className="my-2 h-px bg-white/10" />
                    <SignOutButton><button className="block w-full px-4 py-3 text-left text-sm text-[#b3b3b3] hover:bg-white/10 hover:text-white">Log out</button></SignOutButton>
                  </div>
                </details>
              ) : (
                <UserButton />
              )}
            </div>
          </Show>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="rounded bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15">Log in</Link>
          <Link href="/sign-up" className="hidden rounded bg-[#e50914] px-3 py-2 text-xs font-bold hover:bg-[#f50723] sm:block">Sign up</Link>
        </div>
      )}
    </header>
  );
}
