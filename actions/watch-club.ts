"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { createWatchClub, getConfiguredLiveTvChannels } from "@/lib/live-tv-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { requireBoundedText } from "@/lib/validation";

export async function onCreateWatchClub(formData: FormData) {
  const self = await getSelf();
  await enforceActionRateLimit("watch-club", self.id, 12, 60 * 60 * 1000, 48);

  const title = requireBoundedText(String(formData.get("title") ?? ""), "watchClubTitle");
  const description = requireBoundedText(String(formData.get("description") ?? ""), "watchClubDescription", true);
  const channelId = String(formData.get("channelId") ?? "");
  const programId = String(formData.get("programId") ?? "") || null;
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const channels = getConfiguredLiveTvChannels();

  if (!channels.some((channel) => channel.id === channelId)) throw new Error("Channel is invalid");
  if (!Number.isFinite(startsAt.getTime())) throw new Error("Start time is invalid");

  await createWatchClub({ channelId, description, programId, startsAt, title, userId: self.id });
  revalidatePath("/live");
}
