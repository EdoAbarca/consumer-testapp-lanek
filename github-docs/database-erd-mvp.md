# MVP Database Design (24-Hour Build)

```mermaid
erDiagram
    %% MVP Users Table (Minimal)
    User {
        uuid id PK "Primary Key"
        varchar email UK "Unique email - login identifier"
        varchar password_hash "bcrypt hashed password"
        varchar name "Display name"
        timestamp created_at "Account creation"
    }

    %% MVP Consumption Records (Core Entity)
    ConsumptionRecord {
        uuid id PK "Primary Key"
        uuid user_id FK "Foreign Key to User"
        date consumption_date "Date of consumption"
        decimal consumption_value "Consumption amount"
        varchar consumption_type "Type: electricity, water, gas"
        text notes "Optional user notes"
        timestamp created_at "Record creation timestamp"
    }

    %% MVP Relationship (Simple One-to-Many)
    User ||--o{ ConsumptionRecord : "creates"

    %% Essential Indexes Only
    User {
        index idx_users_email "email"
    }

    ConsumptionRecord {
        index idx_consumption_user_date "user_id, consumption_date"
        constraint chk_positive_value "consumption_value > 0"
    }
```

## MVP Database Strategy

### 🎯 Radical Simplification for 24 Hours

**Core Principle:** Two tables maximum, essential fields only, zero complexity.

#### What's IN the MVP Database:
✅ **User authentication** (login only)  
✅ **Core consumption data** (date, value, type)  
✅ **Data isolation** (user_id foreign key)  
✅ **Essential indexes** (performance)  

#### What's OUT of MVP Database:
❌ User registration workflow  
❌ Audit logging  
❌ KPI configurations  
❌ User sessions tracking  
❌ Categories/subcategories  
❌ File attachments  
❌ Complex relationships  

### 📊 Table Specifications

#### Users Table (5 minutes to create)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Essential index for login performance
CREATE INDEX idx_users_email ON users(email);

