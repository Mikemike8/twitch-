import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export async function isFollowingUser(userId: string) {
  try {
    const self = await getSelf();

    if (self.id === userId) return true;

    return Boolean(
      await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: self.id,
            followingId: userId,
          },
        },
      }),
    );
  } catch {
    return false;
  }
}

export async function followUser(userId: string) {
  const self = await getSelf();

  if (self.id === userId) throw new Error("Cannot follow yourself");

  return db.follow.create({
    data: {
      followerId: self.id,
      followingId: userId,
    },
    include: { following: true },
  });
}

export async function unfollowUser(userId: string) {
  const self = await getSelf();

  if (self.id === userId) throw new Error("Cannot unfollow yourself");

  const existingFollow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: self.id,
        followingId: userId,
      },
    },
  });

  if (!existingFollow) throw new Error("Follow does not exist");

  return db.follow.delete({
    where: { id: existingFollow.id },
    include: { following: true },
  });
}

export async function getFollowedUsers() {
  const self = await getSelf();

  return db.follow.findMany({
    where: {
      followerId: self.id,
      following: {
        blocking: { none: { blockedId: self.id } },
      },
    },
    include: {
      following: {
        include: {
          stream: true,
        },
      },
    },
  });
}
