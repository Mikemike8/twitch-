"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { onFollow, onUnfollow } from "@/actions/follow";
import { HeartIcon } from "@/components/icons";

export function FollowButton({
  userId,
  initialFollowing,
  authenticated = false,
}: {
  userId?: string;
  initialFollowing: boolean;
  authenticated?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    if (!userId) {
      setFollowing(!following);
      return;
    }

    if (!authenticated) {
      window.alert("Sign in to follow this channel.");
      return;
    }

    startTransition(() => {
      const action = following ? onUnfollow(userId) : onFollow(userId);
      action
        .then(() => {
          setFollowing(!following);
          router.refresh();
        })
        .catch(() => window.alert("Sign in with a different account to change this follow."));
    });
  };

  return <button disabled={isPending} onClick={toggle} className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-bold disabled:opacity-50 ${following ? "bg-[#2f2f35]" : "bg-[#9147ff] hover:bg-[#a970ff]"}`}><HeartIcon className={`h-4 w-4 ${following ? "fill-[#bf94ff] text-[#bf94ff]" : ""}`} />{following ? "Following" : "Follow"}</button>;
}
