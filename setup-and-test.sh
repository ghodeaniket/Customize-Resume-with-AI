#!/bin/bash

# Make the script executable
chmod +x setup-and-test.sh

# Create uploads directory
mkdir -p uploads

# Build and start the Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for the database to be ready
echo "Waiting for the database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose exec app npx prisma migrate dev --name init

# Display information
echo ""
echo "======================================="
echo "Resume Customizer is now running!"
echo "======================================="
echo ""
echo "Access the application at: http://localhost:3000"
echo ""
echo "To stop the application, run:"
echo "docker-compose down"
echo ""
echo "To view logs:"
echo "docker-compose logs -f"
echo ""
