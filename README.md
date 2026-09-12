# BazariRank

A full-stack real-time leaderboard app. Players submit scores, personal bests are ranked with Redis and leaderboards shift live over Socket.IO.

## Quick start

Requires Node 18+ and Redis on port 6379.

```bash
# Backend (port 5000)
cd backend && npm install && npm run seed:reset && npm start

# Frontend (port 5173)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

Demo accounts:
- `sahil@example.com` / `password123` (admin)
- `admin@example.com` / `password123` (admin)

## Tests

```bash
cd backend && npm test
```

Docker: `docker compose up --build -d`, then seed with
`docker compose exec backend node scripts/seed.js`.