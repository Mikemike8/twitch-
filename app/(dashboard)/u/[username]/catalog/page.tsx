import { onSaveCatalogEpisode } from "@/actions/catalog-admin";
import { db } from "@/lib/db";

export default async function CreatorCatalogPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const titles = await db.catalogTitle.findMany({
    include: {
      seasons: {
        include: { episodes: { orderBy: { number: "asc" } } },
        orderBy: { number: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  }).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[#e50914]">Creator catalog</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Catalog Episodes</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#b3b3b3]">
          Add playable catalog episodes with Mux playback IDs. Public titles appear in browse and search.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded border border-white/10 bg-[#181818] p-5">
          <h2 className="text-xl font-bold">Current Anime</h2>
          <div className="mt-4 space-y-3">
            {titles.map((title) => {
              const episodes = title.seasons.flatMap((season) => season.episodes.map((episode) => ({ ...episode, seasonNumber: season.number })));
              return (
                <article key={title.id} className="rounded border border-white/10 bg-black/28 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{title.title}</h3>
                    <span className="rounded bg-white/10 px-3 py-1 text-xs font-bold">{episodes.length} episodes</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">{title.description ?? "No description yet."}</p>
                  <ol className="mt-4 space-y-2 text-xs text-[#d2d2d2]">
                    {episodes.map((episode) => (
                      <li key={episode.id} className="break-all rounded bg-white/[0.06] px-3 py-2">
                        S{episode.seasonNumber} E{episode.number}: {episode.title} {episode.muxPlaybackId ? <code className="ml-2">{episode.muxPlaybackId}</code> : <span className="ml-2 text-red-300">No video</span>}
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
            {!titles.length && <p className="rounded border border-dashed border-white/15 p-5 text-sm text-[#b3b3b3]">No database-backed catalog titles yet.</p>}
          </div>
        </div>

        <div className="rounded border border-white/10 bg-[#181818] p-5">
          <h2 className="text-xl font-bold">Add or update episode</h2>
          <form action={onSaveCatalogEpisode} className="mt-4 space-y-3">
            <input name="title" placeholder="Series title" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <textarea name="description" placeholder="Series description" rows={3} className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <input name="category" defaultValue="Anime" placeholder="Category" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <input name="posterUrl" placeholder="Poster URL, optional" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <div className="grid grid-cols-2 gap-3">
              <input name="seasonNumber" type="number" min="1" defaultValue="1" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
              <input name="episodeNumber" type="number" min="1" defaultValue="1" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            </div>
            <input name="episodeTitle" placeholder="Episode title" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <input name="muxPlaybackId" placeholder="Mux playback ID" className="w-full rounded border border-white/15 bg-black px-3 py-3 text-sm outline-none focus:border-[#e50914]" />
            <button type="submit" className="w-full rounded bg-[#e50914] px-4 py-3 text-sm font-black hover:bg-[#f50723]">Save episode</button>
          </form>

          <p className="mt-5 text-xs leading-5 text-[#8c8c8c]">
            Signed in as @{username}. Upload the video in Mux first, then paste the playback ID here.
          </p>
        </div>
      </section>
    </div>
  );
}
