# Production Deployment Runbook

## Required Configuration

Set every value from `.env.example` in the production environment. The following
values are hard production gates:

```text
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
LIVEKIT_API_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
NEXT_PUBLIC_LIVEKIT_WS_URL
UPLOADTHING_TOKEN
APP_ENCRYPTION_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
WEBHOOK_MAX_AGE_SECONDS
```

Use a stable, randomly generated `APP_ENCRYPTION_KEY`. Store it in the deployment
platform secret manager. Do not rotate it until existing encrypted OBS connection
keys have been regenerated.

Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS production origin. API routes reject
cross-origin requests that are not on the allowlist. Set
`WEBHOOK_MAX_AGE_SECONDS=1800` unless the webhook provider requires a wider retry
window.

## Provider Callbacks

Configure these HTTPS callbacks:

```text
https://YOUR_DOMAIN/api/webhooks/clerk
https://YOUR_DOMAIN/api/webhooks/livekit
```

Deploy behind a trusted proxy that overwrites `x-forwarded-for` and `x-real-ip`.
Rate limiting uses the resulting client address.

## Database

Apply schema changes with the direct database URL:

```bash
npx prisma migrate deploy
```

Before deployment, confirm the provider backup policy and record the latest
restorable backup timestamp.

## Verification

Run before deployment:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
npx prisma validate
git diff --check
```

Run after deployment:

```bash
curl --fail https://YOUR_DOMAIN/api/health
```

Expected response:

```json
{"status":"ok"}
```

Confirm signed-out dashboard requests redirect to `/sign-in`. Confirm unsigned
Clerk and LiveKit webhook requests return `400`.
Confirm API requests with an untrusted `Origin` header return `403`, and replayed
webhook IDs are skipped with `200`.

## Stream-Key Migration

After the first production deployment with `APP_ENCRYPTION_KEY`, regenerate every
creator OBS connection. Newly generated keys are encrypted before storage.

## Rollback

1. Stop new deployments if `/api/health` returns `503`.
2. Roll back the application to the previous verified build.
3. Restore the latest database backup only if a migration or write-path defect
   modified production data.
4. Keep the current `APP_ENCRYPTION_KEY` during rollback so encrypted stream keys
   remain readable.
5. Re-run the post-deployment verification checks.
