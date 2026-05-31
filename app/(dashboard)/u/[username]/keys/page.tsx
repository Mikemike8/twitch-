import { ConnectionKeys } from "@/components/connection-keys";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelfStream } from "@/lib/stream-service";

export default async function KeysPage() {
  const livekitConfigured = Boolean(process.env.LIVEKIT_API_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
  const stream = isClerkConfigured ? await getSelfStream() : null;
  const initialConnection = stream?.serverUrl && stream.streamKey ? { serverUrl: stream.serverUrl, streamKey: stream.streamKey } : null;
  return <ConnectionKeys configured={isClerkConfigured && livekitConfigured} initialConnection={initialConnection} />;
}
