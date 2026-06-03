import { createHash } from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isGeneratedPublicUsername, publicUsername } from "@/lib/public-identity";

function suffixFor(value: string) {
  return createHash("md5").update(value).digest("hex").slice(0, 6);
}

async function availableUsername(preferred: string, externalUserId: string) {
  const existing = await db.user.findUnique({ where: { username: preferred } });
  if (!existing || existing.externalUserId === externalUserId) return preferred;

  const suffix = suffixFor(externalUserId);
  const base = preferred.slice(0, Math.max(3, 24 - suffix.length - 1)).replace(/[-_]+$/g, "") || "creator";
  return `${base}-${suffix}`;
}

export async function syncCurrentClerkUser(externalUserId: string) {
  const clerkUser = await currentUser();

  if (clerkUser && clerkUser.id !== externalUserId) {
    throw new Error("Authenticated Clerk user mismatch");
  }

  const preferredUsername = publicUsername(clerkUser?.username, externalUserId);
  const existingUser = await db.user.findUnique({ where: { externalUserId } });
  const shouldUpdateUsername = !existingUser || (isGeneratedPublicUsername(existingUser.username) && preferredUsername !== existingUser.username);
  const username = shouldUpdateUsername
    ? await availableUsername(preferredUsername, externalUserId)
    : existingUser.username;

  const user = await db.user.upsert({
    where: { externalUserId },
    create: {
      externalUserId,
      username,
      imageUrl: clerkUser?.imageUrl ?? "",
      stream: {
        create: {
          name: `${username}'s stream`,
        },
      },
    },
    update: {
      ...(shouldUpdateUsername ? { username } : {}),
      ...(clerkUser?.imageUrl ? { imageUrl: clerkUser.imageUrl } : {}),
    },
  });

  await db.stream.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: `${user.username}'s stream`,
    },
    update: {},
  });

  return user;
}
