"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { revalidateBrowseCaches } from "@/lib/cache-tags";
import { createCreatorFilm } from "@/lib/creator-film-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { requireBoundedText } from "@/lib/validation";

export async function onCreateCreatorFilm(input: {
  description?: string;
  playbackUrl?: string;
  posterUrl?: string;
  title: string;
  visibility?: "DRAFT" | "PUBLIC";
}) {
  const self = await getSelf();
  await enforceActionRateLimit("creator-library", self.id, 20);

  const title = requireBoundedText(input.title, "creatorFilmTitle");
  const description = requireBoundedText(input.description ?? "", "creatorFilmDescription", true);
  const posterUrl = normalizeOptionalUrl(input.posterUrl ?? "", "poster URL");
  const playbackUrl = normalizeOptionalUrl(input.playbackUrl ?? "", "playback URL");
  const visibility = input.visibility === "DRAFT" ? "DRAFT" : "PUBLIC";
  const film = await createCreatorFilm(self.id, { title, description, posterUrl, playbackUrl, visibility });

  await writeAuditLog(self.id, "create_creator_film", film.id, { visibility });
  if (visibility === "PUBLIC") revalidateBrowseCaches();
  revalidatePath("/");
  revalidatePath(`/u/${self.username}/library`);
  return {
    id: film.id,
    title: film.title,
    description: film.description,
    posterUrl: film.posterUrl,
    playbackUrl: film.playbackUrl,
    visibility: film.visibility,
    updatedAt: film.updatedAt.toISOString(),
  };
}

function normalizeOptionalUrl(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid http or https URL`);
  }
}
