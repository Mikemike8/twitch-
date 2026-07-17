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
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CREATOR_PRO_PRICE_ID
STRIPE_CREATOR_PARTNER_PRICE_ID
UPLOADTHING_TOKEN
APP_ENCRYPTION_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
WEBHOOK_MAX_AGE_SECONDS
```

Run the production configuration audit before every production deploy:

```bash
npm run check:prod
```

Use a stable, randomly generated `APP_ENCRYPTION_KEY`. Store it in the deployment
platform secret manager. Do not rotate it until existing encrypted OBS connection
keys have been regenerated.

Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS production origin. API routes reject
cross-origin requests that are not on the allowlist. Set
`WEBHOOK_MAX_AGE_SECONDS=1800` unless the webhook provider requires a wider retry
window.

Create recurring Stripe Prices for the Pro and Partner creator plans. Store the
secret key in `STRIPE_SECRET_KEY` and the recurring price IDs in
`STRIPE_CREATOR_PRO_PRICE_ID` and `STRIPE_CREATOR_PARTNER_PRICE_ID`. The
subscription page creates hosted Stripe Checkout Sessions and lets Stripe collect
and save the payment method.

Configure the Stripe webhook callback:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

Subscribe it to checkout session, customer subscription, and invoice payment
events. Store the signing secret in `STRIPE_WEBHOOK_SECRET`.

## Provider Callbacks

Configure these HTTPS callbacks:

```text
https://YOUR_DOMAIN/api/webhooks/clerk
https://YOUR_DOMAIN/api/webhooks/livekit
```

Deploy behind a trusted proxy that overwrites `x-forwarded-for` and `x-real-ip`.
Rate limiting uses the resulting client address. Leave `TRUST_PROXY_HEADERS=false`
unless the platform strips client-supplied forwarded headers before the request
reaches the app. Vercel deployments trust platform headers automatically.

## Database

Apply schema changes with the direct database URL:

```bash
npx prisma migrate deploy
```

Before deployment, confirm the provider backup policy and record the latest
restorable backup timestamp. After a restore drill, store the ISO timestamp in
`BACKUP_RESTORE_VERIFIED_AT` and run:

```bash
npm run smoke:backup
```

## Verification

Run before deployment:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
npm run check:prod
npm run smoke:backup
npx prisma validate
git diff --check
```

Run after deployment:

```bash
curl --fail https://YOUR_DOMAIN/api/health
npm run smoke:load
npm run smoke:provider
```

Expected response:

```json
{"status":"ok"}
```

Confirm signed-out dashboard requests redirect to `/sign-in`. Confirm unsigned
Clerk and LiveKit webhook requests return `400`.
Confirm API requests with an untrusted `Origin` header return `403`, and replayed
webhook IDs are skipped with `200`.

## Provider End-to-End Checks

The provider smoke check confirms LiveKit credentials can list rooms and ingress
objects. For a full launch pass, also create one RTMP and one WHIP connection
from the dashboard, publish from OBS or another ingest client, confirm LiveKit
sets the stream live through the webhook, join as a second signed-in user, send a
chat message, reload the viewer page, and confirm reconnect/chat delivery still
work. Record the result in the release notes or deployment checklist.

## Monitoring

Set `ERROR_TRACKING_DSN` to the deployment provider or error-tracking service
used for production alerts. Application logs are structured JSON; configure the
host log drain to alert on `level=error`, `/api/health` failures, webhook
signature failures, rate-limit store failures, and LiveKit provider failures.

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
