# Resume Customizer Docker Environment

This document provides instructions for setting up and running the Resume Customizer application using Docker.

## Architecture

The application consists of the following services:

1. **Frontend** - Next.js application that provides the user interface
2. **API** - Express backend that handles API requests
3. **Resume Worker** - Service that processes resume customization jobs
4. **Formatted Resume Worker** - Service that handles formatted resume generation
5. **PostgreSQL** - Database for storing user data and job information
6. **Redis** - Message queue and caching system
7. **Nginx** - Reverse proxy for SSL termination and routing
8. **Prometheus/Grafana** - Monitoring and visualization (optional)

## Prerequisites

- Docker (version 20.10.0+)
- Docker Compose (version 2.0.0+)
- Git

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Customize-Resume-with-AI.git
   cd Customize-Resume-with-AI
   ```

2. Start the services using the provided script:
   ```bash
   ./start-services.sh
   ```

   This will start all services in development mode.

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8080
   - Grafana (if enabled): http://localhost:3001

## Configuration Options

### Environment Variables

The application uses environment variables for configuration. Default values are provided in `.env.example` files.

1. Copy the example files to create your environment files:
   ```bash
   cp .env.example .env
   cp ./backend/.env.example ./backend/.env
   ```

2. Edit the `.env` files to configure your environment.

### Start Script Options

The `start-services.sh` script provides several options:

- `--dev`: Start in development mode (default)
- `--prod`: Start in production mode
- `--api-only`: Start only the API and its dependencies
- `--rebuild`: Rebuild all containers
- `--logs`: Show logs after starting
- `--stop`: Stop all containers
- `--down`: Stop and remove all containers

Example:
```bash
./start-services.sh --prod --rebuild
```

This will start the application in production mode and rebuild all containers.

## Production Deployment

For production deployment, follow these steps:

1. Generate SSL certificates:
   ```bash
   mkdir -p ./nginx/ssl
   # For self-signed certificates (for testing only)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./nginx/ssl/key.pem -out ./nginx/ssl/cert.pem
   
   # For production, use Let's Encrypt or another certificate provider
   ```

2. Update the Nginx configuration in `./nginx/conf.d/default.conf` with your domain name.

3. Start the services in production mode:
   ```bash
   ./start-services.sh --prod
   ```

## Scaling Workers

To scale the number of worker processes, use:

```bash
docker-compose up -d --scale resume-worker=3 --scale formatted-worker=2
```

This will run 3 resume worker containers and 2 formatted resume worker containers.

## Monitoring

The application includes Prometheus and Grafana for monitoring. Access Grafana at http://localhost:3001 (default credentials: admin/admin).

## Troubleshooting

### Viewing Logs

To view logs for all services:
```bash
docker-compose logs -f
```

For a specific service:
```bash
docker-compose logs -f api
```

### Common Issues

1. **Database Connection Errors**
   - Check if the PostgreSQL container is running: `docker-compose ps postgres`
   - Verify the database credentials in the `.env` file

2. **Redis Connection Errors**
   - Check if the Redis container is running: `docker-compose ps redis`
   - Verify the Redis connection settings in the `.env` file

3. **API Not Accessible**
   - Check if the API container is running: `docker-compose ps api`
   - Check the API logs: `docker-compose logs api`

4. **Container Fails to Start**
   - Check for port conflicts
   - Ensure all required environment variables are set
   - Check container logs: `docker-compose logs [service-name]`

## Backup and Restore

### Database Backup

```bash
docker-compose exec postgres pg_dump -U postgres resume_customizer > backup.sql
```

### Database Restore

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d resume_customizer
```

## Further Information

For more details about the application, refer to the main README.md file.
