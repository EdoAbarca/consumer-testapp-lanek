# System Architecture Documentation

## Overview

The Consumer Data Management System is a full-stack, decoupled SaaS platform built with modern technologies to manage consumption data (electricity, water, gas) with multi-tenant architecture. The system follows a clean separation between frontend and backend with JWT-based authentication and complete data isolation between users.

## Technology Stack

### Backend (Flask API)
- **Framework**: Flask with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Dependency Management**: uv (modern Python package manager)
- **Data Validation**: Pydantic schemas
- **Testing**: pytest with coverage reporting
- **API Documentation**: Swagger/OpenAPI (Flasgger)

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Charts**: Chart.js with react-chartjs-2
- **Testing**: Jest + React Testing Library

### Infrastructure
- **Database**: PostgreSQL (containerized)
- **Containerization**: Docker with Docker Compose
- **Development**: Hot reload for both frontend and backend
- **Build Automation**: Makefile for development workflows

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │    │   (Flask)       │    │   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React/TypeScript   │ • REST API      │    │ • User data     │
│ • Tailwind CSS  │◄──►│ • JWT Auth      │◄──►│ • Consumption   │
│ • Chart.js      │    │ • SQLAlchemy    │    │   records       │
│ • Axios         │    │ • Pydantic      │    │ • Multi-tenant  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   Port 3000     │    │   Port 5000     │
│   (Development) │    │   (API Server)  │
└─────────────────┘    └─────────────────┘
```

## Project Structure

```
consumer-testapp-lanek/
├── backend/                    # Flask API Application
│   ├── app/
│   │   ├── __init__.py        # Application factory
│   │   ├── config.py          # Environment configurations
│   │   ├── models/            # Database models (SQLAlchemy)
│   │   │   ├── user.py        # User authentication model
│   │   │   └── consumption.py # Consumption data model
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py        # Authentication routes
│   │   │   └── consumption.py # Consumption CRUD routes
│   │   ├── auth/              # Authentication logic
│   │   ├── schemas/           # Pydantic validation schemas
│   │   └── utils/             # Utility functions (JWT, etc.)
│   ├── tests/                 # Backend test suites
│   ├── migrations/            # Database migrations (Alembic)
│   ├── main.py               # Application entry point
│   └── pyproject.toml        # Python dependencies and config
├── frontend/                  # Next.js Application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable React components
│   │   ├── context/          # React Context (Auth, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (API client, etc.)
│   │   ├── types/            # TypeScript type definitions
│   │   └── styles/           # Global styles
│   ├── __tests__/            # Frontend test suites
│   └── package.json          # Node.js dependencies
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Container orchestration
└── Makefile                  # Development automation
```

## Core Components

### 1. Backend API (Flask)

#### Application Factory Pattern
- **Location**: `backend/app/__init__.py`
- **Purpose**: Creates and configures Flask application instances
- **Features**: 
  - Extension initialization (SQLAlchemy, JWT, CORS, Swagger)
  - Error handling configuration
  - Blueprint registration

#### Configuration Management
- **Location**: `backend/app/config.py`
- **Environment Support**: Development, Testing, Production
- **Key Settings**: Database URLs, JWT secrets, CORS origins

#### Data Models
- **User Model** (`backend/app/models/user.py`):
  - Authentication and profile management
  - Password hashing with bcrypt
  - Relationship to consumption records
  
- **Consumption Model** (`backend/app/models/consumption.py`):
  - Tracks electricity, water, gas usage
  - Enum-based consumption types
  - User foreign key for multi-tenancy

#### API Routes
- **Authentication** (`backend/app/routes/auth.py`):
  - User registration and login
  - JWT token generation and validation
  
- **Consumption** (`backend/app/routes/consumption.py`):
  - CRUD operations for consumption data
  - User-specific data filtering
  - Analytics aggregation endpoints

### 2. Frontend Application (Next.js)

#### Application Structure
- **App Router**: Next.js 14's file-based routing system
- **TypeScript**: Full type safety across the application
- **Component Architecture**: Modular, reusable components

#### State Management
- **React Context**: Authentication state management
- **Local State**: Component-level state with React hooks
- **Form State**: React Hook Form for complex forms

#### API Integration
- **API Client** (`frontend/src/lib/api.ts`):
  - Configured Axios instance
  - Request/response interceptors
  - Error handling and token management

#### UI Components
- **Responsive Design**: Tailwind CSS for mobile-first UI
- **Charts**: Chart.js integration for analytics visualization
- **Forms**: Validated forms with Zod schemas

### 3. Database Schema

#### Users Table
```sql
users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Consumptions Table
```sql
consumptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FOREIGN KEY REFERENCES users(id),
  consumption_type ENUM('electricity', 'water', 'gas') NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  consumption_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Security Architecture

### Authentication Flow
1. **User Registration**: Password hashing with bcrypt
2. **Login**: Credential validation and JWT generation
3. **Token-based Auth**: JWT tokens for stateless authentication
4. **Multi-tenancy**: User ID-based data isolation

### Data Protection
- **Password Security**: bcrypt hashing with salt
- **Token Expiration**: Configurable access/refresh token lifetimes
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Pydantic (backend) and Zod (frontend) schemas

## Development Workflow

### Environment Setup
1. **Dependencies**: `make setup` installs all dependencies
2. **Environment**: `.env` file for configuration
3. **Database**: PostgreSQL container via Docker Compose
4. **Development Servers**: Concurrent backend and frontend development

### Available Commands
```bash
# Core Development Lifecycle
make setup          # Complete environment setup
make dev            # Start both development servers
make build          # Build Docker containers
make test           # Run all tests
make clean          # Clean build artifacts

