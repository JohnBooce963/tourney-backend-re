# Tourney backend

JSON + Server-Sent Events API for the Tourney ban/pick draft (Next.js route handlers, Neon Postgres).

Lobby and draft state lives **in memory**, so run it as **one long-running Node process**
(Railway, Render, Fly…). It does not work on serverless (Vercel/Netlify functions), and a restart clears open lobbies.

## Run locally

```bash
cp .env.example .env   # then fill in DATABASE_URL
npm install
npm run dev            # http://localhost:3000
npm test               # draft rules
```

| Variable       | Required | Notes                                                    |
| -------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL` | yes      | Neon connection string                                   |
| `CORS_ORIGIN`  | no       | Frontend origin, e.g. `https://tourney-frontend.vercel.app`. Defaults to `*` (safe: no cookies are used) |

## API

| Method | Path                               | Body                     | Notes                              |
| ------ | ---------------------------------- | ------------------------ | ---------------------------------- |
| GET    | `/api/lobby`                       |                          | lobby list                         |
| POST   | `/api/lobby`                       | `{ name, theme }`        | → `{ id, ownerToken }`             |
| GET    | `/api/lobby/events`                |                          | SSE: `lobbies`                     |
| GET    | `/api/lobby/:id`                   |                          | lobby + draft snapshot             |
| GET    | `/api/lobby/:id/events`            |                          | SSE: `state`, `coin`, `deleted`    |
| POST   | `/api/lobby/:id/join`              | `{ name, slot }`         | → `{ slot, playerToken }`          |
| POST   | `/api/lobby/:id/leave`             | `{ token }`              | player token                       |
| POST   | `/api/lobby/:id/delete`            | `{ token }`              | owner token                        |
| POST   | `/api/lobby/:id/flip`              | `{ token }`              | owner or player                    |
| POST   | `/api/lobby/:id/start`             | `{ token }`              | owner or player, both seats filled |
| POST   | `/api/lobby/:id/select`            | `{ token, item }`        | highlight (shown to everyone)      |
| POST   | `/api/lobby/:id/confirm`           | `{ token, item }`        | lock in                            |
| GET    | `/api/db/operator`                 |                          | operator list (no images)          |
| GET    | `/api/db/squad/:theme`             |                          | squads for a theme                 |
| GET    | `/api/img/op/:id`, `/api/img/squad/:id` |                     | PNG, cached for a year             |

Turns last 90 s; on timeout the highlighted choice (or a random valid one) is locked in.
A finished draft stays viewable for 10 minutes (`closesAt` in the snapshot drives the on-screen countdown),
then the lobby closes and everyone in it is sent back to the lobby list. The owner can close it earlier.

## Deploy (Railway)

1. New Project → Deploy from GitHub → this repo. Settings → **Root Directory: `backend`**.
2. Variables: `DATABASE_URL`, `CORS_ORIGIN`.
3. Networking → Generate Domain. Put that URL in the frontend's `src/environments/environment.ts`.
4. Keep replicas at **1** (state is in memory).
