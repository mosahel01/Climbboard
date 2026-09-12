.PHONY: up down seed test

up:
	docker compose up --build -d

down:
	docker compose down

seed:
	docker compose exec backend node scripts/seed.js

logs:
	docker compose logs -f backend
