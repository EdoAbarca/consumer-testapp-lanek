# Consumer TestApp Lanek - Development Automation Makefile
# 
# This Makefile provides convenient commands for development, testing, and deployment
# of the Consumer Data Management System.

.PHONY: help setup install-backend install-frontend install dev dev-backend dev-frontend build test test-backend test-frontend lint clean start stop logs

# Default target
help: ## Show this help message
	@echo "Consumer TestApp Lanek - Available Commands:"
	@echo ""
	@echo "\033[1;34mCore Development Lifecycle (US-5.3):\033[0m"
	@echo "  \033[36msetup\033[0m                Set up the entire development environment"
	@echo "  \033[36mbuild\033[0m                Build all containers (Docker images)"
	@echo "  \033[36mstart\033[0m                Start all services"
	@echo "  \033[36mstop\033[0m                 Stop all services"
	@echo "  \033[36mlogs\033[0m                 View logs from all services"
	@echo "  \033[36mclean\033[0m                Clean containers, volumes, and build artifacts"
	@echo ""
	@echo "\033[1;34mAll Available Commands:\033[0m"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Setup and Installation
setup: ## Set up the entire development environment
	@echo "🚀 Setting up Consumer TestApp Lanek development environment..."
	@echo "📋 Creating environment file..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "✅ .env file created from template. Please edit with your credentials."; else echo "⚠️  .env file already exists"; fi
	@make install-backend
	@make install-frontend
	@echo "🐳 Building Docker images..."
	@make docker-build
	@echo "✅ Setup complete! Use 'make start' to start services or 'make dev' for development servers."

install: setup ## Alias for setup

install-backend: ## Install backend dependencies using uv
	@echo "📦 Installing backend dependencies..."
	@cd backend && uv python install 3.11
	@cd backend && uv sync --dev
	@cd backend && uv run pip install pip-tools
	@echo "✅ Backend dependencies installed!"

install-frontend: ## Install frontend dependencies using npm
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✅ Frontend dependencies installed!"

# Project Lifecycle Commands (Required by US-5.3)
start: docker-up ## Start all services (alias for docker-up)

stop: docker-down ## Stop all services (alias for docker-down)

logs: docker-logs ## View logs from all services (alias for docker-logs)

