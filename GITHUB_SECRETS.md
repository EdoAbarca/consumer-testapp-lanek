# GitHub Secrets Configuration for CI/CD

This document lists all the GitHub Secrets that should be configured in the repository settings to enable proper CI/CD pipeline execution.

## Required Secrets

### Backend Secrets

These secrets are used by the backend service during CI/CD runs:

| Secret Name | Description | Example Value | Required |
|------------|-------------|---------------|----------|
| `SECRET_KEY` | Flask secret key for session management | `your-super-secret-key-change-in-production-min-32-chars` | Optional* |
| `JWT_SECRET_KEY` | JWT token signing secret key | `your-jwt-secret-key-change-in-production-min-32-chars` | Optional* |

\* If not provided, default test values will be used during CI runs.

### Frontend Secrets

These secrets are used by the frontend service during CI/CD runs:

| Secret Name | Description | Example Value | Required |
|------------|-------------|---------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` | Optional* |
| `NEXTAUTH_URL` | NextAuth.js callback URL | `http://localhost:3000` | Optional* |
| `NEXTAUTH_SECRET` | NextAuth.js secret for encryption | `your-nextauth-secret-here-min-32-chars` | Optional* |

\* If not provided, default test values will be used during CI runs.

## How to Add GitHub Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Default Values Used in CI

When secrets are not configured, the CI/CD pipeline uses the following default values:

### Backend Defaults
```bash
SECRET_KEY=ci-test-secret-key-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
JWT_SECRET_KEY=ci-test-jwt-secret-key-z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0
DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
```

### Frontend Defaults
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ci-test-nextauth-secret-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## Production Deployment

⚠️ **Important**: The default values are only suitable for CI/CD testing. For production deployment, you **must** configure all secrets with secure, randomly generated values.

### Generating Secure Secrets

You can generate secure secrets using the following methods:

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Python:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

## Environment Variables in Workflow

The CI/CD workflow creates `.env` files with these secrets automatically:

- **Backend**: `.env` file in `backend/` directory
- **Frontend**: `.env.local` file in `frontend/` directory

These files are created at runtime and are never committed to the repository.

## Security Best Practices

1. ✅ Never commit secrets to version control
2. ✅ Use different secrets for different environments (dev, staging, production)
3. ✅ Rotate secrets regularly
4. ✅ Use secrets with sufficient entropy (at least 32 characters)
5. ✅ Limit access to secrets to only necessary team members
6. ✅ Enable secret scanning in your repository settings

## Troubleshooting

### Tests failing due to missing secrets

If you see errors like "SECRET_KEY not found" or authentication failures during CI runs, check:

1. Verify the workflow file (`.github/workflows/ci.yml`) has the correct secret references
2. Ensure the `.env` file creation steps are running successfully
3. Check the job logs to see which environment variables are being set

### Default values not working

If default values cause issues:

1. Add the required secrets to your repository
2. Ensure secret names match exactly (case-sensitive)
3. Verify secrets don't have trailing spaces or newlines

## Additional Configuration

For local development, create your own `.env` files based on the provided `.env.example` templates:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your local values

# Frontend  
cp .env.example .env
# Edit .env with your local values
```

These local `.env` files are gitignored and won't be committed to the repository.
