# Consumer Data Management System
**Prueba Técnica Lanek / Lanek Technical Test**

A full-stack, decouples SaaS platform for consumption data management built with Flask (Python) and Next.js (TypeScript).

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/EdoAbarca/consumer-testapp-lanek.git
cd consumer-testapp-lanek

# 2. Install dependencies
make setup

# 3. Copy environment template
make env-copy

# 4. Start development servers
make dev
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 🏗️ Architecture

### Technology Stack

**Backend (Flask)**
- **Python 3.11+** with Flask framework - Chosen for rapid development and excellent ecosystem
- **PostgreSQL** database with SQLAlchemy ORM - Reliable, ACID-compliant with excellent JSON support
- **JWT Authentication** for secure multi-tenant access - Stateless, scalable authentication
- **uv** for modern Python dependency management - Faster alternative to pip with better resolution
- **Pydantic** for data validation - Type-safe API contracts and automatic validation
- **SQL alchemy** for ORM purposes

**Frontend (Next.js)**
- **Next.js 14** with TypeScript - Full-stack React framework with excellent developer experience
- **Tailwind CSS** for styling - Utility-first CSS framework for rapid UI development
- **React Hook Form** + **Zod** for form validation - Type-safe forms with minimal re-renders
- **Axios** for API communication - Promise-based HTTP client with interceptors
- **Jest** for testing - Comprehensive testing framework with great React integration
- **Zod** for frontend validation schema

**Infrastructure & DevOps**
- 🐳 **Docker** for containerization - Consistent development and deployment environments
- 🔧 **Make** for development automation - Simple, reliable build automation

### Project Structure

```
consumer-testapp-lanek/
├── backend/                 # Flask API application
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── auth/           # Authentication logic
│   │   └── utils/          # Helper functions
│   ├── tests/              # Backend tests
│   ├── pyproject.toml      # Python dependencies
│   └── main.py             # Application entry point
├── frontend/               # Next.js application
│   ├── src/
|   |   ├── app/            # Next.js' page renderer folder
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   └── package.json        # Node.js dependencies
├── docs/                   # Documentation
├── .github/workflows/      # CI/CD pipelines
└── Makefile               # Development automation
```


## Core Functionality
1. **User Registration & Login** - Secure authentication system
2. **Consumption Data Entry** - Track electricity, water, gas usage
3. **Data Visualization** - Charts and analytics dashboard
4. **Multi-tenant Architecture** - Complete user data isolation

## 🛠️ Development

