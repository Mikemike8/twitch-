import { IngressInput } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { getIngressClient } from "@/lib/livekit";

export type IngressType = "RTMP_INPUT" | "WHIP_INPUT";

export async function resetIngresses(userId: string) {
  const stream = await db.stream.findUnique({
    where: { userId },
  });

  if (!stream?.ingressId) return;

  await getIngressClient().deleteIngress(stream.ingressId);
}

export async function createIngress(inputType: IngressType) {
  const self = await getSelf();
  const ingressClient = getIngressClient();
  const stream = await db.stream.findUnique({
    where: { userId: self.id },
  });

  if (!stream) throw new Error("Stream was not found");

  if (stream.ingressId) await resetIngresses(self.id);

  const type = inputType === "RTMP_INPUT" ? IngressInput.RTMP_INPUT : IngressInput.WHIP_INPUT;
  const ingress = await ingressClient.createIngress(type, {
    name: self.username,
    roomName: self.id,
    participantIdentity: self.id,
    participantName: self.username,
    enableTranscoding: type === IngressInput.RTMP_INPUT,
  });

  await db.stream.update({
    where: { id: stream.id },
    data: {
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    },
  });

  return ingress;
}
