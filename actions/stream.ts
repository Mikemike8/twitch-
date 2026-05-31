"use server";

import { revalidatePath } from "next/cache";
import type { Stream } from "@/lib/generated/prisma/client";
import { updateStream } from "@/lib/stream-service";

export async function onUpdateStream(values: Partial<Pick<
  Stream,
  "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly" | "thumbnailUrl"
>>) {
  const stream = await updateStream(values);
  revalidatePath(`/u/${stream.userId}`);
  return stream;
}
