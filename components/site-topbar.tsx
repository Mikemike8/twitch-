"use client";

import Link from "next/link";
import { Show, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
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
  const profileHref = viewerUsername ? `/${viewerUsername}` : "/sign-in";

  return (
    <header className={`${fixed ? "fixed inset-x-0 top-0" : "sticky top-0"} z-40 flex h-[68px] items-center gap-5 border-b border-white/10 ${translucent ? "bg-black/72" : "bg-black/88"} px-8 text-white backdrop-blur-xl`}>
      <Link href="/" className="flex items-center gap-2" aria-label="Argus home">
        <BrandLogo className="h-9 w-9 rounded" />
        <span className="hidden text-2xl font-black tracking-normal text-[#e50914] sm:block">ARGUS</span>
      </Link>
      <nav className="ml-3 hidden items-center gap-6 text-sm font-medium xl:flex">
        <Link href="/" className={`transition ${navClass("home")}`}>Home</Link>
        <Link href="/#movies-series" className={`transition ${navClass("movies")}`}>Movies & Series</Link>
        <Link href="/#categories" className={`transition ${navClass("categories")}`}>Categories</Link>
        <Link href="/search" className={`transition ${navClass("search")}`}>Search</Link>
        <button type="button" className="cursor-not-allowed text-[#777]" title="Downloads are coming soon">Downloads</button>
        <Link href={profileHref} className={`transition ${navClass("profile")}`}>Profile</Link>
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
              {viewerUsername && (
                <>
                  <Link href={`/${viewerUsername}`} className="hidden rounded border border-white/15 px-3 py-2 text-xs font-bold text-[#b3b3b3] hover:bg-white/10 hover:text-white xl:block">Profile</Link>
                  <Link href={`/u/${viewerUsername}`} className="hidden rounded bg-[#e50914] px-3 py-2 text-xs font-bold hover:bg-[#f50723] xl:block">Creator Dashboard</Link>
                </>
              )}
              <SignOutButton><button className="hidden rounded bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 sm:block">Log out</button></SignOutButton>
              <UserButton />
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
