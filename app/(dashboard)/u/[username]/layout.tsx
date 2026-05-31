import { DashboardShell } from "@/components/dashboard-shell";

export default async function CreatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <DashboardShell username={username}>{children}</DashboardShell>;
}
