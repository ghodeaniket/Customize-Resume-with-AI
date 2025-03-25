#!/bin/bash

# Development startup script for the Resume Customizer application

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Resume Customizer Development Environment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running.${NC}"
  echo "Please start Docker and try again."
  exit 1
fi

# Check for docker-compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: docker-compose is not installed.${NC}"
  echo "Please install docker-compose and try again."
  exit 1
fi

# Function to handle cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down development environment...${NC}"
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
  echo -e "${GREEN}Development environment stopped.${NC}"
}

# Set up trap for clean shutdown
trap cleanup EXIT INT TERM

# Check if rebuild is requested
REBUILD=false
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --rebuild)
      REBUILD=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      echo "Usage: $0 [--rebuild]"
      exit 1
      ;;
  esac
done

# Check for environment files
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found. Creating from example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env file from example.${NC}"
  else
    echo -e "${RED}Error: .env.example not found.${NC}"
    exit 1
  fi
fi

if [ ! -f backend/.env ]; then
  echo -e "${YELLOW}Warning: backend/.env file not found. Creating from example...${NC}"
  if [ -f backend/.env.example ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}Created backend/.env file from example.${NC}"
  else
    echo -e "${RED}Error: backend/.env.example not found.${NC}"
    exit 1
  fi
fi

# Start development environment
if [ "$REBUILD" = true ]; then
  echo -e "${YELLOW}Rebuilding Docker containers...${NC}"
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
fi

echo -e "${GREEN}Starting development services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# The cleanup function will handle shutdown
