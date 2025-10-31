# Backend Dockerfile - Python Flask Application
# Use Python 3.11 slim image for smaller size and security

FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 flaskuser && \
    useradd --uid 1001 --gid flaskuser --shell /bin/bash --create-home flaskuser

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p logs && \
    chown -R flaskuser:flaskuser /app

# Switch to non-root user
USER flaskuser

# Expose port
EXPOSE 5000

# Environment variables for Flask
ENV FLASK_APP=main.py \
    FLASK_ENV=production \
    FLASK_HOST=0.0.0.0 \
    FLASK_PORT=5000

# Health check to ensure the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Create a simple health endpoint check script
RUN echo 'import sys\nimport urllib.request\ntry:\n    response = urllib.request.urlopen("http://localhost:5000/health", timeout=5)\n    if response.getcode() == 200:\n        sys.exit(0)\n    else:\n        sys.exit(1)\nexcept Exception:\n    sys.exit(1)' > healthcheck.py

# Default command to run the application
CMD ["python", "main.py"]