"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { onFollow, onUnfollow } from "@/actions/follow";
import { HeartIcon } from "@/components/icons";

export function FollowButton({
  userId,
  initialFollowing,
  authenticated = false,
  compact = false,
  disabled = false,
}: {
  userId?: string;
  initialFollowing: boolean;
  authenticated?: boolean;
  compact?: boolean;
  disabled?: boolean;
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

  if (compact) return <button disabled={disabled || isPending} onClick={toggle} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${following ? "bg-[#2f2f35] text-[#bf94ff]" : "bg-[#9147ff] text-white hover:bg-[#a970ff]"}`} aria-label={disabled ? "You cannot follow your own channel" : following ? "Unfollow channel" : "Follow channel"} title={disabled ? "Your channel" : following ? "Following" : "Follow"}><HeartIcon className={`h-6 w-6 ${following ? "fill-[#bf94ff]" : ""}`} /></button>;

  return <button disabled={disabled || isPending} onClick={toggle} className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${following ? "bg-[#2f2f35]" : "bg-[#9147ff] hover:bg-[#a970ff]"}`}><HeartIcon className={`h-4 w-4 ${following ? "fill-[#bf94ff] text-[#bf94ff]" : ""}`} />{following ? "Following" : "Follow"}</button>;
}
