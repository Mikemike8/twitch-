"use client";

import Link from "next/link";
import { Show, SignInButton, SignOutButton, SignUpButton, UserButton } from "@clerk/nextjs";
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
  const navClass = (item: SiteTopbarActive) => item === active ? "bg-white text-black" : "text-[#b7b7c2] hover:bg-white/5 hover:text-white";
  const profileHref = viewerUsername ? `/${viewerUsername}` : "/sign-in";

  return (
    <header className={`${fixed ? "fixed inset-x-0 top-0" : "sticky top-0"} z-40 flex h-[72px] items-center gap-4 border-b border-white/5 ${translucent ? "bg-black/80" : "bg-black/95"} px-8 text-[#f1f1f3] backdrop-blur-xl`}>
      <Link href="/" className="flex items-center gap-2" aria-label="Argus home">
        <BrandLogo className="h-10 w-10 rounded-xl" />
        <span className="hidden text-xl font-black tracking-tight sm:block">ARGUS</span>
      </Link>
      <nav className="ml-4 hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs font-black uppercase tracking-wide xl:flex">
        <Link href="/" className={`rounded-full px-4 py-2 transition ${navClass("home")}`}>Home</Link>
        <Link href="/#movies-series" className={`rounded-full px-4 py-2 transition ${navClass("movies")}`}>Movies & Series</Link>
        <Link href="/#categories" className={`rounded-full px-4 py-2 transition ${navClass("categories")}`}>Categories</Link>
        <Link href="/search" className={`rounded-full px-4 py-2 transition ${navClass("search")}`}>Search</Link>
        <button type="button" className="cursor-not-allowed rounded-full px-4 py-2 text-[#74747f]" title="Downloads are coming soon">Downloads</button>
        <Link href={profileHref} className={`rounded-full px-4 py-2 transition ${navClass("profile")}`}>Profile</Link>
        {onMode && mode && <button type="button" onClick={() => onMode(mode === "following" ? "browse" : "following")} className={`rounded-full px-4 py-2 transition ${mode === "following" ? "bg-[#2554e8] text-white" : "text-[#b7b7c2] hover:bg-white/5 hover:text-white"}`}>My List</button>}
      </nav>
      {canSearch && <form action="/search" className="ml-2 hidden h-10 min-w-[180px] max-w-xs flex-1 items-center rounded-lg border border-white/10 bg-[#18181b] 2xl:flex">
        <input name="term" value={query} maxLength={inputLimits.searchTerm} onChange={(event) => onQuery?.(event.target.value)} placeholder="Search titles, genres" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#858590]" />
        <button type="submit" className="grid w-12 place-items-center text-[#a8a8b3]" aria-label="Search"><SearchIcon className="h-5 w-5" /></button>
      </form>}
      <Link href="/search" className={`${canSearch ? "2xl:hidden" : "lg:ml-auto"} ml-auto grid h-10 w-10 place-items-center rounded-full text-[#c8c8d0] hover:bg-white/5`} aria-label="Search"><SearchIcon className="h-6 w-6" /></Link>
      {clerkConfigured ? (
        <>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton><button className="rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44]">Log in</button></SignInButton>
              <SignUpButton><button className="rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff]">Sign up</button></SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-2">
              {viewerUsername && (
                <>
                  <Link href={`/${viewerUsername}`} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#d4d4dd] hover:bg-white/5 xl:block">Profile</Link>
                  <Link href={`/u/${viewerUsername}`} className="hidden rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff] xl:block">Creator Dashboard</Link>
                </>
              )}
              <SignOutButton><button className="hidden rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44] sm:block">Log out</button></SignOutButton>
              <UserButton />
            </div>
          </Show>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="rounded-lg bg-[#2f2f35] px-3 py-2 text-xs font-bold hover:bg-[#3b3b44]">Log in</Link>
          <Link href="/sign-up" className="hidden rounded-lg bg-[#8b3cff] px-3 py-2 text-xs font-bold hover:bg-[#a45cff] sm:block">Sign up</Link>
        </div>
      )}
    </header>
  );
}
