"use server";

import { revalidatePath } from "next/cache";
import type { Stream } from "@/lib/generated/prisma/client";
import { updateStream } from "@/lib/stream-service";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { sanitizeStreamSettingsUpdate } from "@/lib/settings-validation";

export async function onUpdateStream(values: Partial<Pick<
  Stream,
  "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly"
>>) {
  const update = sanitizeStreamSettingsUpdate(values);
  const self = await getSelf();
  await enforceActionRateLimit("stream-update", self.id, 60);
  const stream = await updateStream(update);
  await writeAuditLog(self.id, "update_stream", stream.id, { fields: Object.keys(update) });
  revalidatePath(`/u/${stream.userId}`);
  return stream;
}
