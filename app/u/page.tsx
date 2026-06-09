import { redirect } from "next/navigation";
import { getOptionalSelf } from "@/lib/auth-service";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function CreatorDashboardRedirectPage() {
  if (!isClerkConfigured) redirect("/sign-in");

  const self = await getOptionalSelf();
  if (!self) redirect("/sign-in");

  redirect(`/u/${self.username}`);
}
