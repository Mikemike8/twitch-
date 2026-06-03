import { Webhook } from "svix";
import { db } from "@/lib/db";
import { resetIngresses } from "@/lib/ingress-service";
import { clientRateLimitKey, RateLimitError, rateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { isGeneratedPublicUsername, publicUsername } from "@/lib/public-identity";
import { corsHeaders, preflight, validateOrigin } from "@/lib/cors";
import { assertFreshWebhookEvent } from "@/lib/webhook-idempotency";

type ClerkUserData = {
  id: string;
  username: string | null;
  image_url: string;
};

type ClerkWebhookEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: { id?: string } };

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("CLERK_WEBHOOK_SECRET is not configured", { status: 503 });
  }

  const headerPayload = request.headers;
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  try {
    await rateLimiter.enforce(`clerk-webhook:${clientRateLimitKey(request.headers)}`, 120);
  } catch (error) {
    if (!(error instanceof RateLimitError)) logger.error("webhook.clerk.rate_limiter_unavailable");
    return new Response(error instanceof RateLimitError ? error.message : "Rate limiter is unavailable", { status: error instanceof RateLimitError ? 429 : 503 });
  }

  const body = await request.text();
  let event: ClerkWebhookEvent;

  try {
    event = new Webhook(webhookSecret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    logger.warn("webhook.clerk.invalid_signature");
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    await assertFreshWebhookEvent("clerk", svixId, Number(svixTimestamp) * 1000, body);
  } catch (error) {
    logger.warn("webhook.clerk.skipped", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response("Webhook skipped", { status: 200, headers: corsHeaders(request) });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const username = publicUsername(event.data.username, event.data.id);
    const existingUser = await db.user.findUnique({ where: { externalUserId: event.data.id } });
    const shouldUpdateUsername = !existingUser || (isGeneratedPublicUsername(existingUser.username) && username !== existingUser.username);

    const user = await db.user.upsert({
      where: { externalUserId: event.data.id },
      create: {
        externalUserId: event.data.id,
        username,
        imageUrl: event.data.image_url,
        stream: {
          create: {
            name: `${username}'s stream`,
          },
        },
      },
      update: {
        ...(shouldUpdateUsername ? { username } : {}),
        imageUrl: event.data.image_url,
      },
    });

    await db.stream.updateMany({
      where: {
        userId: user.id,
        name: { contains: event.data.id },
      },
      data: {
        name: `${username}'s stream`,
      },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    const user = await db.user.findUnique({
      where: { externalUserId: event.data.id },
    });

    if (user) {
      try {
        await resetIngresses(user.id);
      } catch {
        // Continue deleting the local account if the remote ingress is already gone.
      }
    }

    await db.user.deleteMany({
      where: { externalUserId: event.data.id },
    });
  }

  return new Response("Webhook processed", { status: 200, headers: corsHeaders(request) });
}

export function OPTIONS(request: Request) {
  return preflight(request);
}