clean: ## Clean containers, volumes, and build artifacts
	@echo "🧹 Cleaning up Docker resources and build artifacts..."
	@make docker-clean
	@echo "🧹 Cleaning local build artifacts..."
	@rm -rf backend/.pytest_cache
	@rm -rf backend/__pycache__
	@rm -rf backend/app/__pycache__
	@rm -rf backend/dist
	@rm -rf backend/build
	@rm -rf backend/*.egg-info
	@rm -rf frontend/.next
	@rm -rf frontend/dist
	@rm -rf frontend/build
	@echo "✅ Cleanup completed!"

# Development
dev: ## Start both backend and frontend development servers
	@echo "🔄 Starting development servers..."
	@make -j2 dev-backend dev-frontend

dev-backend: ## Start Flask development server
	@echo "🐍 Starting Flask backend server..."
	@cd backend && uv run python main.py

dev-frontend: ## Start Next.js development server
	@echo "⚛️  Starting Next.js frontend server..."
	@cd frontend && npm run dev

# Backend Environment Management
backend-init: ## Initialize backend uv environment
	@echo "🐍 Initializing backend uv environment..."
	@cd backend && uv venv --python 3.11
	@cd backend && uv sync --dev
	@echo "✅ Backend environment initialized!"

backend-requirements: ## Generate requirements.txt with hashes from pyproject.toml
	@echo "📝 Generating requirements.txt with hashes..."
	@cd backend && PATH=".:$$PATH" pip-compile --allow-unsafe --generate-hashes pyproject.toml --output-file ./requirements.txt
	@echo "✅ requirements.txt generated with SHA256 hashes!"

backend-requirements-upgrade: ## Upgrade and regenerate requirements.txt with hashes
	@echo "⬆️  Upgrading and regenerating requirements.txt..."
	@cd backend && PATH=".:$$PATH" pip-compile --allow-unsafe --generate-hashes --upgrade pyproject.toml --output-file ./requirements.txt
	@echo "✅ requirements.txt upgraded with latest versions and hashes!"

backend-requirements-uv: ## Generate requirements.txt using uv directly (fallback)
	@echo "📝 Generating requirements.txt with hashes using uv..."
	@echo "⚠️  Note: Using uv pip compile directly"
	@cd backend && uv pip compile --generate-hashes pyproject.toml --output-file ./requirements.txt
	@echo "✅ requirements.txt generated with SHA256 hashes!"

backend-install-from-requirements: ## Install from requirements.txt (production)
	@echo "📦 Installing from requirements.txt..."
	@cd backend && uv pip install -r requirements.txt
	@echo "✅ Dependencies installed from requirements.txt!"

pre-commit-install: ## Install pre-commit hooks
	@echo "🔧 Installing pre-commit hooks..."
	@cd backend && uv run pre-commit install
	@echo "✅ Pre-commit hooks installed!"

# Building
build: ## Build all containers (includes Docker images and local builds)
	@echo "🏗️  Building all containers and applications..."
	@make docker-build
	@make build-backend
	@make build-frontend
	@echo "✅ All builds completed!"

build-backend: ## Build backend (prepare for deployment)
	@echo "🐍 Building backend..."
	@cd backend && uv build

build-frontend: ## Build frontend for production
	@echo "⚛️  Building frontend..."
	@cd frontend && npm run build

# Testing
test: ## Run all tests
	@echo "🧪 Running all tests..."
	@make test-backend
	@make test-frontend

test-backend: ## Run backend tests
	@echo "🐍 Running backend tests..."
	@cd backend && uv run pytest -v

test-frontend: ## Run frontend tests
	@echo "⚛️  Running frontend tests..."
	@cd frontend && npm run test

test-coverage: ## Run tests with coverage reports
	@echo "📊 Running tests with coverage..."
	@cd backend && uv run pytest --cov=app --cov-report=html --cov-report=term
	@cd frontend && npm run test -- --coverage

# Docker Orchestration
docker-up: ## Start all services with Docker Compose
	@echo "🐳 Starting all services with Docker Compose..."
	@docker compose up -d
	@echo "✅ Services started! Frontend: http://localhost:3000, Backend: http://localhost:5000"

docker-dev: ## Start services in development mode with hot reload
	@echo "🐳 Starting development environment with Docker Compose..."
	@docker compose -f docker-compose.yml -f docker-compose.override.yml up
	@echo "✅ Development environment started!"

docker-prod: ## Start services in production mode
	@echo "🐳 Starting production environment with Docker Compose..."
	@docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started!"

docker-build: ## Build all Docker images
	@echo "🐳 Building Docker images..."
	@docker compose build

docker-down: ## Stop and remove all containers
	@echo "🐳 Stopping and removing containers..."
	@docker compose down

docker-clean: ## Clean up Docker resources (containers, networks, volumes)
	@echo "🐳 Cleaning up Docker resources..."
	@docker compose down -v --remove-orphans
	@docker system prune -f

docker-logs: ## Show logs from all services
	@echo "🐳 Showing Docker Compose logs..."
	@docker compose logs -f

docker-logs-backend: ## Show backend service logs
	@echo "🐳 Showing backend service logs..."
	@docker compose logs -f backend

docker-logs-frontend: ## Show frontend service logs
	@echo "🐳 Showing frontend service logs..."
	@docker compose logs -f frontend

docker-logs-db: ## Show database service logs
	@echo "🐳 Showing database service logs..."
	@docker compose logs -f postgres

docker-restart: ## Restart all services
	@echo "🐳 Restarting all services..."
	@docker compose restart

docker-status: ## Show status of all services
	@echo "🐳 Docker Compose services status:"
	@docker compose ps

docker-health: ## Run comprehensive health check
	@echo "🏥 Running health check..."
	@./scripts/health-check.sh

# Code Quality
lint: ## Run linting on both backend and frontend
	@echo "🔍 Running linting..."
	@make lint-backend
	@make lint-frontend

lint-backend: ## Run backend linting and formatting
	@echo "🐍 Linting backend code..."
	@cd backend && uv run black --check .
	@cd backend && uv run isort --check-only .
	@cd backend && uv run flake8 .
	@cd backend && uv run mypy .

lint-frontend: ## Run frontend linting
	@echo "⚛️  Linting frontend code..."
	@cd frontend && npm run lint

format: ## Format code in both backend and frontend
	@echo "✨ Formatting code..."
	@make format-backend
	@make format-frontend

format-backend: ## Format backend code
	@echo "🐍 Formatting backend code..."
	@cd backend && uv run black .
	@cd backend && uv run isort .

format-frontend: ## Format frontend code
	@echo "⚛️  Formatting frontend code..."
	@cd frontend && npm run lint -- --fix

# Database
db-init: ## Initialize database with migrations
	@echo "🗄️  Initializing database..."
	@cd backend && uv run flask db init

db-migrate: ## Create new database migration
	@echo "🗄️  Creating database migration..."
	@cd backend && uv run flask db migrate -m "$(MSG)"

db-upgrade: ## Apply database migrations
	@echo "🗄️  Applying database migrations..."
	@cd backend && uv run flask db upgrade

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "⚠️  Resetting database..."
	@cd backend && uv run flask db downgrade base
	@cd backend && uv run flask db upgrade

# Environment Management
env-copy: ## Copy environment template
	@echo "📋 Copying environment template..."
	@cp backend/.env.example backend/.env
	@cp frontend/.env.example frontend/.env
	@echo "✅ Environment files created! Please edit .env files with your configuration."

clean-deps: ## Remove all dependencies (nuclear option)
	@echo "💣 Removing all dependencies..."
	@rm -rf backend/.venv
	@rm -rf backend/uv.lock
	@rm -rf frontend/node_modules
	@echo "✅ Dependencies removed! Run 'make setup' to reinstall."

# Security and Audit
audit: ## Run security audits
	@echo "🔒 Running security audits..."
	@cd backend && uv run pip-audit || echo "pip-audit not available"
	@cd frontend && npm audit

# Health Checks
health: ## Check if services are running
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:5000/api/auth/health || echo "❌ Backend not responding"
	@curl -f http://localhost:3000/api/health || echo "❌ Frontend not responding"

# Documentation
docs: ## Generate project documentation
	@echo "📚 Generating documentation..."
	@cd backend && uv run sphinx-build -b html docs docs/_build/html || echo "Sphinx not configured yet"

# Project Information
info: ## Show project information
	@echo "📋 Consumer TestApp Lanek - Project Information"
	@echo ""
	@echo "Backend (Flask):"
	@echo "  📁 Location: ./backend/"
	@echo "  🐍 Python: $(shell cd backend && uv run python --version 2>/dev/null || echo 'Not installed')"
	@echo "  📦 Dependencies: $(shell cd backend && uv run pip list 2>/dev/null | wc -l || echo 'Not available') packages"
	@echo ""
	@echo "Frontend (Next.js):"
	@echo "  📁 Location: ./frontend/"
	@echo "  🟢 Node: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "  📦 Dependencies: $(shell cd frontend && npm list --depth=0 2>/dev/null | grep -c '├──' || echo 'Not installed')"
	@echo ""
	@echo "Development URLs:"
	@echo "  🌐 Frontend: http://localhost:3000"
	@echo "  🔗 Backend API: http://localhost:5000/api"
	@echo ""

# Quick Start Guide
quick-start: ## Show quick start guide
	@echo "🚀 Consumer TestApp Lanek - Quick Start Guide"
	@echo ""
	@echo "1. First time setup:"
	@echo "   make setup"
	@echo ""
	@echo "2. Initialize backend environment:"
	@echo "   make backend-init"
	@echo ""
	@echo "3. Generate requirements.txt with hashes:"
	@echo "   make backend-requirements"
	@echo ""
	@echo "4. Install pre-commit hooks:"
	@echo "   make pre-commit-install"
	@echo ""
	@echo "5. Copy environment templates:"
	@echo "   make env-copy"
	@echo ""
	@echo "6. Start development servers:"
	@echo "   make dev"
	@echo ""
	@echo "Commands for requirements.txt:"
	@echo "   make backend-requirements         # Generate with hashes"
	@echo "   make backend-requirements-upgrade # Upgrade all deps"
	@echo ""
	@echo "For more commands, run: make help"