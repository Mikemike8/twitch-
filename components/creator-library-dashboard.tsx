"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { onCreateCreatorFilm } from "@/actions/creator-library";
import { inputLimits } from "@/lib/validation";

type CreatorFilmListItem = {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  playbackUrl: string | null;
  visibility: "DRAFT" | "PUBLIC";
  updatedAt: string;
};

export function CreatorLibraryDashboard({ initialFilms }: { initialFilms: CreatorFilmListItem[] }) {
  const [films, setFilms] = useState(initialFilms);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [visibility, setVisibility] = useState<"DRAFT" | "PUBLIC">("PUBLIC");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const addFilm = () => {
    setStatus("");
    startTransition(() => {
      onCreateCreatorFilm({ title, description, posterUrl, playbackUrl, visibility })
        .then((film) => {
          setFilms((current) => [film, ...current]);
          setTitle("");
          setDescription("");
          setPosterUrl("");
          setPlaybackUrl("");
          setVisibility("PUBLIC");
          setStatus(film.visibility === "PUBLIC" ? "Film added to Independent Films" : "Draft saved");
        })
        .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Unable to add film"));
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#141414] px-3 py-4 text-white sm:px-6 sm:py-8 lg:px-10">
      <section className="border-b border-white/10 pb-6">
        <p className="text-xs font-black uppercase text-[#e50914]">Creator Library</p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-none sm:text-5xl">Independent films</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b3b3b3]">Add creator-owned films here. Public films feed the Independent Films block on the home page.</p>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,520px)_1fr]">
        <section className="rounded border border-white/10 bg-[#181818] p-4 sm:p-6">
          <h2 className="text-xl font-black">Add a film</h2>
          <label className="mt-5 block text-xs font-bold uppercase text-[#b3b3b3]">Title</label>
          <input value={title} maxLength={inputLimits.creatorFilmTitle} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
          <label className="mt-4 block text-xs font-bold uppercase text-[#b3b3b3]">Description</label>
          <textarea value={description} maxLength={inputLimits.creatorFilmDescription} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
          <label className="mt-4 block text-xs font-bold uppercase text-[#b3b3b3]">Poster URL</label>
          <input value={posterUrl} maxLength={inputLimits.creatorFilmPosterUrl} onChange={(event) => setPosterUrl(event.target.value)} placeholder="https://..." className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm outline-none placeholder:text-[#696969] focus:border-[#e50914]" />
          <label className="mt-4 block text-xs font-bold uppercase text-[#b3b3b3]">Playback or trailer URL</label>
          <input value={playbackUrl} maxLength={inputLimits.creatorFilmPosterUrl} onChange={(event) => setPlaybackUrl(event.target.value)} placeholder="https://..." className="mt-2 w-full rounded border border-white/15 bg-black/55 px-3 py-3 text-sm outline-none placeholder:text-[#696969] focus:border-[#e50914]" />
          <div className="mt-5 grid grid-cols-2 gap-2 rounded bg-black/35 p-1">
            {(["PUBLIC", "DRAFT"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setVisibility(option)} className={`rounded px-3 py-2 text-xs font-black ${visibility === option ? "bg-white text-black" : "text-[#b3b3b3] hover:bg-white/10 hover:text-white"}`}>
                {option === "PUBLIC" ? "Publish" : "Draft"}
              </button>
            ))}
          </div>
          <button type="button" onClick={addFilm} disabled={isPending} className="mt-5 w-full rounded bg-[#e50914] px-4 py-3 text-sm font-black hover:bg-[#f50723] disabled:opacity-50">Add film</button>
          {status && <p className="mt-4 rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d2d2d2]">{status}</p>}
        </section>

        <section className="min-w-0 rounded border border-white/10 bg-[#181818] p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Your films</h2>
              <p className="mt-1 text-xs text-[#808080]">{films.length} total</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {films.map((film) => <FilmCard key={film.id} film={film} />)}
            {!films.length && <p className="rounded border border-dashed border-white/15 p-6 text-sm text-[#b3b3b3]">No films yet. Add one and publish it to place it in the home page Independent Films block.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilmCard({ film }: { film: CreatorFilmListItem }) {
  return (
    <article className="overflow-hidden rounded border border-white/10 bg-black/35">
      <div className="relative aspect-video bg-[#242424]">
        {film.posterUrl ? <Image src={film.posterUrl} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" /> : <div className="grid h-full place-items-center text-3xl font-black text-white/35">{film.title.slice(0, 2).toUpperCase()}</div>}
        <span className={`absolute left-2 top-2 rounded px-2 py-1 text-[10px] font-black ${film.visibility === "PUBLIC" ? "bg-[#e50914] text-white" : "bg-white text-black"}`}>{film.visibility}</span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-black">{film.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#b3b3b3]">{film.description || "No description yet."}</p>
        {film.playbackUrl && <p className="mt-3 truncate text-[11px] font-semibold text-[#808080]">{film.playbackUrl}</p>}
      </div>
    </article>
  );
}