# Service-specific Commands
make dev-backend    # Flask development server
make dev-frontend   # Next.js development server
make test-backend   # Python tests with pytest
make test-frontend  # JavaScript tests with Jest

# Database Management
make db-migrate     # Create new migration
make db-upgrade     # Apply migrations
```

### Testing Strategy
- **Backend**: pytest with coverage reporting, integration tests
- **Frontend**: Jest with React Testing Library, component testing
- **API Testing**: Request/response validation
- **Database Testing**: In-memory SQLite for test isolation

## Deployment Architecture

### Containerization
- **Multi-service Docker Compose**: Separate containers for each service
- **Environment Variables**: Configuration via environment files
- **Volume Persistence**: Database and log persistence
- **Health Checks**: Service dependency management

### Production Considerations
- **Environment Separation**: Development, staging, production configurations
- **Secret Management**: Environment-based secret injection
- **Database Migrations**: Automated migration application
- **Monitoring**: Structured logging and health endpoints

## API Design

### RESTful Endpoints
```
Authentication:
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Token refresh

Consumption Management:
GET    /api/consumption    # List user's consumption records
POST   /api/consumption    # Create new consumption record
GET    /api/consumption/{id} # Get specific record
PUT    /api/consumption/{id} # Update record
DELETE /api/consumption/{id} # Delete record

Analytics:
GET /api/consumption/analytics # Aggregated consumption data
```

### Request/Response Format
- **Content Type**: `application/json`
- **Authentication**: `Authorization: Bearer <jwt_token>`
- **Error Handling**: Structured error responses with status codes
- **Validation**: Schema-based request validation

## Scalability Considerations

### Current Architecture
- **Stateless API**: JWT-based authentication for horizontal scaling
- **Database Separation**: PostgreSQL for production workloads
- **Containerized Services**: Easy deployment and scaling

### Future Enhancements
- **Caching Layer**: Redis for session and data caching
- **Load Balancing**: Multiple API instances behind load balancer
- **Database Optimization**: Connection pooling and query optimization
- **CDN Integration**: Static asset delivery optimization

## Monitoring and Observability

### Logging
- **Structured Logging**: JSON-formatted logs for parsing
- **Log Levels**: Configurable verbosity for different environments
- **Request Tracking**: API request/response logging

### Health Checks
- **Service Health**: Individual service health endpoints
- **Database Connectivity**: Database connection validation
- **Dependency Checks**: External service availability

This architecture provides a solid foundation for a scalable, maintainable consumption data management system with clear separation of concerns and modern development practices.