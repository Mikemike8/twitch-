import { DashboardAvatarPicker } from "@/components/dashboard-avatar-picker";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";

export default async function CreatorAvatarPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const self = isClerkConfigured ? await getSelf() : null;

  return <DashboardAvatarPicker username={self?.username ?? username} currentImageUrl={self?.imageUrl ?? ""} />;
}
