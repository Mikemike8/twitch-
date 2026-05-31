# Argus

A Twitch-inspired live streaming application built from the provided tutorial
transcript.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app includes browse and search, Clerk authentication, Prisma persistence, follow
and block actions, a creator dashboard, RTMP and WHIP ingress generation, LiveKit
webhooks, OBS streaming, viewer counts, moderated real-time chat, and thumbnail
uploads.

See [BUILD_PROMPT.md](./BUILD_PROMPT.md) for the continuous implementation guide and
remaining transcript milestones.

See [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) for the all-device responsive
layout specification, acceptance criteria, and test matrix.

## Configuration

Create `.env` from `.env.example`. The template includes tutorial timestamps for each
provider key. Database access uses Neon Postgres with a pooled runtime URL and a
direct migration URL.

Configure provider callbacks during development with a tunnel such as ngrok:

```text
https://YOUR_DOMAIN/api/webhooks/clerk
https://YOUR_DOMAIN/api/webhooks/livekit
```

For deployment, add every `.env.example` variable to the hosting provider, replace
the callback domains with the deployed URL, and use a production database URL.
