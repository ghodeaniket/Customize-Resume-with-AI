#!/bin/bash

# Start Resume Customizer Services

# Set environment variables for local development
export NODE_ENV=${NODE_ENV:-development}

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
fi

if [ ! -f "./backend/.env" ]; then
  echo "Creating backend .env file from example..."
  cp ./backend/.env.example ./backend/.env
fi

# Function to display usage info
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --help           Show this help message"
  echo "  --dev            Start in development mode (default)"
  echo "  --prod           Start in production mode"
  echo "  --api-only       Start only the API and its dependencies"
  echo "  --rebuild        Rebuild all containers"
  echo "  --logs           Show logs after starting"
  echo "  --stop           Stop all containers"
  echo "  --down           Stop and remove all containers"
  exit 1
}

# Parse arguments
MODE="dev"
SERVICES="api frontend resume-worker formatted-worker postgres redis"
BUILD=""
LOGS=""
ACTION="up -d"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --help) usage ;;
    --dev) MODE="dev" ;;
    --prod) MODE="prod"; export NODE_ENV=production ;;
    --api-only) SERVICES="api postgres redis" ;;
    --rebuild) BUILD="--build" ;;
    --logs) LOGS="logs -f" ;;
    --stop) ACTION="stop"; LOGS="" ;;
    --down) ACTION="down"; LOGS="" ;;
    *) echo "Unknown parameter: $1"; usage ;;
  esac
  shift
done

# Set the correct docker-compose file based on mode
if [ "$MODE" == "prod" ]; then
  echo "Starting in PRODUCTION mode..."
  COMPOSE_FILE="docker-compose.yml"
else
  echo "Starting in DEVELOPMENT mode..."
  COMPOSE_FILE="docker-compose.yml"
fi

# Execute docker-compose command
if [ "$ACTION" == "up -d" ]; then
  echo "Starting services: $SERVICES"
  docker-compose -f $COMPOSE_FILE up -d $BUILD $SERVICES
  
  if [ ! -z "$LOGS" ]; then
    echo "Showing logs..."
    docker-compose -f $COMPOSE_FILE $LOGS
  fi
elif [ "$ACTION" == "stop" ]; then
  echo "Stopping services..."
  docker-compose -f $COMPOSE_FILE stop
elif [ "$ACTION" == "down" ]; then
  echo "Stopping and removing containers..."
  docker-compose -f $COMPOSE_FILE down
fi

echo "Done!"
