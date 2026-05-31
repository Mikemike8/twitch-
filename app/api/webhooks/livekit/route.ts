import { db } from "@/lib/db";
import { getWebhookReceiver } from "@/lib/livekit";

export async function POST(request: Request) {
  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    return new Response("Authorization header is required", { status: 400 });
  }

  let event;

  try {
    event = await getWebhookReceiver().receive(await request.text(), authorization);
  } catch {
    return new Response("Invalid LiveKit webhook", { status: 400 });
  }

  const ingressId = event.ingressInfo?.ingressId;

  if (!ingressId) {
    return new Response("Webhook ignored", { status: 200 });
  }

  if (event.event === "ingress_started") {
    await db.stream.updateMany({
      where: { ingressId },
      data: { isLive: true },
    });
  }

  if (event.event === "ingress_ended") {
    await db.stream.updateMany({
      where: { ingressId },
      data: { isLive: false },
    });
  }

  return new Response("Webhook processed", { status: 200 });
}
