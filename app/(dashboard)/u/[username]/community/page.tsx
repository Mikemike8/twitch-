import { CommunityList } from "@/components/community-list";
import { getBlockedUsers } from "@/lib/block-service";

export default async function CommunityPage() {
  let blockedUsers: { id: string; username: string }[] = [];

  try {
    blockedUsers = (await getBlockedUsers()).map(({ blocked }) => blocked);
  } catch {
    // Demo mode has no authenticated creator yet.
  }

  return <div className="p-4 sm:p-6 lg:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#bf94ff]">Creator tools</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Community</h1><p className="mt-3 text-sm text-[#adadb8]">Review blocked community members and restore access.</p><CommunityList initialUsers={blockedUsers} /></div>;
}
