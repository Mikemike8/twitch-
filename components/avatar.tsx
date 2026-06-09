import Image from "next/image";
import type { Channel } from "@/lib/channels";
import { findCreatorAvatar } from "@/lib/avatar-library";

export function Avatar({ channel, size = "md" }: { channel: Channel; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";
  const creatorAvatar = findCreatorAvatar(channel.imageUrl);
  const background = creatorAvatar
    ? `linear-gradient(135deg, ${creatorAvatar.colors[0]}, ${creatorAvatar.colors[1]})`
    : `linear-gradient(135deg, ${channel.colors[0]}, ${channel.colors[1]})`;

  return (
    <div
      className={`${dimensions} grid shrink-0 place-items-center rounded-full border-2 border-[#303038] font-black text-white`}
      style={{ background }}
    >
      {channel.imageUrl && !creatorAvatar ? <Image src={channel.imageUrl} alt="" width={64} height={64} unoptimized className="h-full w-full rounded-full object-cover" /> : creatorAvatar?.face ?? channel.initials}
    </div>
  );
}
