# Production Readiness Tracker

Last updated: 2026-07-16

Target: every vital area at 90-95% before production launch.

This document tracks verified production readiness, not visual polish. Update the
percentages when implementation changes are verified with the relevant checks.

## Overall Status

Current estimated production readiness: **92%**

## Scorecard

| Area | Complete | Target | Main work needed |
| --- | ---: | ---: | --- |
| Security baseline | 94% | 95% | Provision production Upstash and remove remaining CSP inline allowances |
| Token isolation | 95% | 95% | Run provider-backed token checks against production LiveKit |
| Authentication | 92% | 95% | Verify production Clerk callbacks, add account-sync recovery flow, run signed-in end-to-end tests |
| Authorization | 94% | 95% | Add provider-backed ownership and abuse tests |
| Dynamic per-user experience | 86% | 95% | Run signed-in flow tests and add provider-backed personalization coverage |
| Follow system | 90% | 95% | Add end-to-end tests, improve errors, add optimistic rollback |
| Block and moderation | 92% | 95% | Run provider-backed abuse and moderation checks |
| Live video and OBS ingress | 85% | 95% | Regenerate encrypted keys, test RTMP and WHIP end to end, handle reconnects |
| WebSockets and LiveKit chat | 92% | 95% | Run provider-backed room lifecycle and reconnect smoke checks |
| Webhooks | 92% | 95% | Configure production callback URLs and Upstash, add replay/load tests and monitoring |
| Stream key security | 91% | 95% | Regenerate legacy keys and document encryption-key rotation |
| Uploads | 90% | 95% | Test authenticated uploads and define replacement/deletion policy |
| Search | 93% | 95% | Add query performance tests |
| Creator dashboard | 84% | 95% | Test production settings, ingress, upload, and moderation workflows |
| Visible UI interactions | 90% | 95% | Complete provider-backed interaction testing |
| Reliability | 88% | 95% | Configure error tracking provider and run provider E2E checks |
| Performance | 76% | 95% | Run load smoke and database query review against production data |
| Deployment readiness | 84% | 95% | Add production secrets, hosting config, observability provider, and verified backups |
| Disk and local environment | 70% | 90% | Maintain cache cleanup and preserve working disk headroom |

## Completed Hardening

