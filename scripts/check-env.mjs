const forbiddenPublicPatterns = [
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_API_URL",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "UPLOADTHING_SECRET",
  "UPLOADTHING_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "APP_ENCRYPTION_KEY",
];

let failed = false;

for (const pattern of forbiddenPublicPatterns) {
  const key = `NEXT_PUBLIC_${pattern}`;
  if (process.env[key]) {
    console.error(`SECURITY: ${key} must never be exposed to the browser.`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Environment variable audit passed.");
