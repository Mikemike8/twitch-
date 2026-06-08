"use client";

import { RoomAudioRenderer, VideoTrack, useParticipants, useRoomContext, useTracks } from "@livekit/components-react";
import { useState } from "react";
import { Track } from "livekit-client";
import { VolumeIcon } from "@/components/icons";
import { useLiveKitSession } from "@/components/livekit-session";

export function LiveVideoPlayer({
  fallback,
  preview = false,
}: {
  fallback: React.ReactNode;
  preview?: boolean;
}) {
  const { error, ready } = useLiveKitSession();
  if (error) return <PlayerNotice>{error}</PlayerNotice>;
  if (!ready) return fallback;

  return (
    <>
      <BroadcastVideo fallback={fallback} preview={preview} />
      <ViewerCount />
      {!preview && <>
        <RoomAudioRenderer />
        <AudioControl />
      </>}
    </>
  );
}

function AudioControl() {
  const room = useRoomContext();
  const [volume, setVolume] = useState(0.8);
  const [previousVolume, setPreviousVolume] = useState(0.8);

  const updateVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    if (nextVolume > 0) setPreviousVolume(nextVolume);
    room.remoteParticipants.forEach((participant) => {
      participant.setVolume(nextVolume, Track.Source.Microphone);
      participant.setVolume(nextVolume, Track.Source.ScreenShareAudio);
    });
  };

  const toggleAudio = () => {
    void room.startAudio();
    updateVolume(volume === 0 ? previousVolume || 0.8 : 0);
  };

  return <div className="group absolute bottom-4 left-4 z-20 flex items-center gap-2"><button type="button" onClick={toggleAudio} className="grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black/90" aria-label={volume === 0 ? "Unmute stream audio" : "Mute stream audio"} title={volume === 0 ? "Unmute" : "Volume"}><VolumeIcon className={`h-6 w-6 ${volume === 0 ? "opacity-45" : ""}`} /></button><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { void room.startAudio(); updateVolume(Number(event.target.value)); }} className="w-0 cursor-pointer accent-[#9147ff] opacity-0 transition-all group-hover:w-24 group-hover:opacity-100 focus:w-24 focus:opacity-100" aria-label="Stream volume" /></div>;
}

function BroadcastVideo({ fallback, preview }: { fallback: React.ReactNode; preview: boolean }) {
  const tracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
  const videoTrack = tracks[0];

  if (!videoTrack) return fallback;

  return <VideoTrack trackRef={videoTrack} autoPlay muted={preview} controls={false} className="absolute inset-0 h-full w-full object-contain" />;
}

function ViewerCount() {
  const participants = useParticipants();
  return <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">{participants.length} viewers</span>;
}

function PlayerNotice({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center bg-black text-sm text-white/70">{children}</div>;
}
