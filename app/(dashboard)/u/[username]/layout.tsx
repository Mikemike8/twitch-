import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";

export default async function CreatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  if (isClerkConfigured) {
    const self = await getSelf();
    if (self.username !== username) redirect(`/u/${self.username}`);
  }

  return <DashboardShell username={username}>{children}</DashboardShell>;
}
