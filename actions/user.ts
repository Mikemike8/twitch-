"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { updateUserBio, updateUsername } from "@/lib/user-service";
import { requireBoundedText, requireUsername } from "@/lib/validation";

export async function onUpdateBio(bio: string) {
  const self = await getSelf();
  await enforceActionRateLimit("profile-update", self.id, 30);
  const user = await updateUserBio(requireBoundedText(bio, "bio", true));
  await writeAuditLog(self.id, "update_profile", user.id, { fields: ["bio"] });
  revalidatePath(`/${user.username}`);
  revalidatePath(`/u/${user.username}`);
  return user;
}

export async function onUpdateUsername(username: string) {
  const self = await getSelf();
  await enforceActionRateLimit("profile-update", self.id, 10);
  const previousUsername = self.username;
  const user = await updateUsername(requireUsername(username));
  await writeAuditLog(self.id, "update_profile", user.id, { fields: ["username"] });
  revalidatePath(`/${previousUsername}`);
  revalidatePath(`/u/${previousUsername}`);
  revalidatePath(`/${user.username}`);
  revalidatePath(`/u/${user.username}`);
  return user;
}
