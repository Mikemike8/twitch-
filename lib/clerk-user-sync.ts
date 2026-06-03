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

  if (!clerkUser || clerkUser.id !== externalUserId) {
    throw new Error("Authenticated user could not be loaded from Clerk");
  }

  const preferredUsername = publicUsername(clerkUser.username, clerkUser.id);
  const existingUser = await db.user.findUnique({ where: { externalUserId: clerkUser.id } });
  const shouldUpdateUsername = !existingUser || (isGeneratedPublicUsername(existingUser.username) && preferredUsername !== existingUser.username);
  const username = shouldUpdateUsername
    ? await availableUsername(preferredUsername, clerkUser.id)
    : existingUser.username;

  const user = await db.user.upsert({
    where: { externalUserId: clerkUser.id },
    create: {
      externalUserId: clerkUser.id,
      username,
      imageUrl: clerkUser.imageUrl,
      stream: {
        create: {
          name: `${username}'s stream`,
        },
      },
    },
    update: {
      ...(shouldUpdateUsername ? { username } : {}),
      imageUrl: clerkUser.imageUrl,
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
