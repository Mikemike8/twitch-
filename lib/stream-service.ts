import type { Stream } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export function getStreamByUserId(userId: string) {
  return db.stream.findUnique({
    where: { userId },
  });
}

export async function getSelfStream() {
  const self = await getSelf();
  return db.stream.findUnique({
    where: { userId: self.id },
  });
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
