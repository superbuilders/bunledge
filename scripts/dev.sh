#!/bin/bash
set -e

# Start all development services
# Usage: ./scripts/dev.sh

echo "Starting PostgreSQL..."
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 2

echo "Initializing database..."
cd backend
uv run python -m scripts.init_db
cd ..

echo "Starting backend..."
cd backend
uv run uvicorn src.app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
bun dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Services started:"
echo "  - PostgreSQL: localhost:5433"
echo "  - Backend:    http://localhost:8000"
echo "  - Frontend:   http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose stop; exit" SIGINT SIGTERM

# Wait for processes
wait
