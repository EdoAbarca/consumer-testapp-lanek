# Docker Orchestration Setup

This document explains how to use Docker Compose to run the Consumer TestApp Lanek application stack.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Git

## Quick Start

1. **Clone the repository and navigate to it:**
   ```bash
   git clone <repository-url>
   cd consumer-testapp-lanek
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file with your secure credentials:**
   ```bash
   nano .env
   ```
   
   **Important:** Change all default passwords and secrets before running!

4. **Start the application stack:**
   ```bash
   # For development (with hot reload)
   make docker-dev
   
   # Or for production
   make docker-prod
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Database: localhost:5432 (internal access only in production)

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
POSTGRES_DB=consumer_testapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here

# Backend
SECRET_KEY=your-super-secret-key-32-chars-minimum
JWT_SECRET_KEY=your-jwt-secret-key-32-chars-minimum
FLASK_ENV=development

# Frontend
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-minimum
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Security Notes

- **Never commit `.env` files to version control**
- Change all default passwords and secrets before deployment
- Use strong, randomly generated secrets (32+ characters)
- For production, use proper secret management solutions

## Docker Compose Files

### Primary Files

- `docker-compose.yml`: Base configuration for all environments
- `docker-compose.override.yml`: Development overrides (hot reload, debugging)
- `docker-compose.prod.yml`: Production overrides (optimized, secure)

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Next.js)     │◄──►│    (Flask)      │◄──►│   Database      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Available Commands

### Using Make (Recommended)

```bash
# Start development environment
make docker-dev

# Start production environment  
make docker-prod

# Build all images
make docker-build

# Stop all services
make docker-down

# Clean up all resources
make docker-clean

# View logs
make docker-logs
make docker-logs-backend
make docker-logs-frontend
make docker-logs-db

# Check service status
make docker-status
```

### Using Docker Compose Directly

```bash
# Development mode (hot reload enabled)
docker-compose up

# Production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Build images
docker-compose build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## Development vs Production

### Development Mode

- **Hot reload:** Code changes automatically reflected
- **Debug mode:** Detailed error messages and debugging enabled
- **Volume mounts:** Source code mounted for live editing
- **Port exposure:** All services accessible from host

**Start with:**
```bash
make docker-dev
# or
docker-compose up
```

### Production Mode

- **Optimized builds:** Multi-stage Docker builds for smaller images
- **Security:** Database not exposed to host, minimal attack surface
- **Performance:** Production-optimized configurations
- **Logging:** Structured logging for monitoring

**Start with:**
```bash
make docker-prod
# or
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Persistent Data

### Volumes

- `postgres_data`: Database files (persistent across container restarts)
- `backend_logs`: Application logs from the backend service

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres consumer_testapp > backup.sql

# Restore backup  
docker-compose exec -T postgres psql -U postgres consumer_testapp < backup.sql
```

## Networking

All services communicate through a custom bridge network `consumer-testapp-network`:

- **Frontend** → **Backend**: HTTP requests to backend container
- **Backend** → **Database**: PostgreSQL connection to postgres container
- **Host** → **Services**: Port forwarding for development access

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Backend**: HTTP request to `/health` endpoint  
- **Frontend**: HTTP request to root path

Monitor health:
```bash
docker-compose ps
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Change ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=5001
   POSTGRES_PORT=5433
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Database connection errors:**
   ```bash
   # Check database is ready
   docker-compose logs postgres
   
   # Restart services in order
   docker-compose restart postgres
   docker-compose restart backend
   ```

4. **Build failures:**
   ```bash
   # Clean rebuild
   make docker-clean
   make docker-build
   ```

### Debugging

```bash
# Access container shells
docker-compose exec backend bash
docker-compose exec frontend sh
docker-compose exec postgres psql -U postgres

# View real-time logs
make docker-logs

# Check resource usage
docker stats
```

## Next Steps

1. **Set up monitoring:** Add logging and monitoring solutions
2. **Configure CI/CD:** Automate testing and deployment
3. **Add reverse proxy:** Use Nginx for production deployments
4. **Set up backups:** Implement automated database backups
5. **Security hardening:** Add SSL/TLS, security headers, rate limiting

## Support

For issues related to Docker setup, check:

1. [Docker Compose documentation](https://docs.docker.com/compose/)
2. [Project GitHub Issues](https://github.com/EdoAbarca/consumer-testapp-lanek/issues)
3. Application logs: `make docker-logs`