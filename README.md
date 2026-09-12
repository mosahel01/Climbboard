# BazariRank

A full-stack real-time leaderboard app. Players submit scores, personal bests are ranked with
Redis Sorted Sets, and leaderboards shift live over Socket.IO without page refreshes.

## Tech stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 18, Vite, react-router, socket.io-client |
| Backend  | Node.js, Express, Socket.IO, JWT               |
| Database | Redis (Sorted Sets, hashes, lists) via ioredis |
| Tests    | node:test + supertest                          |

## Features

- Real-time per-game and global leaderboards (`lb:{gameId}` + `global` socket rooms).
- Personal bests via `ZADD ... GT`; lower scores go to history, never lower rank.
- Live activity ticker (`GET /api/activity` + `activity:new`) with rank-jump indicators.
- 7 playable games: Speed Run, Puzzle Master, Math Challenge, Word Rush, Memory, Flash Reaction,
  Color Stroop.
- Difficulty modes (Easy / Normal / Hard) that adapt timers, board sizes and shuffle depth.
- Achievement badges with progress shown in an Achievements centre (`/achievements`).
- Follow / unfollow from profiles, follower counts, and a Following toggle on the activity feed.
- Admin console (`/admin`): overview, player manager, promote / demote, ban / unban, delete.
- Public player profiles, reports (Today / 7d / 30d / custom), JWT auth with bcrypt.

## Quick start (no Docker)

Requires Node 18+ and Redis on port 6379.

```bash
# 1. Redis
redis-server --port 6379 --save "" --appendonly no &

# 2. Backend (port 5000)
cd backend
npm install
npm run seed:reset   # load 7 games + 16 players (demo accounts included)
npm start            # or: npm run dev (nodemon)

# 3. Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

Demo accounts:

- `sahil@example.com` / `password123` (admin)
- `admin@example.com` / `password123` (admin)

### No system Redis? Use the vendored build

```bash
backend/scripts/dev-redis.js          # start it
backend/scripts/dev-redis.js --stop   # stop it
```

### Backend tests

```bash
cd backend
npm test          # 42 tests across auth, scores, leaderboards, reports, admin and social
```

Tests share one Redis DB and isolate themselves, so re-seed afterwards with `npm run seed:reset`
to restore the demo data.

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env   # optional; defaults are fine for dev
docker compose up --build -d           # Redis + backend on :6379 / :5000
docker compose exec backend node scripts/seed.js   # load the demo data
```

Run the frontend on the host: `cd frontend && npm install && npm run dev`. Vite proxies `/api`
and `/socket.io` to `:5000`.

## API surface (highlights)

```
POST /api/auth/register | login
GET  /api/users/me
GET  /api/users/:userId                    (public profile)
POST/DELETE /api/users/:userId/follow
GET  /api/users/me/following
GET  /api/users/me/achievements
GET  /api/games
GET  /api/games/:id/leaderboard?page&limit
POST /api/games/:id/scores                 (returns rank, rankJump, newBadges)
GET  /api/leaderboard/global
GET  /api/users/me/scores?page&limit
GET  /api/reports/top-players?from&to&limit
GET  /api/activity?limit&feed=all|following
GET  /api/admin/overview | /users | /games (admin only)
PATCH/DELETE /api/admin/users/:userId      (role, ban, delete)
```

Socket events: `leaderboard:update` (rooms `lb:{gameId}`), `global:update`, `activity:new`.

## Redis data model

| Key                                        | Type   | Purpose                                        |
| ------------------------------------------ | ------ | ---------------------------------------------- |
| `user:{id}`                                | hash   | profile + role + banned flag                   |
| `user:index:username` / `:email`           | hash   | unique lookups to user id                      |
| `user:{id}:badges`                         | set    | earned badge ids                               |
| `user:{id}:jumps`                          | zset   | max rank jump ever (Market Mover badge)        |
| `game:{id}` / `games`                      | hash/set | game metadata and index                      |
| `leaderboard:{gameId}` / `leaderboard:global` | zset | personal bests; global sum of bests         |
| `movement:{gameId}`                        | hash   | latest rank move per user (2 min TTL)          |
| `history:{userId}` / `historyEntry:{id}`   | zset/hash | every submission, time-ordered             |
| `activity:feed`                            | list   | bounded live feed (LTRIM 200)                  |
| `counter:submissions` / `:submissions:{gameId}` | string | submission tallies for the admin overview |
| `social:following:{id}` / `:followers:{id}` | zset  | follow graph (time-ordered members)            |