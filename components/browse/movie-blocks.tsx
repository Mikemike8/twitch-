"use client";

import Link from "next/link";
import { catalogTitle } from "@/components/browse/catalog-utils";
import { CatalogArtwork } from "@/components/browse/catalog-media";
import type { Channel } from "@/lib/channels";

export type MovieBlockVariant = "first" | "default" | "top10";

export type MovieContinueWatchingItem = {
  channel: Channel;
  episodeCode: string;
  episodeId: string;
  episodeTitle: string;
  progressPercent: number;
};

function ArgusMark({ className = "" }: { className?: string }) {
  return (
    <span className={`${className} grid h-5 w-3 place-items-center rounded-[1px] bg-[#e50914] text-[10px] font-black leading-none text-white`}>
      A
    </span>
  );
}

function StatusLabel({ children }: { children: string }) {
  return (
    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-[2px] bg-[#e50914] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {children}
    </span>
  );
}

function TopTenCorner() {
  return (
    <span className="absolute right-0 top-0 flex h-8 w-6 flex-col items-center justify-center rounded-tr-[2px] bg-[#e50914] text-[8px] font-black uppercase leading-[0.8] text-white">
      <span>Top</span>
      <span className="text-[13px] leading-none">10</span>
    </span>
  );
}

function MovieCard({ channel, index, onOpen }: { channel: Channel; index: number; onOpen: (channel: Channel) => void }) {
  const label = index % 5 === 2 ? "Leaving Soon" : index % 3 === 0 ? "Recently Added" : index % 7 === 0 ? "New Season" : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(channel)}
      aria-label={`Watch ${catalogTitle(channel, index)}`}
      className="group relative h-[123px] w-[218px] shrink-0 overflow-hidden rounded-[2px] bg-[#333] text-left transition duration-200 hover:z-10 hover:scale-[1.04] focus:z-10 focus:scale-[1.04] focus:outline-none"
    >
      <CatalogArtwork channel={channel} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/36 via-transparent to-black/10 opacity-0 transition group-hover:opacity-100" />
      <ArgusMark className="absolute left-1.5 top-1.5" />
      {index % 4 === 3 && <TopTenCorner />}
      {label && <StatusLabel>{label}</StatusLabel>}
    </button>
  );
}

function RankedMovieCard({ channel, index, onOpen }: { channel: Channel; index: number; onOpen: (channel: Channel) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(channel)}
      aria-label={`Watch ${catalogTitle(channel, index)}`}
      className="group relative flex h-[154px] w-[215px] shrink-0 items-end text-left transition duration-200 hover:z-10 hover:scale-[1.03] focus:z-10 focus:scale-[1.03] focus:outline-none"
    >
      <span className="absolute bottom-[-18px] left-0 text-[204px] font-black leading-none text-transparent [-webkit-text-stroke:2px_#676767]">
        {index + 1}
      </span>
      <span className="relative ml-[106px] block h-[154px] w-[109px] overflow-hidden rounded-r-[2px] bg-[#333]">
        <CatalogArtwork channel={channel} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
        <ArgusMark className="absolute left-1 top-1" />
        {index < 2 && <StatusLabel>Recently Added</StatusLabel>}
      </span>
    </button>
  );
}

export function MovieBlockRail({
  title,
  channels,
  variant = "default",
  id,
  onOpen,
}: {
  title: string;
  channels: Channel[];
  variant?: MovieBlockVariant;
  id?: string;
  onOpen: (channel: Channel) => void;
}) {
  if (!channels.length) return null;

  const isFirst = variant === "first";
  const isTop10 = variant === "top10";
  const items = channels.slice(0, isTop10 ? 10 : 18);

  return (
    <section
      id={id}
      className={`relative hidden scroll-mt-24 lg:block ${isFirst ? "-mx-7 -mt-28 bg-gradient-to-b from-transparent via-[#141414]/85 to-[#141414] px-7 pb-[46px] pt-[110px]" : "mt-9"}`}
    >
      <div className="mb-[15px] flex h-[18px] items-center justify-between pl-[31px] xl:pl-[51px]">
        <h2 className="truncate text-xl font-bold leading-[18px] text-[#e5e5e5]">{title}</h2>
        {!isTop10 && (
          <Link href={`/search?term=${encodeURIComponent(title)}`} className="pr-7 text-xs font-bold text-[#b3b3b3] transition hover:text-white xl:pr-12">
            See all
          </Link>
        )}
      </div>
      <div className="scroll-fade-x flex gap-[6px] overflow-x-auto pl-[31px] pr-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:pl-[51px] xl:pr-12">
        {items.map((channel, index) => (
          isTop10
            ? <RankedMovieCard key={`${title}-${channel.username}-${index}`} channel={channel} index={index} onOpen={onOpen} />
            : <MovieCard key={`${title}-${channel.username}-${index}`} channel={channel} index={index} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

export function ContinueWatchingMovieBlock({ items, onOpen }: { items: MovieContinueWatchingItem[]; onOpen: (channel: Channel) => void }) {
  if (!items.length) return null;

  return (
    <section id="continue-watching" className="relative mt-9 hidden scroll-mt-24 lg:block">
      <div className="mb-[15px] h-[18px] pl-[31px] xl:pl-[51px]">
        <h2 className="truncate text-xl font-bold leading-[18px] text-[#e5e5e5]">Continue Watching</h2>
      </div>
      <div className="scroll-fade-x flex gap-[6px] overflow-x-auto pl-[31px] pr-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:pl-[51px] xl:pr-12">
        {items.map((item) => (
          <button
            key={item.episodeId}
            type="button"
            onClick={() => onOpen(item.channel)}
            className="group w-[218px] shrink-0 text-left transition duration-200 hover:z-10 hover:scale-[1.04] focus:z-10 focus:scale-[1.04] focus:outline-none"
          >
            <span className="relative block h-[123px] overflow-hidden rounded-[2px] bg-[#333]">
              <CatalogArtwork channel={item.channel} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/35">
                <i className="block h-full bg-[#e50914]" style={{ width: `${item.progressPercent}%` }} />
              </span>
            </span>
            <strong className="mt-2 block truncate text-sm font-semibold text-white">{item.channel.catalogTitle ?? item.channel.displayName}</strong>
            <span className="mt-1 block truncate text-xs font-semibold text-[#b3b3b3]">{item.episodeCode} {item.episodeTitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
