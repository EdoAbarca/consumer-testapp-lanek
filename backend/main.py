"""
Main application entry point.

This module serves as the entry point for the Flask application.
"""

import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import create_app  # noqa: E402
from app.config import DevelopmentConfig, ProductionConfig  # noqa: E402

# Determine configuration based on environment
config_class = (
    DevelopmentConfig
    if os.environ.get("FLASK_ENV") == "development"
    else ProductionConfig
)

# Create Flask application instance
app = create_app(config_class)

if __name__ == "__main__":
    # Run the application in development mode
    app.run(
        host=os.environ.get("FLASK_HOST", "0.0.0.0"),
        port=int(os.environ.get("FLASK_PORT", 5000)),
        debug=os.environ.get("FLASK_ENV") == "development",
    )
