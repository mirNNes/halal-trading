# Halal Trading

Halal Trading is a SaaS-style investment platform for halal-focused trading strategies.

The platform allows users to manage strategies, run backtests, receive trading signals, connect a broker account, and execute trades through Alpaca in paper/live mode.

## Features

- User authentication
- Strategy management
- Backtesting
- Live trading signals
- Halal compliance universe
- Alpaca broker integration
- Automatic order execution
- Execution history
- Order status sync with Celery
- Dashboard with broker/account data
- Stripe subscription foundation
- Docker-based development and production setup
- Nginx reverse proxy

## Tech Stack

- Backend: FastAPI
- Frontend: Next.js
- Database: PostgreSQL
- Queue: Redis
- Background jobs: Celery
- Broker: Alpaca
- Infrastructure: Docker, Docker Compose, Nginx
- CI: GitHub Actions

## Development

```bash
cp .env.example .env
docker compose up -d --build

Frontend:

http://localhost:3000

Backend docs:

http://localhost:8000/docs

Nginx:

http://localhost
Production-like local setup
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
Services

Development:

docker compose ps
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f frontend

Production-like:

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f beat
docker compose -f docker-compose.prod.yml logs -f frontend
Status

The project is currently in MVP/pre-deployment stage.

Core functionality is implemented. The next milestones are VPS deployment, HTTPS, automated deployment, monitoring, and user testing.

Disclaimer

This project is for educational and testing purposes. Trading involves risk. Users are responsible for their own investment decisions. Paper trading should be used before any live execution.
