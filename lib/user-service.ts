import { db } from "@/lib/db";

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
