import { IngressClient, RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";

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

export function getWebhookReceiver() {
  const { apiKey, apiSecret } = requireLiveKitConfig();
  return new WebhookReceiver(apiKey, apiSecret);
}
