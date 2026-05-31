"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { createViewerToken } from "@/actions/token";

export type ViewerToken = Awaited<ReturnType<typeof createViewerToken>>;

type SessionValue = {
  viewer: ViewerToken | null;
  error: string;
  ready: boolean;
};

const SessionContext = createContext<SessionValue>({
  viewer: null,
  error: "",
  ready: false,
});

export function LiveKitSession({
  hostIdentity,
  children,
}: {
  hostIdentity: string;
  children: React.ReactNode;
}) {
  const [viewer, setViewer] = useState<ViewerToken | null>(null);
  const [error, setError] = useState("");
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;

  useEffect(() => {
    if (!serverUrl) return;

    createViewerToken(hostIdentity)
      .then(setViewer)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to join stream"));
  }, [hostIdentity, serverUrl]);

  const value = { viewer, error, ready: Boolean(serverUrl && viewer) };

  if (!serverUrl || !viewer) {
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  }

  return (
    <SessionContext.Provider value={value}>
      <LiveKitRoom token={viewer.token} serverUrl={serverUrl} connect video={false} audio={false} className="contents">
        {children}
      </LiveKitRoom>
    </SessionContext.Provider>
  );
}

export function useLiveKitSession() {
  return useContext(SessionContext);
}
