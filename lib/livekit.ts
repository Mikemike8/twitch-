import { IngressClient, RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";
import type { TokenIssuerCredentials } from "@/lib/token-issuer-service";

function requireLiveKitConfig() {
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }

  return { apiUrl, apiKey, apiSecret };
}

export function getIngressClient() {
  const { apiUrl, apiKey, apiSecret } = requireLiveKitConfig();
  return new IngressClient(apiUrl, apiKey, apiSecret);
}

export function getRoomServiceClient() {
  const { apiUrl, apiKey, apiSecret } = requireLiveKitConfig();
  return new RoomServiceClient(apiUrl, apiKey, apiSecret);
}

export function createRoomServiceClient({ apiUrl, apiKey, apiSecret }: TokenIssuerCredentials) {
  if (!apiUrl) throw new Error("LiveKit credentials are not configured");
  return new RoomServiceClient(apiUrl, apiKey, apiSecret);
}

export function getWebhookReceiver() {
  const { apiKey, apiSecret } = requireLiveKitConfig();
  return new WebhookReceiver(apiKey, apiSecret);
}
