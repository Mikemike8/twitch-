import type { Channel } from "@/lib/channels";

const fallbackCatalogTitles = ["Solo Leveling", "Demon Slayer", "Jujutsu Kaisen", "Attack on Titan", "My Hero Academia", "Chainsaw Man", "One Piece", "Black Clover"];

export function catalogTitle(channel: Channel, index: number) {
  return channel.catalogTitle ?? channel.displayName ?? fallbackCatalogTitles[index % fallbackCatalogTitles.length];
}

export function prioritizePlayableCatalog(left: Channel, right: Channel) {
  if (left.catalogTitle === "Solo Leveling") return -1;
  if (right.catalogTitle === "Solo Leveling") return 1;

  return right.viewers - left.viewers;
}
