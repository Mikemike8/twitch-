import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const icon = (path: React.ReactNode) =>
  function Icon({ className = "h-5 w-5", ...props }: IconProps) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
        {path}
      </svg>
    );
  };

export const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const MenuIcon = icon(<><path d="M4 6h16M4 12h16M4 18h16" /></>);
export const ChevronIcon = icon(<path d="m15 18-6-6 6-6" />);
export const UsersIcon = icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const HeartIcon = icon(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />);
export const StarIcon = icon(<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />);
export const BellIcon = icon(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>);
export const MoreIcon = icon(<><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>);
export const ShareIcon = icon(<><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v7h14v-7" /></>);
export const VolumeIcon = icon(<><path d="M11 5 6 9H2v6h4l5 4Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></>);
export const FullscreenIcon = icon(<><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></>);
export const SendIcon = icon(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const VideoIcon = icon(<><path d="m22 8-6 4 6 4Z" /><rect width="14" height="14" x="2" y="5" rx="2" /></>);
