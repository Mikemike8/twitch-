"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { updateUserBio } from "@/lib/user-service";
import { requireBoundedText } from "@/lib/validation";

export async function onUpdateBio(bio: string) {
  const self = await getSelf();
  await enforceActionRateLimit("profile-update", self.id, 30);
  const user = await updateUserBio(requireBoundedText(bio, "bio", true));
  await writeAuditLog(self.id, "update_profile", user.id, { fields: ["bio"] });
  revalidatePath(`/${user.username}`);
  revalidatePath(`/u/${user.username}`);
  return user;
}
