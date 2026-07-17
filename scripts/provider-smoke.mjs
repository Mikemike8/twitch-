import { IngressClient, RoomServiceClient } from "livekit-server-sdk";

const required = [
  "LIVEKIT_API_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "NEXT_PUBLIC_LIVEKIT_WS_URL",
];

let failed = false;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`PROVIDER: ${key} is required.`);
    failed = true;
  }
}
if (failed) process.exit(1);

const apiUrl = process.env.LIVEKIT_API_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

const roomClient = new RoomServiceClient(apiUrl, apiKey, apiSecret);
const ingressClient = new IngressClient(apiUrl, apiKey, apiSecret);

await roomClient.listRooms();
await ingressClient.listIngress();

console.log("LiveKit provider smoke check passed.");
