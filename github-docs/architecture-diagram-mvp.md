# MVP Architecture Diagram (24-Hour Build)

```mermaid
graph TB
    %% User Interface
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    %% Simplified Frontend (4 pages max)
    subgraph "Frontend - Next.js (6 hours build)"
        Login[Login Page]
        Dashboard[Dashboard + Stats]
        AddForm[Add Consumption Form]
        ListView[List View]
        AuthState[Auth Context]
        APIClient[Axios Client]
    end

    %% Simplified Backend (minimal endpoints)
    subgraph "Backend - Flask API (6 hours build)"
        AuthEndpoint[POST /auth/login]
        ConsumptionEndpoints[GET/POST /consumption]
        StatsEndpoint[GET /stats]
        JWTMiddleware[JWT Middleware]
        UserFilter[User Data Isolation]
    end

    %% Minimal Database (2 tables only)
    subgraph "Database - PostgreSQL"
        UsersTable[(users table)]
        ConsumptionTable[(consumption_records table)]
    end

    %% Docker Infrastructure (2 hours setup)
    subgraph "Container Infrastructure"
        DockerCompose[docker-compose.yml]
        FrontendContainer[nextjs:latest]
        BackendContainer[python:3.11]
        DBContainer[postgres:15]
    end

    %% Core Data Flow (simplified)
    Browser --> Login
    Login --> AuthEndpoint
    AuthEndpoint --> JWTMiddleware
    JWTMiddleware --> UsersTable
    
    Browser --> Dashboard
    Dashboard --> StatsEndpoint
    StatsEndpoint --> UserFilter
    UserFilter --> ConsumptionTable
    
    Browser --> AddForm
    AddForm --> ConsumptionEndpoints
    ConsumptionEndpoints --> UserFilter
    
    Browser --> ListView
    ListView --> ConsumptionEndpoints
    
    %% Auth Flow
    AuthState -.-> APIClient
    APIClient -.-> AuthEndpoint
    APIClient -.-> ConsumptionEndpoints
    APIClient -.-> StatsEndpoint

    %% Container Orchestration
    DockerCompose --> FrontendContainer
    DockerCompose --> BackendContainer  
    DockerCompose --> DBContainer
    
    FrontendContainer --> Frontend
    BackendContainer --> Backend
    DBContainer --> Database

    %% Styling for clarity
    classDef mvpFocus fill:#4caf50,stroke:#2e7d32,stroke-width:3px
    classDef frontend fill:#2196f3,stroke:#1565c0,stroke-width:2px
    classDef backend fill:#ff9800,stroke:#e65100,stroke-width:2px
    classDef database fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px
    classDef container fill:#607d8b,stroke:#37474f,stroke-width:2px

    class Login,Dashboard,AddForm,ListView mvpFocus
    class AuthState,APIClient,Frontend frontend
    class AuthEndpoint,ConsumptionEndpoints,StatsEndpoint,JWTMiddleware,UserFilter,Backend backend
    class UsersTable,ConsumptionTable,Database database
    class DockerCompose,FrontendContainer,BackendContainer,DBContainer container
```

## MVP Architecture Principles (24-Hour Constraints)

### 🎯 Core Design Decisions

#### Simplification Strategy:
- **Single Page App mentality** - minimal routing
- **4 pages maximum** - login, dashboard, add, list
- **3 API endpoints** - auth, consumption CRUD, basic stats
- **2 database tables** - users and consumption_records
- **1 authentication method** - JWT only

#### Technology Choices for Speed:

**Frontend (Next.js - 6 hours):**
```
/pages
├── login.tsx          (2 hours)
├── dashboard.tsx      (2 hours) 
├── add.tsx           (1 hour)
└── list.tsx          (1 hour)

/components
├── Layout.tsx        (shared header/nav)
├── ConsumptionForm.tsx
└── ConsumptionTable.tsx
```

