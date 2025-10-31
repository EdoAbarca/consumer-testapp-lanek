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
- 🐍 **Python 3.11+** with Flask framework
- 🗄️ **PostgreSQL** database with SQLAlchemy ORM
- 🔐 **JWT Authentication** for secure multi-tenant access
- 📦 **uv** for modern Python dependency management
- ✅ **Pydantic** for data validation

**Frontend (Next.js)**
- ⚛️ **Next.js 14** with TypeScript
- 🎨 **Tailwind CSS** for styling
- 📝 **React Hook Form** + **Zod** for form validation
- 🔗 **Axios** for API communication
- 🧪 **Jest** for testing

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

## 📊 Features

### MVP Scope
- [x] **Project Structure** - Professional development setup
- [ ] **User Authentication** - Registration and login with JWT
- [ ] **Consumption Management** - Add and view consumption data
- [ ] **Multi-tenant Security** - User data isolation
- [ ] **Basic Analytics** - Simple charts and KPIs
- [ ] **Responsive UI** - Mobile-friendly interface

### Core Functionality
1. **User Registration & Login** - Secure authentication system
2. **Consumption Data Entry** - Track electricity, water, gas usage
3. **Data Visualization** - Charts and analytics dashboard
4. **Multi-tenant Architecture** - Complete user data isolation

## 🛠️ Development

### Prerequisites
- Python 3.11+ with [uv](https://github.com/astral-sh/uv) installed
- Node.js 18+ with npm
- PostgreSQL database

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

# Code Quality
make lint             # Check code style
make format           # Auto-format code

# Database
make db-migrate       # Create migration
make db-upgrade       # Apply migrations

# Utilities
make clean            # Remove build artifacts
make info             # Project information
make help             # Show all commands
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

## 🧪 Testing

The project includes comprehensive testing setup:

- **Backend**: pytest with coverage reporting
- **Frontend**: Jest with React Testing Library
- **CI/CD**: GitHub Actions for automated testing

```bash
# Run tests with coverage
make test-coverage

# Run specific test suites
cd backend && uv run pytest tests/
cd frontend && npm run test
```

## 📈 Database Schema

The system uses a multi-tenant PostgreSQL database with the following key entities:

- **Users** - Authentication and user management
- **Consumption Records** - Usage data (electricity, water, gas)

See `docs/erd-diagram.md` for detailed entity relationships.

## 🔒 Security Features (W.I.P.)

- **JWT Authentication** - Stateless token-based auth
- **Data Isolation** - Complete tenant separation
- **Input Validation** - Pydantic/Zod schema validation
- **CORS Protection** - Configurable origin policies
- **Environment Variables** - Secure configuration management

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/health` - Service health check

### Consumption Endpoints
- `GET /api/consumption/` - List user's consumption data
- `POST /api/consumption/` - Add new consumption record
- `GET /api/consumption/health` - Service health check

Detailed API documentation will be available using Swagger once implemented.

## 📝 License

This project is developed as a technical test for Lanek. All rights reserved.