- Dependency audit resolves with zero known vulnerabilities.
- Viewer tokens expire after 15 minutes and use isolated per-session participant IDs.
- Token issuance, secret storage, and rate limiting expose dependency-injection boundaries.
- Authenticated synchronization failures no longer fall back to guest identities.
- Malformed moderation participant identities are rejected.
- Stream keys are encrypted at rest after regeneration.
- Production fails closed when Clerk or distributed rate limiting is not configured.
- Sensitive mutations and webhooks are rate limited.
- Stream updates use a runtime whitelist and bounded text inputs.
- CSP, clickjacking, MIME-sniffing, referrer, and permissions headers are present.
- Follow state is preserved in browse and search.
- The Following tab filters user-specific followed channels.
- Recommended sidebar channels use per-user filtering.
- Production profile routes do not resolve tutorial demo channels.
- Search is case-insensitive and bounded on both client and server.
- The public health endpoint reports database availability.
- Ingress creation and participant kick actions validate runtime inputs.
- Failed dashboard chat toggles roll back and unblock failures are visible.
- Offline persisted channels no longer show fake live status or fake chat.
- Unsupported notification and overflow controls are removed.
- Slow mode is enforced server-side for chat messages.
- Production CSP excludes `unsafe-eval` and responses include HSTS.
- Operational failures use structured JSON logging.
- Anonymous viewers can watch streams but cannot publish realtime chat messages.
- Viewer-token throttling includes channel and client-address dimensions.
- Feed, search, and recommendation queries have bounded result sizes.
- Security primitives have automated tests for identity parsing, encryption, and limiting.
- Authenticated thumbnail uploads are rate limited.
- Unexpected rendering failures show a retryable error boundary.
- Obviously unsigned webhook requests are rejected before consuming limiter capacity.
- Invalid webhook signatures emit structured warning logs.
- Deployment, migration, stream-key rotation, health-check, backup, and rollback steps are documented.
- Public personalization helpers fail closed for signed-in synchronization errors.
- Server actions reject malformed UUID identifiers before database access.
- Browse and search use bounded server-side pagination with previous and next navigation.
- API routes enforce an explicit origin allowlist and OPTIONS preflight handling.
- Clerk and LiveKit webhooks reject stale or duplicate events before mutation.
- Sensitive actions write audit entries for block, unblock, follow, unfollow, stream update, profile update, participant kick, thumbnail upload, and stream-key rotation.
- Mutable server actions enforce both per-user and hashed client-address rate-limit buckets.
- Stream-key generation is limited to 3 rotations per hour per user.
- Webhook and viewer-token rate-limit buckets hash client addresses before storage.
- Automated environment-variable exposure checks run locally and in CI.
- A scheduled GitHub Actions security workflow runs dependency audit, env audit, lint, tests, and Prisma validation.
- HSTS includes `preload`.
- The `AuditLog` table has a deployable Prisma SQL migration.
- Block checks use an immediate flag store before database fallback and fail closed if both checks are unavailable.
- The creator dashboard includes a chat moderation panel for active participant kick/block actions and blocked-user restoration.
- Recommended channels are ranked by live status and follower count, exclude followed/blocked relationships, and render in the browse experience.
- Chat messages are sent through a server action with bounded text validation, authenticated sender checks, block/follower enforcement, per-user and client-address rate limits, and server-side slow mode.
- LiveKit viewer tokens no longer grant client-side data publishing.
- Production environment, backup restore, LiveKit provider, and load smoke checks are available as npm scripts.
- Forwarded client addresses are ignored unless trusted and malformed forwarded addresses are discarded.
- Automated tests cover Upstash limiter behavior, anonymous viewer no-chat/no-publish grants, followers-only chat denial, and blocked-viewer token denial.

## Priority Plan

1. Enter production secrets in the hosting platform and run `npm run check:prod`.
2. Run `npm run smoke:provider`, then manually verify RTMP and WHIP ingest from OBS.
3. Run provider-backed room lifecycle, reconnect, chat delivery, kick, and block tests.
4. Configure `ERROR_TRACKING_DSN` and host log-drain alerts for structured error logs.
5. Complete a backup restore drill, set `BACKUP_RESTORE_VERIFIED_AT`, and run `npm run smoke:backup`.
6. Run `npm run smoke:load` against production and review slow database queries.
7. Regenerate creator stream keys after deployment so all stored keys use current encryption.

## Production Configuration Gates

These values must exist in the production environment:

```text
APP_ENCRYPTION_KEY
STRIPE_SECRET_KEY
STRIPE_CREATOR_PRO_PRICE_ID
STRIPE_CREATOR_PARTNER_PRICE_ID
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Regenerate existing OBS connection keys after deployment so legacy plaintext keys
are replaced with encrypted values.

## Update Protocol

When production-readiness work lands:

1. Update the affected scorecard percentages.
2. Move completed items into **Completed Hardening**.
3. Keep unresolved launch blockers in **Priority Plan**.
4. Update the `Last updated` date.
5. Run and record the verification commands:

```bash
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=moderate
npm run check:prod
npm run smoke:backup
npm run smoke:provider
npm run smoke:load
npx prisma validate
git diff --check
```

## Latest Verification

Verified on 2026-06-02:

- `npm run lint`
- `npm run build`
- `npm test`: 10 security primitive tests passing
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilities
- `npm run check-env`
- `npx prisma validate`
- `git diff --check`
- Development HTTP smoke checks for the home page, search, webhook rejection, and security headers
- Health endpoint database-availability smoke check
- Production smoke checks for protected dashboard redirects and fail-closed distributed limiting
