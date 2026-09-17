# JJ Jewell — Jewellcore

The personal portfolio and services site for **JJ Jewell (Jewellcore)** — an independent web
developer and systems builder. A Next.js application with a real-time 3D scene, a self-hosted AI
assistant, and a private admin console, deployed as a Docker image behind Cloudflare Tunnel.

Live: **https://jjs.jewellcore.com**

## Features

- **Marketing site** — hero, positioning, capabilities, selected work, and a contact form.
- **Selected work** — portfolio entries are read from the database, so the grid always reflects
  the live project list.
- **Hopper** — an AI assistant grounded in the live portfolio and pricing data. Answers are drawn
  from the database, so they never go stale. Supports Ollama (self-hosted) and any OpenAI-compatible
  endpoint.
- **Lead capture** — contact submissions and chat conversations are stored and pushed in real time
  via [ntfy](https://ntfy.sh).
- **Command Center** — a password-protected console at `/command-center` for managing portfolio
  items, pricing tiers, about/journey content, social links, AI configuration, and leads.
- **3D scene** — a Three.js / GSAP background that reacts to scroll.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router, standalone output) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data | Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`) |
| Motion | Three.js, GSAP / ScrollTrigger |
| AI | Ollama or OpenAI-compatible API |
| Runtime | Docker (multi-stage), Coolify, Cloudflare Tunnel |

## Getting started

```bash
npm install
cp .env.example .env        # then fill in the values
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

The app is served at http://localhost:3000, and the admin console at
http://localhost:3000/command-center.

### Environment variables

See `.env.example`. Key values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string, e.g. `file:/app/data/jewellcore.db` |
| `SESSION_SECRET` | Signing key for admin sessions |
| `ADMIN_PASSWORD` | Initial password for the admin user (seeded once) |
| `FORCE_ADMIN_RESET` | Set to `true` to reset the admin password from `ADMIN_PASSWORD` on next seed |
| `NTFY_TOPIC_URL` | ntfy topic URL for lead notifications |
| `NTFY_ACCESS_TOKEN` | ntfy access token |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Seed reference content and the admin user |

## Deployment

The site runs as a Docker image. `start.sh` aligns the database schema and seeds reference content
on boot, then starts the standalone Next.js server. In production it is deployed through Coolify and
published via Cloudflare Tunnel.

```bash
docker build -t jewellcore:latest .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=file:/app/data/jewellcore.db \
  -e SESSION_SECRET=change-me \
  -e ADMIN_PASSWORD=change-me \
  jewellcore:latest
```

## License

All rights reserved. This is a personal site; the content and design are not licensed for reuse.
