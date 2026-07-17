"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
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
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    if (!userId) {
      setFollowing(!following);
      return;
    }

    if (!authenticated) {
      setError("Sign in to follow this channel.");
      return;
    }

    startTransition(() => {
      setError("");
      const action = following ? onUnfollow(userId) : onFollow(userId);
      action
        .then(() => {
          setFollowing(!following);
          router.refresh();
        })
        .catch(() => setError("Unable to change this follow."));
    });
  };

  if (!authenticated && !disabled) {
    if (compact) return <SignInButton><button type="button" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e50914] text-white hover:bg-[#f50723]" aria-label="Sign in to follow channel" title="Sign in to follow"><HeartIcon className="h-6 w-6" /></button></SignInButton>;
    return <SignInButton><button type="button" className="flex items-center gap-2 rounded bg-[#e50914] px-3 py-2 text-sm font-bold hover:bg-[#f50723]"><HeartIcon className="h-4 w-4" />Follow</button></SignInButton>;
  }

  if (compact) return <button disabled={disabled || isPending} onClick={toggle} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${following ? "bg-[#2a2a2a] text-[#e50914]" : "bg-[#e50914] text-white hover:bg-[#f50723]"}`} aria-label={disabled ? "You cannot follow your own channel" : following ? "Unfollow channel" : "Follow channel"} title={error || (disabled ? "Your channel" : following ? "Following" : "Follow")}><HeartIcon className={`h-6 w-6 ${following ? "fill-[#e50914]" : ""}`} /></button>;

  return <span className="inline-flex flex-col gap-2"><button disabled={disabled || isPending} onClick={toggle} className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${following ? "bg-[#2a2a2a]" : "bg-[#e50914] hover:bg-[#f50723]"}`}><HeartIcon className={`h-4 w-4 ${following ? "fill-[#e50914] text-[#e50914]" : ""}`} />{following ? "Following" : "Follow"}</button>{error && <span className="text-xs text-red-300">{error}</span>}</span>;
}
