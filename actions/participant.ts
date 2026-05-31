"use server";

import { getSelf } from "@/lib/auth-service";
import { getRoomServiceClient } from "@/lib/livekit";

export async function onKickParticipant(identity: string) {
  const self = await getSelf();
  await getRoomServiceClient().removeParticipant(self.id, identity);
}
