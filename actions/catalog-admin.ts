"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { requireBoundedText } from "@/lib/validation";

export async function onSaveCatalogEpisode(formData: FormData) {
  const self = await getSelf();
  await enforceActionRateLimit("catalog-admin", self.id, 30);

  const title = requireBoundedText(String(formData.get("title") ?? ""), "creatorFilmTitle");
  const episodeTitle = requireBoundedText(String(formData.get("episodeTitle") ?? ""), "creatorFilmTitle");
  const description = requireBoundedText(String(formData.get("description") ?? ""), "creatorFilmDescription", true);
  const category = requireBoundedText(String(formData.get("category") ?? "Anime"), "creatorFilmTitle", true) || "Anime";
  const posterUrl = normalizeOptionalUrl(String(formData.get("posterUrl") ?? ""));
  const muxPlaybackId = normalizeMuxPlaybackId(String(formData.get("muxPlaybackId") ?? ""));
  const seasonNumber = boundedPositiveInteger(String(formData.get("seasonNumber") ?? "1"), "seasonNumber");
  const episodeNumber = boundedPositiveInteger(String(formData.get("episodeNumber") ?? "1"), "episodeNumber");
  const slug = slugify(title);

  const catalogTitle = await db.catalogTitle.upsert({
    where: { slug },
    create: {
      category,
      description,
      posterUrl,
      slug,
      title,
      visibility: "PUBLIC",
    },
    update: {
      category,
      description,
      posterUrl,
      title,
      visibility: "PUBLIC",
    },
  });

  const season = await db.season.upsert({
    where: {
      catalogTitleId_number: {
        catalogTitleId: catalogTitle.id,
        number: seasonNumber,
      },
    },
    create: {
      catalogTitleId: catalogTitle.id,
      number: seasonNumber,
    },
    update: {},
  });

  await db.episode.upsert({
    where: {
      seasonId_number: {
        number: episodeNumber,
        seasonId: season.id,
      },
    },
    create: {
      muxPlaybackId,
      number: episodeNumber,
      publishedAt: new Date(),
      seasonId: season.id,
      title: episodeTitle,
    },
    update: {
      muxPlaybackId,
      publishedAt: new Date(),
      title: episodeTitle,
    },
  });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/u/${self.username}/catalog`);
}

function normalizeOptionalUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error("Poster URL must be a valid http or https URL");
  }
}

function normalizeMuxPlaybackId(value: string) {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9_-]{6,160}$/.test(normalized)) throw new Error("Mux playback ID is invalid");
  return normalized;
}

function boundedPositiveInteger(value: string, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 1000) throw new Error(`${field} is invalid`);
  return number;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
