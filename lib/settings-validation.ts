import type { Stream } from "@/lib/generated/prisma/client";
import { requireBoundedText } from "./validation.ts";

export type StreamSettingsUpdate = Partial<Pick<
  Stream,
  "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly"
>>;

export function sanitizeStreamSettingsUpdate(values: StreamSettingsUpdate) {
  const update: StreamSettingsUpdate = {};
  if (typeof values.name === "string") update.name = requireBoundedText(values.name, "streamName");
  if (typeof values.isChatEnabled === "boolean") update.isChatEnabled = values.isChatEnabled;
  if (typeof values.isChatDelayed === "boolean") update.isChatDelayed = values.isChatDelayed;
  if (typeof values.isChatFollowersOnly === "boolean") update.isChatFollowersOnly = values.isChatFollowersOnly;
  if (!Object.keys(update).length) throw new Error("No valid stream settings were provided");
  return update;
}
