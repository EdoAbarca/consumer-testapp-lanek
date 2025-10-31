# Backend README

This directory contains the Flask backend application for the Consumer Data Management System.

## Structure

- `app/` - Main application package
  - `models/` - SQLAlchemy database models
  - `routes/` - API endpoint blueprints
  - `auth/` - Authentication logic
  - `utils/` - Utility functions
- `tests/` - Test files
- `migrations/` - Database migration files
- `pyproject.toml` - Python project configuration
- `requirements.txt` - Hashed dependencies for production
- `main.py` - Application entry point

## Development

The application uses `uv` for dependency management. To set up:

```bash
# Initialize uv environment
uv venv --python 3.11

# Install dependencies for development
uv sync --dev

# Generate requirements.txt with hashes (IMPORTANT for production)
uv pip compile pyproject.toml -o requirements.txt

# Run the application
uv run python main.py

# Run tests
uv run pytest
```

## Requirements Management

This project uses `pyproject.toml` for dependency specification and generates a `requirements.txt` file with SHA256 hashes for production deployment:

```bash
# Generate requirements.txt with hashes
uv pip compile pyproject.toml -o requirements.txt

# Upgrade all dependencies and regenerate with hashes
uv pip compile --upgrade pyproject.toml -o requirements.txt

# Install from requirements.txt (production)
uv pip install -r requirements.txt
```

The `requirements.txt` file includes SHA256 hashes for all dependencies to ensure reproducible and secure installations.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key