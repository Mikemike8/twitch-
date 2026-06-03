import type { Stream } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { secretStorage } from "@/lib/secret-storage";

export function getStreamByUserId(userId: string) {
  return db.stream.findUnique({
    where: { userId },
  });
}

export async function getSelfStream() {
  const self = await getSelf();
  const stream = await db.stream.findUnique({
    where: { userId: self.id },
  });
  return stream ? { ...stream, streamKey: secretStorage.decrypt(stream.streamKey) ?? null } : null;
}

export async function updateStream(values: Partial<Pick<
  Stream,
  "name" | "isChatEnabled" | "isChatDelayed" | "isChatFollowersOnly" | "thumbnailUrl"
>>) {
  const self = await getSelf();

  return db.stream.update({
    where: { userId: self.id },
    data: values,
  });
}