**Backend (Flask - 6 hours):**
```
/backend
├── app.py            (main Flask app)
├── auth.py           (JWT handling)  
├── models.py         (2 SQLAlchemy models)
├── consumption.py    (CRUD endpoints)
└── requirements.txt
```

**Database (PostgreSQL - 1 hour setup):**
```sql
-- Users table (minimal)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    name VARCHAR
);

-- Consumption records table (minimal)  
CREATE TABLE consumption_records (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    consumption_date DATE,
    consumption_value DECIMAL,
    consumption_type VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 🚀 MVP Data Flow

#### 1. Authentication Flow (Simplified)
```
Login Form → POST /auth/login → JWT Token → LocalStorage → All API Calls
```

#### 2. Add Consumption Flow
```
Add Form → Validation → POST /consumption → Database → Redirect to List
```

#### 3. View Data Flow  
```
List Page → GET /consumption?user_id=X → Filter by User → Return JSON → Display Table
```

#### 4. Dashboard Flow
```
Dashboard → GET /stats?user_id=X → Aggregate Query → Basic Chart → Display
```

### 📦 Docker Deployment (2 hours)

**docker-compose.yml Structure:**
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    
  backend:  
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [database]
    environment:
      - DATABASE_URL=postgresql://user:pass@database:5432/consumption_db
      
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=consumption_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes: ["./data:/var/lib/postgresql/data"]
```

### ⚡ Performance Optimizations for MVP

#### Frontend Optimizations:
- **Static generation** where possible
- **Minimal JavaScript** - only essential libraries
- **Tailwind CSS** - utility-first, fast development
- **No complex state management** - React Context only

#### Backend Optimizations:
- **Basic connection pooling** (SQLAlchemy default)
- **Simple JWT** - no refresh tokens for MVP
- **Minimal middleware** - only auth and CORS
- **Direct SQL queries** for stats (faster than ORM)

#### Database Optimizations:
- **Essential indexes only**:
  ```sql
  CREATE INDEX idx_consumption_user_date ON consumption_records(user_id, consumption_date);
  CREATE INDEX idx_users_email ON users(email);
  ```

### 🔒 MVP Security (Minimal but Functional)

#### Authentication:
- **JWT tokens** with 24-hour expiration
- **bcrypt password hashing**
- **User ID in JWT payload** for data filtering

#### Authorization:
- **User-based data filtering** on every query
- **No admin roles** - all users equal for MVP
- **Basic input validation** - Pydantic + Zod

#### Data Protection:
- **Environment variables** for secrets
- **SQL injection prevention** via SQLAlchemy
- **Basic CORS** configuration

### 📊 MVP Metrics & Monitoring

#### Success Metrics:
- **Login success rate** > 95%
- **Form submission success** > 90%
- **Page load time** < 2 seconds
- **Zero console errors** in production

#### Basic Monitoring:
- **Docker health checks**
- **Database connection status**
- **API response times** (Flask built-in logging)

### 🛠️ Development Workflow (24 hours)

#### Hour-by-Hour Breakdown:

**Hours 1-3: Backend Foundation**
- Flask setup + PostgreSQL connection
- User model + auth endpoints
- JWT middleware

**Hours 4-6: Core API**  
- Consumption model + CRUD endpoints
- Basic stats endpoint
- API testing with curl/Postman

**Hours 7-9: Frontend Foundation**
- Next.js setup + Tailwind
- Login page + auth context
- Protected route wrapper

**Hours 10-12: Core Pages**
- Dashboard with basic stats
- Add consumption form
- List view with table

**Hours 13-15: Integration**
- Connect frontend to API
- Error handling + loading states
- Basic styling + responsive design

**Hours 16-18: Polish & Features**
- Dashboard chart implementation
- Form validation improvements
- UI/UX refinements

**Hours 19-21: Deployment**
- Docker containerization
- docker-compose setup
- Environment configuration

**Hours 22-24: Testing & Documentation**
- End-to-end testing
- README documentation
- Demo data setup

This architecture prioritizes **working functionality over complexity**, ensuring a professional-looking system can be built and deployed within the 24-hour constraint.