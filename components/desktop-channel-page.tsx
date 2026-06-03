"use client";

import { useEffect, useState } from "react";
import { ChannelPage } from "@/components/channel-page";
import type { Channel } from "@/lib/channels";

export function DesktopChannelPage({ channel, initialFollowing, canFollow, authenticated }: { channel: Channel; initialFollowing: boolean; canFollow: boolean; authenticated: boolean }) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!desktop) return null;

  return <ChannelPage channel={channel} initialFollowing={initialFollowing} canFollow={canFollow} authenticated={authenticated} />;
}
