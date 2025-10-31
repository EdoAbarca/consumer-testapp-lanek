"""
Main application entry point.

This module serves as the entry point for the Flask application.
"""

import os

from app import create_app

# Create Flask application instance
app = create_app()

if __name__ == "__main__":
    # Run the application in development mode
    app.run(
        host=os.environ.get("FLASK_HOST", "0.0.0.0"),
        port=int(os.environ.get("FLASK_PORT", 5000)),
        debug=os.environ.get("FLASK_ENV") == "development",
    )