### Prerequisites
- Python 3.11+ with [uv](https://github.com/astral-sh/uv) installed
- Node.js 18+ with npmw

### Available Commands

```bash
# Development
make dev              # Start both servers
make dev-backend      # Flask server only
make dev-frontend     # Next.js server only

# Testing
make test             # Run all tests
make test-backend     # Python tests only
make test-frontend    # Jest tests only
make test-coverage    # Run tests with coverage reports

# Code Quality
make lint             # Check code style (both backend and frontend)
make format           # Auto-format code (both backend and frontend)
make lint-backend     # Backend linting only
make lint-frontend    # Frontend linting only

# Database Management
make db-migrate       # Create migration
make db-upgrade       # Apply migrations
make db-reset         # Reset database (⚠️ destroys data)

# Docker Operations
make start            # Start all services with Docker
make stop             # Stop all services
make logs             # View logs from all services
make docker-build     # Build Docker images
make docker-clean     # Clean Docker resources

# Environment & Dependencies
make setup            # Complete development environment setup
make install-backend  # Install Python dependencies
make install-frontend # Install Node.js dependencies
make env-copy         # Copy environment templates

# Utilities
make clean            # Remove build artifacts
make health           # Check service health
make audit            # Run security audits
make info             # Project information
make help             # Show all commands
```

### Development Workflow

1. **Initial Setup** (first time only):
   ```bash
   make setup
   ```

2. **Daily Development**:
   ```bash
   # Start development servers
   make dev
   
   # Run tests before committing
   make test
   
   # Check code quality
   make lint
   ```

3. **Database Changes**:
   ```bash
   # Create migration after model changes
   make db-migrate MSG="add new field to user model"
   
   # Apply migrations
   make db-upgrade
   ```

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your database credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/consumer_testapp
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-here
   ```

## 🔧 Configuration

### Environment Variables Guide

The application uses environment variables for configuration. Here's a comprehensive guide:

#### Database Configuration
- `POSTGRES_DB`: Database name (default: `consumer_testapp`)
- `POSTGRES_USER`: Database username (default: `postgres`)
- `POSTGRES_PASSWORD`: Database password (**required**)
- `POSTGRES_PORT`: Database port (default: `5432`)

#### Backend Configuration
- `SECRET_KEY`: Flask secret key for sessions (**required**, min 32 chars)
- `JWT_SECRET_KEY`: JWT signing key (**required**, min 32 chars)
- `FLASK_ENV`: Environment mode (`development`/`production`)
- `DEBUG`: Enable debug mode (`true`/`false`)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `BACKEND_PORT`: Backend service port (default: `5000`)

#### Frontend Configuration
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:5000/api`)
- `NEXTAUTH_URL`: Frontend URL for NextAuth (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET`: NextAuth secret key (**required**, min 32 chars)
- `FRONTEND_PORT`: Frontend service port (default: `3000`)

#### Security Best Practices
- **Production**: Use strong, randomly generated keys for all `*_SECRET*` variables
- **Development**: The `.env.example` provides secure defaults for local development
- **Environment**: Never commit `.env` files to version control

## 🧪 Testing

The project includes comprehensive testing setup:

- **Backend**: pytest with coverage reporting
- **Frontend**: Jest with React Testing Library
- **CI/CD**: GitHub Actions for automated testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run specific test suites
make test-backend          # Backend tests only
make test-frontend         # Frontend tests only

# Individual test commands
cd backend && uv run pytest tests/ -v
cd frontend && npm run test
```

## � Database Schema

The system uses a multi-tenant PostgreSQL database with the following key entities:

### Core Tables

**Users Table**
- `id` (Primary Key): Unique user identifier
- `email`: User email address (unique)
- `password_hash`: Encrypted password
- `created_at`: Registration timestamp
- `updated_at`: Last modification timestamp

**Consumption Records Table**
- `id` (Primary Key): Unique record identifier
- `user_id` (Foreign Key): References Users.id
- `consumption_type`: Type of consumption (electricity, water, gas)
- `amount`: Consumption amount (decimal)
- `unit`: Unit of measurement (kWh, liters, m³)
- `period_start`: Start date of consumption period
- `period_end`: End date of consumption period
- `created_at`: Record creation timestamp

### Data Isolation

Each user's consumption data is completely isolated through the `user_id` foreign key constraint. All database queries include user-specific filtering to ensure multi-tenant security.

For detailed entity relationships, see the [ERD diagram](docs/erd-diagram.mermaid).

### Migration Management

```bash
# Create new migration
make db-migrate MSG="description of changes"

# Apply migrations
make db-upgrade

# Reset database (⚠️ destroys all data)
make db-reset
```

## Deployment
### Production Deployment with Docker

The application is designed for containerized deployment using Docker Compose.

#### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.0+
- Git

#### Quick Production Deployment

```bash
# 1. Clone the repository
git clone https://github.com/EdoAbarca/consumer-testapp-lanek.git
cd consumer-testapp-lanek

# 2. Set up production environment
cp .env.example .env
# Edit .env with production values (see Configuration section)

# 3. Deploy with production configuration
make docker-prod
```

#### Production Environment Configuration

For production deployment, update your `.env` file with:

```env
# Database (use strong credentials)
POSTGRES_PASSWORD=your-strong-production-password

# Security Keys (generate strong random keys)
SECRET_KEY=your-production-secret-key-min-32-characters
JWT_SECRET_KEY=your-production-jwt-secret-min-32-characters
NEXTAUTH_SECRET=your-production-nextauth-secret-min-32-characters

# Environment
FLASK_ENV=production
NODE_ENV=production
DEBUG=false

# URLs (update with your domain)
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXTAUTH_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
```

#### Docker Compose Profiles

The project includes three Docker Compose configurations:

1. **Development** (`docker-compose.yml` + `docker-compose.override.yml`):
   ```bash
   make docker-dev    # Hot reload, debug mode
   ```

2. **Production** (`docker-compose.yml` + `docker-compose.prod.yml`):
   ```bash
   make docker-prod   # Optimized builds, security hardened
   ```

3. **Basic** (`docker-compose.yml` only):
   ```bash
   make start         # Standard deployment
   ```

#### Service Management

```bash
# Start services
make start

# Stop services
make stop

# View logs
make logs

# Check service health
make health

# Restart services
docker compose restart

# Scale services (if needed)
docker compose up -d --scale backend=2
```

#### Database Backup and Recovery

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres consumer_testapp > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres consumer_testapp < backup.sql
```

#### Monitoring and Maintenance

```bash
# Check service status
make docker-status

# View resource usage
docker stats

# Clean up old images
make docker-clean

# Update to latest version
git pull origin main
make docker-build
make start
```

## 🔒 Security Features

- **JWT Authentication** - Stateless token-based auth with configurable expiration
- **Data Isolation** - Complete tenant separation at database level
- **Input Validation** - Pydantic/Zod schema validation on all endpoints
- **CORS Protection** - Configurable origin policies
- **Environment Variables** - Secure configuration management
- **Password Hashing** - Bcrypt with salt for password storage
- **SQL Injection Protection** - SQLAlchemy ORM with parameterized queries

### Security Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Use strong database passwords**
4. **Keep dependencies updated**
5. **Monitor logs for suspicious activity**
6. **Regular security audits**: `make audit`

## �️ Troubleshooting

### Common Issues and Solutions

#### 1. Setup and Installation Issues

**Problem**: `make setup` fails with "uv: command not found"
```bash
# Solution: Install uv first
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc  # or restart terminal
```

**Problem**: Node.js version compatibility issues
```bash
# Solution: Use Node.js 18+ (recommended: 20 LTS)
nvm install 20
nvm use 20
# Or with system package manager
sudo apt update && sudo apt install nodejs npm  # Ubuntu/Debian
brew install node  # macOS
```

**Problem**: Permission denied when running Docker commands
```bash
# Solution: Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Development Server Issues

**Problem**: Backend fails to start with database connection error
```bash
# Check if PostgreSQL is running
make docker-status

# Restart database service
docker compose restart postgres

# Check database logs
make docker-logs-db

# Verify environment variables
cat .env | grep POSTGRES
```

**Problem**: Frontend can't connect to backend API
```bash
# Verify backend is running
curl http://localhost:5000/api/auth/health

# Check CORS configuration
grep CORS_ORIGINS .env

# Verify API URL in frontend
grep NEXT_PUBLIC_API_URL frontend/.env
```

**Problem**: Port already in use errors
```bash
# Check what's using the port
lsof -i :3000  # Frontend port
lsof -i :5000  # Backend port
lsof -i :5432  # Database port

# Kill processes using the port
sudo kill -9 $(lsof -t -i:3000)

# Or change ports in .env file
```

#### 3. Database Issues

**Problem**: Migration fails or database schema is outdated
```bash
# Reset database (⚠️ destroys data)
make db-reset

# Or manually reset
cd backend
uv run flask db downgrade base
uv run flask db upgrade
```

**Problem**: "relation does not exist" errors
```bash
# Ensure migrations are applied
make db-upgrade

# Check migration status
cd backend && uv run flask db current

# Create missing migrations
cd backend && uv run flask db migrate -m "fix missing tables"
```

#### 4. Docker and Container Issues

**Problem**: "No space left on device" when building images
```bash
# Clean up Docker resources
make docker-clean

# Remove unused images and volumes
docker system prune -a --volumes
```

**Problem**: Services won't start or are unhealthy
```bash
# Check service status
make docker-status

# View detailed logs
make logs

# Restart specific service
docker compose restart backend
```

**Problem**: Database data persistence issues
```bash
# Check if volumes are properly mounted
docker volume ls | grep consumer

# Backup and restore if needed
docker compose exec postgres pg_dump -U postgres consumer_testapp > backup.sql
```

#### 5. Testing and Code Quality Issues

**Problem**: Tests fail with import errors
```bash
# Ensure dependencies are installed
make install-backend
make install-frontend

# Check Python path
cd backend && uv run python -c "import sys; print(sys.path)"

# Run tests with verbose output
cd backend && uv run pytest -v --tb=short
```

**Problem**: Linting errors blocking commits
```bash
# Auto-fix formatting issues
make format

# Check specific linting rules
make lint-backend
make lint-frontend

# Install pre-commit hooks
make pre-commit-install
```

#### 6. Performance and Resource Issues

**Problem**: High memory usage or slow performance
```bash
# Check container resource usage
docker stats

# Optimize Docker builds
docker compose build --no-cache

# Check for memory leaks in logs
make logs | grep -i "memory\|oom"
```

### Debug Mode

Enable detailed debugging by setting these environment variables:

```env
# Backend debugging
DEBUG=true
FLASK_ENV=development

# Frontend debugging
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### Getting Help

1. **Check logs first**: `make logs`
2. **Verify environment**: `cat .env`
3. **Test connectivity**: `make health`
4. **Clean restart**: `make stop && make clean && make start`

If issues persist:
- Check [GitHub Issues](https://github.com/EdoAbarca/consumer-testapp-lanek/issues)
- Review [project documentation](docs/)
- Ensure you're using supported versions (see Prerequisites)

### Health Check Script

Use the automated health check script:

```bash
# Run comprehensive health check
make docker-health

# Or manually
./scripts/health-check.sh
```

This script checks:
- ✅ Docker services status
- ✅ Database connectivity
- ✅ API endpoints response
- ✅ Frontend accessibility
- ✅ Environment configuration

## License

This project is developed as a technical test for Lanek. All rights reserved.
