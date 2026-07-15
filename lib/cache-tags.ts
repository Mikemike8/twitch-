import { revalidateTag } from "next/cache";

export const cacheTags = {
  catalog: "catalog",
  creatorFilms: "creator-films",
  feeds: "feeds",
  recommendations: "recommendations",
} as const;

export function revalidateBrowseCaches() {
  revalidateTag(cacheTags.catalog, "max");
  revalidateTag(cacheTags.creatorFilms, "max");
  revalidateTag(cacheTags.feeds, "max");
  revalidateTag(cacheTags.recommendations, "max");
}
