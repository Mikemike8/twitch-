import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export function getUserByUsername(username: string) {
  return db.user.findUnique({
    where: { username },
    include: {
      followedBy: true,
      stream: true,
    },
  });
}

export function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function updateUserBio(bio: string) {
  const self = await getSelf();

  return db.user.update({
    where: { id: self.id },
    data: { bio },
  });
}

export async function updateUsername(username: string) {
  const self = await getSelf();
  const existing = await db.user.findUnique({ where: { username } });

  if (existing && existing.id !== self.id) {
    throw new Error("Username is already taken");
  }

  const user = await db.user.update({
    where: { id: self.id },
    data: { username },
  });

  await db.stream.updateMany({
    where: {
      userId: self.id,
      name: `${self.username}'s stream`,
    },
    data: {
      name: `${username}'s stream`,
    },
  });

  return user;
}
