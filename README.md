# Bunledge

Minimal full-stack demo integrating **FastAPI + PostgreSQL + Auth0 + React + Timeback SDK**.

## Stack

- **Backend**: FastAPI with SQLModel
- **Frontend**: React + Vite + TypeScript + Tailwind
- **Auth**: Auth0 (PKCE flow) with JWT validation
- **Database**: PostgreSQL via Docker
- **Timeback**: Activity tracking SDK (custom auth mode)

## Prerequisites

- [Docker](https://www.docker.com/)
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Bun](https://bun.sh/) (JS runtime)
- Auth0 account with SPA application configured
- Timeback API credentials

## Setup

### 1. Environment Variables

See `.env.example` files in `backend/` and `frontend/`

### 2. Auth0 Configuration

1. Create a **Single Page Application** in Auth0
2. Set **Allowed Callback URLs**: `http://localhost:8080`
3. Set **Allowed Logout URLs**: `http://localhost:8080`
4. Set **Allowed Web Origins**: `http://localhost:8080`
5. Create an **API** with your audience identifier

### 3. Run

```bash
./scripts/dev.sh
```

This starts PostgreSQL (port 5433), the FastAPI backend (port 8000), and the Vite frontend (port 8080).

Open http://localhost:8080

## Scripts

| Script                        | Description              |
| ----------------------------- | ------------------------ |
| `./scripts/dev.sh`            | Start all services       |
| `./scripts/reset-db.sh`       | Drop and recreate tables |
| `./scripts/db-shell.sh`       | Open psql shell          |
| `./scripts/db-query.sh "SQL"` | Run SQL query            |

## License

MIT
