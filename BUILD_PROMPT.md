# Twitch Clone Continuous Build Prompt

Build the Twitch clone in this repository continuously until the implementation is
complete or an external credential is strictly required.

## Primary Specification

Use these transcripts as the primary product and implementation guide, in order:

1. `NoteGPT_TRANSCRIPT_Full Stack Twitch Clone  Next.js, RTMP, WebSockets & Live Chat.txt`
2. `NoteGPT_TRANSCRIPT_Next.js Streaming Platform RTMP, Chat & Live Analytics  Part 2.txt`

Follow their feature order strictly.
Do not skip ahead to later integrations while an earlier milestone is incomplete.

The recording uses older library versions. Preserve the tutorial's architecture and
behavior, but use current stable package APIs where the old setup is obsolete.

## Working Rules

1. Keep the application runnable after each milestone.
2. Inspect existing files before editing them.
3. Reuse the tutorial's route-group structure and ownership boundaries.
4. Run `npm run lint` and `npm run build` after each meaningful milestone.
5. Fix implementation errors before moving to the next milestone.
6. Do not invent credentials or commit secrets.
7. Add `.env.example` entries when an integration needs configuration.
8. Continue with local adapters or mock data only when that preserves a clear path
   to the transcript's real integration. Mark those boundaries explicitly.
9. Do not remove user-authored files or unrelated changes.
10. Update this document's checklist as milestones are completed.

## Transcript Milestones

- [x] Scaffold current Next.js, TypeScript, ESLint, Tailwind, and App Router project.
- [x] Build initial responsive browse UI, recommended sidebar, search, stream cards,
      channel page, follow control, collapsible chat, and local chat messages.
- [x] Add the authentication route group, Clerk provider, middleware, sign-in, and
      sign-up routes.
- [x] Add Prisma and the database client singleton.
- [x] Add the `User` model, Clerk webhook synchronization, and webhook API route.
- [x] Add authenticated user lookup and username-based profile routes.
- [x] Build the responsive browse navbar and sidebar stores using persisted user data.
- [x] Add follow services, actions, followed channels, and recommendation filtering.
- [x] Add block services, actions, filtering, and profile visibility rules.
- [x] Add the creator dashboard route group and creator sidebar.
- [x] Add the `Stream` model and stream settings forms.
- [x] Add LiveKit ingress generation for RTMP and WHIP.
- [x] Add LiveKit webhook processing and online/offline stream state.
- [x] Build the real LiveKit video player, controls, and viewer count.
- [x] Add real-time chat, participant colors, slow mode, followers-only chat, and
      disabled-chat handling.
- [x] Disconnect blocked participants from active sessions.
- [x] Add thumbnail upload support.
- [x] Add browse ordering, search results, empty states, loading states, and final
      responsive polish.
- [x] Run final lint, production build, and document deployment configuration.

## Credential Boundaries

Continue implementing code and `.env.example` entries when possible. Stop only when
a provider account action is required and no useful code work remains.

Expected external configuration:

```dotenv
# Part 1: 00:42:56, paste at 00:45:04
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
# Part 1: 01:41:45
CLERK_WEBHOOK_SECRET=
# Part 1: 01:13:20
DATABASE_URL=
# Part 2: 00:24:12
LIVEKIT_API_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
# Part 2: 00:25:02
NEXT_PUBLIC_LIVEKIT_WS_URL=
# Part 2: 04:12:26. Current SDK token replaces the older secret and app ID.
UPLOADTHING_TOKEN=
```

## Definition Of Done

The clone is complete when a user can authenticate, browse streams, search channels,
follow and block users, manage a creator stream, generate OBS credentials, broadcast
through LiveKit, watch a live stream, see viewer counts, use moderated real-time chat,
upload a thumbnail, and run a clean production build.
