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
