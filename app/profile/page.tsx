import { redirect } from "next/navigation";
import { getOptionalSelf } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function ProfileRedirectPage() {
  if (!isClerkConfigured) redirect("/sign-in");

  const self = await getOptionalSelf();
  if (!self) redirect("/sign-in");

  redirect(`/${self.username}`);
}