-- Demo data for 24h build
INSERT INTO users (email, password_hash, name) VALUES 
('demo@example.com', '$2b$12$..hash..', 'Demo User'),
('admin@example.com', '$2b$12$..hash..', 'Admin User'),
('test@example.com', '$2b$12$..hash..', 'Test User');
```

#### Consumption Records Table (10 minutes to create)
```sql
CREATE TABLE consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consumption_date DATE NOT NULL,
    consumption_value DECIMAL(10,2) NOT NULL,
    consumption_type VARCHAR(20) NOT NULL CHECK (consumption_type IN ('electricity', 'water', 'gas')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Critical index for user data isolation and performance
CREATE INDEX idx_consumption_user_date ON consumption_records(user_id, consumption_date DESC);

-- Value validation
ALTER TABLE consumption_records ADD CONSTRAINT chk_positive_value CHECK (consumption_value > 0);

-- Demo data for charts and testing
INSERT INTO consumption_records (user_id, consumption_date, consumption_value, consumption_type, notes) VALUES 
((SELECT id FROM users WHERE email = 'demo@example.com'), '2024-10-01', 150.50, 'electricity', 'October reading'),
((SELECT id FROM users WHERE email = 'demo@example.com'), '2024-10-15', 75.25, 'water', 'Mid-month reading'),
((SELECT id FROM users WHERE email = 'admin@example.com'), '2024-10-01', 200.00, 'gas', 'Heating season start');
```

### 🚀 MVP Database Schema Benefits

#### 1. **Ultra-Fast Development** (15 minutes total)
- Only 2 CREATE TABLE statements
- Minimal field validation
- Demo data included for immediate testing

#### 2. **Multi-Tenant Ready**
- Every query MUST include `user_id` filter
- Data isolation enforced at database level
- No accidental cross-user data leaks

#### 3. **Performance Optimized**
- Single compound index handles most queries
- UUID primary keys for better distribution
- Decimal type for precise consumption values

#### 4. **Extensible Foundation**
- Additional fields can be added later
- Relationship structure supports future complexity
- UUID keys allow easy scaling

### 📝 MVP SQL Queries (Copy-Paste Ready)

#### Authentication Queries:
```sql
-- Login verification
SELECT id, email, name 
FROM users 
WHERE email = $1 AND password_hash = $2;

-- User lookup for JWT payload
SELECT id, email, name 
FROM users 
WHERE id = $1;
```

#### Consumption CRUD Queries:
```sql
-- Create new consumption record
INSERT INTO consumption_records (user_id, consumption_date, consumption_value, consumption_type, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- Get user's consumption records (paginated)
SELECT id, consumption_date, consumption_value, consumption_type, notes, created_at
FROM consumption_records 
WHERE user_id = $1 
ORDER BY consumption_date DESC, created_at DESC
LIMIT $2 OFFSET $3;

-- Count user's total records (for pagination)
SELECT COUNT(*) 
FROM consumption_records 
WHERE user_id = $1;
```

#### Analytics Queries (for Dashboard):
```sql
-- Total consumption by type
SELECT consumption_type, SUM(consumption_value) as total_value
FROM consumption_records 
WHERE user_id = $1 
GROUP BY consumption_type;

-- Monthly consumption trend (last 6 months)
SELECT 
    DATE_TRUNC('month', consumption_date) as month,
    SUM(consumption_value) as total_value
FROM consumption_records 
WHERE user_id = $1 
    AND consumption_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', consumption_date)
ORDER BY month;

-- Basic user statistics
SELECT 
    COUNT(*) as total_records,
    SUM(consumption_value) as total_consumption,
    AVG(consumption_value) as avg_consumption,
    MAX(consumption_date) as latest_date
FROM consumption_records 
WHERE user_id = $1;
```

### 🔒 MVP Security Considerations

#### Data Isolation:
```python
# Every Flask endpoint MUST include user filtering
@app.route('/consumption')
@jwt_required()
def get_consumption():
    user_id = get_jwt_identity()  # From JWT token
    records = ConsumptionRecord.query.filter_by(user_id=user_id).all()
    return records
```

#### Input Validation:
```python
# Pydantic model for API validation
class ConsumptionCreate(BaseModel):
    consumption_date: date
    consumption_value: Decimal = Field(gt=0, decimal_places=2)
    consumption_type: Literal['electricity', 'water', 'gas']
    notes: Optional[str] = Field(max_length=500)
```

### 🛠️ Database Setup Script (5 minutes)

**`/backend/init_db.py`**
```python
from sqlalchemy import create_engine, text
import os

def setup_mvp_database():
    """Initialize MVP database with tables and demo data"""
    
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/consumption_db')
    engine = create_engine(DATABASE_URL)
    
    # Create tables
    with engine.connect() as conn:
        # Users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Consumption records table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS consumption_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                consumption_date DATE NOT NULL,
                consumption_value DECIMAL(10,2) NOT NULL CHECK (consumption_value > 0),
                consumption_type VARCHAR(20) NOT NULL CHECK (consumption_type IN ('electricity', 'water', 'gas')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Essential indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_consumption_user_date ON consumption_records(user_id, consumption_date DESC);"))
        
        conn.commit()
        print("✅ MVP Database setup complete!")

if __name__ == "__main__":
    setup_mvp_database()
```

### 📈 Migration Strategy for Post-MVP

After the 24-hour build, the database can be extended:

```sql
-- Future enhancements (post-MVP)
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE consumption_records ADD COLUMN cost DECIMAL(10,2);
ALTER TABLE consumption_records ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Additional tables for advanced features
CREATE TABLE consumption_categories (...);
CREATE TABLE user_settings (...);
CREATE TABLE audit_logs (...);
```

This MVP database design prioritizes **immediate functionality** and **rapid development** while maintaining a solid foundation for future enhancements. The two-table structure can handle thousands of users and millions of consumption records efficiently.