import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { resetIngresses } from "@/lib/ingress-service";

type ClerkUserData = {
  id: string;
  username: string | null;
  image_url: string;
};

type ClerkWebhookEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: { id?: string } };

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("CLERK_WEBHOOK_SECRET is not configured", { status: 503 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
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
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const username = event.data.username ?? event.data.id;

    await db.user.upsert({
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
        username,
        imageUrl: event.data.image_url,
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

  return new Response("Webhook processed", { status: 200 });
}
