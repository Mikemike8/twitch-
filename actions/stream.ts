"use server";

import { revalidatePath } from "next/cache";
import type { Stream } from "@/lib/generated/prisma/client";
import { updateStream } from "@/lib/stream-service";
import { requireBoundedText } from "@/lib/validation";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { enforceActionRateLimit } from "@/lib/rate-limit";

export async function onUpdateStream(values: Partial<Pick<
  Stream,
  "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly"
>>) {
  const update: Partial<Pick<Stream, "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly">> = {};
  if (typeof values.name === "string") update.name = requireBoundedText(values.name, "streamName");
  if (typeof values.isChatEnabled === "boolean") update.isChatEnabled = values.isChatEnabled;
  if (typeof values.isChatDelayed === "boolean") update.isChatDelayed = values.isChatDelayed;
  if (typeof values.isChatFollowersOnly === "boolean") update.isChatFollowersOnly = values.isChatFollowersOnly;
  const self = await getSelf();
  await enforceActionRateLimit("stream-update", self.id, 60);
  const stream = await updateStream(update);
  await writeAuditLog(self.id, "update_stream", stream.id, { fields: Object.keys(update) });
  revalidatePath(`/u/${stream.userId}`);
  return stream;
}
