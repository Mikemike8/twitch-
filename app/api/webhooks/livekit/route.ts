import { db } from "@/lib/db";
import { getWebhookReceiver } from "@/lib/livekit";
import { clientRateLimitKey, RateLimitError, rateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { corsHeaders, preflight, validateOrigin } from "@/lib/cors";
import { assertFreshWebhookEvent } from "@/lib/webhook-idempotency";
import { revalidateBrowseCaches } from "@/lib/cache-tags";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    return new Response("Authorization header is required", { status: 400 });
  }

  try {
    await rateLimiter.enforce(`livekit-webhook:${clientRateLimitKey(request.headers)}`, 240);
  } catch (error) {
    if (!(error instanceof RateLimitError)) logger.error("webhook.livekit.rate_limiter_unavailable");
    return new Response(error instanceof RateLimitError ? error.message : "Rate limiter is unavailable", { status: error instanceof RateLimitError ? 429 : 503 });
  }

  const body = await request.text();
  let event;

  try {
    event = await getWebhookReceiver().receive(body, authorization);
  } catch {
    logger.warn("webhook.livekit.invalid_signature");
    return new Response("Invalid LiveKit webhook", { status: 400 });
  }

  const timestampMs = Number(event.createdAt) * 1000;
  const eventId = event.id ?? `${event.event}:${event.ingressInfo?.ingressId ?? "none"}:${event.createdAt ?? "unknown"}`;

  try {
    await assertFreshWebhookEvent("livekit", eventId, timestampMs, body);
  } catch (error) {
    logger.warn("webhook.livekit.skipped", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response("Webhook skipped", { status: 200, headers: corsHeaders(request) });
  }

  const ingressId = event.ingressInfo?.ingressId;

  if (!ingressId) {
    return new Response("Webhook ignored", { status: 200, headers: corsHeaders(request) });
  }

  if (event.event === "ingress_started") {
    await db.stream.updateMany({
      where: { ingressId },
      data: { isLive: true },
    });
    revalidateBrowseCaches();
  }

  if (event.event === "ingress_ended") {
    await db.stream.updateMany({
      where: { ingressId },
      data: { isLive: false },
    });
    revalidateBrowseCaches();
  }

  return new Response("Webhook processed", { status: 200, headers: corsHeaders(request) });
}
