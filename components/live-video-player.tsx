import { RoomAudioRenderer, VideoTrack, useParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useLiveKitSession } from "@/components/livekit-session";

export function LiveVideoPlayer({
  fallback,
}: {
  fallback: React.ReactNode;
}) {
  const { error, ready } = useLiveKitSession();
  if (error) return <PlayerNotice>{error}</PlayerNotice>;
  if (!ready) return fallback;

  return (
    <>
      <BroadcastVideo fallback={fallback} />
      <ViewerCount />
      <RoomAudioRenderer />
    </>
  );
}

function BroadcastVideo({ fallback }: { fallback: React.ReactNode }) {
  const tracks = useTracks([Track.Source.Camera]);
  const videoTrack = tracks[0];

  if (!videoTrack) return fallback;

  return <VideoTrack trackRef={videoTrack} controls className="h-full w-full object-contain" />;
}

function ViewerCount() {
  const participants = useParticipants();
  return <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">{participants.length} viewers</span>;
}

function PlayerNotice({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center bg-black text-sm text-white/70">{children}</div>;
}
