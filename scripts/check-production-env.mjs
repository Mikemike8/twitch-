const required = [
  "APP_ENCRYPTION_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_API_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_LIVEKIT_WS_URL",
  "STRIPE_CREATOR_PARTNER_PRICE_ID",
  "STRIPE_CREATOR_PRO_PRICE_ID",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "UPLOADTHING_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "WEBHOOK_MAX_AGE_SECONDS",
];

const recommended = [
  "ERROR_TRACKING_DSN",
  "BACKUP_RESTORE_VERIFIED_AT",
  "LOAD_TEST_BASE_URL",
];

let failed = false;

for (const key of required) {
  if (!process.env[key]) {
    console.error(`PRODUCTION: ${key} is required.`);
    failed = true;
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (appUrl && !appUrl.startsWith("https://")) {
  console.error("PRODUCTION: NEXT_PUBLIC_APP_URL must be an HTTPS origin.");
  failed = true;
}

const webhookAge = Number(process.env.WEBHOOK_MAX_AGE_SECONDS);
if (!Number.isFinite(webhookAge) || webhookAge < 300 || webhookAge > 3600) {
  console.error("PRODUCTION: WEBHOOK_MAX_AGE_SECONDS must be between 300 and 3600.");
  failed = true;
}

for (const key of recommended) {
  if (!process.env[key]) console.warn(`PRODUCTION: ${key} is recommended for launch verification.`);
}

if (process.env.TRUST_PROXY_HEADERS === "true") {
  console.warn("PRODUCTION: TRUST_PROXY_HEADERS=true is safe only behind a proxy that overwrites forwarded headers.");
}

if (failed) process.exit(1);
console.log("Production environment audit passed.");
