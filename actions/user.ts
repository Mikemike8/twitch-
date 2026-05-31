"use server";

import { revalidatePath } from "next/cache";
import { updateUserBio } from "@/lib/user-service";

export async function onUpdateBio(bio: string) {
  const user = await updateUserBio(bio.trim());
  revalidatePath(`/${user.username}`);
  revalidatePath(`/u/${user.username}`);
  return user;
}
