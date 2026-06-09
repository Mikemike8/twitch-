import { muxEpisodePlaybackIds, seriesDescriptions } from "@/lib/catalog-episodes";

export default async function CreatorCatalogPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const titles = Object.keys(muxEpisodePlaybackIds);

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[#e50914]">Creator catalog</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Mux Episodes</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#b3b3b3]">
          Use this page as the simple map for adding playable episodes. Runtime playback reads from
          <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">lib/catalog-episodes.ts</code>.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded border border-white/10 bg-[#181818] p-5">
          <h2 className="text-xl font-bold">Current Anime</h2>
          <div className="mt-4 space-y-3">
            {titles.map((title) => {
              const episodes = muxEpisodePlaybackIds[title] ?? [];
              return (
                <article key={title} className="rounded border border-white/10 bg-black/28 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <span className="rounded bg-white/10 px-3 py-1 text-xs font-bold">{episodes.length} Mux episodes</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">{seriesDescriptions[title] ?? "No description yet."}</p>
                  <ol className="mt-4 space-y-2 text-xs text-[#d2d2d2]">
                    {episodes.map((playbackId, index) => (
                      <li key={playbackId} className="break-all rounded bg-white/[0.06] px-3 py-2">
                        S1 E{index + 1}: <code>{playbackId}</code>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-white/10 bg-[#181818] p-5">
          <h2 className="text-xl font-bold">Add Episodes</h2>
          <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">Paste new Mux playback IDs into the title array in order.</p>
          <pre className="mt-4 overflow-x-auto rounded bg-black p-4 text-xs leading-6 text-[#e5e5e5]">{`// Add another episode to an existing anime:
"Solo Leveling": [
  "PLAYBACK_ID_FOR_S1_E1",
  "PLAYBACK_ID_FOR_S1_E2",
  "PLAYBACK_ID_FOR_S1_E3" // new Mux episode
],

// Bring on a new anime:
"New Anime Title": [
  "PLAYBACK_ID_FOR_S1_E1"
]`}</pre>

          <div className="mt-6 rounded border border-[#e50914]/35 bg-[#e50914]/10 p-4">
            <h3 className="text-sm font-black uppercase text-[#ffb3b8]">Workflow</h3>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-[#f1f1f3]">
              <li>1. Upload the video in Mux.</li>
              <li>2. Copy the playback ID, not the asset ID.</li>
              <li>3. Add it to <code>muxEpisodePlaybackIds</code> in <code>lib/catalog-episodes.ts</code>.</li>
              <li>4. Add title metadata to the catalog seed/database if it is a new anime.</li>
              <li>5. Run <code>npm run build</code> before shipping.</li>
            </ol>
          </div>

          <p className="mt-5 text-xs leading-5 text-[#8c8c8c]">
            Signed in as @{username}. This page is a guide for the current code-backed catalog. A database-backed editor can replace this once the catalog admin workflow is ready.
          </p>
        </div>
      </section>
    </div>
  );
}
