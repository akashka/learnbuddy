#!/bin/bash
# Start all services (run from project root)
# Requires: backend .env, frontend .env, admin .env, ai-service .env
# Starts Redis locally, then backend, ai-service, frontend, admin, website

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REDIS_URL="redis://localhost:6379"
export REDIS_URL

# --- Start Redis ---
REDIS_CONTAINER="tuition-redis"
redis_started=false
if command -v docker &>/dev/null; then
  if docker ps -a --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
    if ! docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
      echo "Starting Redis container..."
      docker start "$REDIS_CONTAINER"
    fi
  else
    echo "Creating and starting Redis container..."
    docker run -d -p 6379:6379 --name "$REDIS_CONTAINER" redis:7-alpine
  fi
  redis_started=true
  echo "Redis:      redis://localhost:6379 (Docker)"
elif command -v redis-server &>/dev/null; then
  if ! redis-cli ping &>/dev/null 2>&1; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
  fi
  redis_started=true
  echo "Redis:      redis://localhost:6379 (redis-server)"
else
  echo "Warning: Neither Docker nor redis-server found. Redis caching disabled."
  echo "  Install: Docker (docker run redis) or redis-server (apt install redis-server)"
fi

# Brief wait for Redis to accept connections
if [ "$redis_started" = true ]; then
  sleep 2
fi
echo ""

echo "Starting services..."
echo "  Backend:    http://localhost:3005"
echo "  AI Service: http://localhost:3006"
echo "  Frontend:   http://localhost:3007"
echo "  Admin:      http://localhost:3008"
echo "  Website:    http://localhost:3009"
echo ""

# Start in background (inherit REDIS_URL)
cd backend && npm run dev &
cd "$ROOT/ai-service" && npm run dev &
cd "$ROOT/frontend" && npm run dev &
cd "$ROOT/admin" && npm run dev &
cd "$ROOT/website" && npm run dev &

wait
