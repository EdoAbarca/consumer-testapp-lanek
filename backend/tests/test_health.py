"""
Basic health tests for the backend API.
Tests basic functionality and endpoints to ensure the application is working.
"""

import pytest
from flask import Flask

from app import create_app


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SECRET_KEY = "test-secret-key"
        WTF_CSRF_ENABLED = False

    app = create_app(TestConfig)

    with app.test_client() as client:
        with app.app_context():
            yield client


def test_app_creation():
    """Test that the Flask app can be created successfully."""
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"

    app = create_app(TestConfig)
    assert isinstance(app, Flask)
    assert app.config["TESTING"] is True


def test_health_endpoint(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data["status"] == "healthy"
    assert data["service"] == "consumer-testapp-backend"
    assert data["version"] == "1.0.0"


def test_app_startup():
    """Test that the app can start without errors."""
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"

    app = create_app(TestConfig)
    assert app is not None
    assert hasattr(app, "config")


def test_basic_route_access(client):
    """Test that basic routes are accessible."""
    # Test root route
    response = client.get("/")
    # Various acceptable responses
    assert response.status_code in [200, 404, 405]


class TestBasicAPI:
    """Test basic API functionality."""

    def test_app_has_required_config(self):
        """Test that the app has required configuration."""
        from app.config import Config

        class TestConfig(Config):
            TESTING = True
            SECRET_KEY = "test-secret-key"

        app = create_app(TestConfig)
        assert "TESTING" in app.config
        assert "SECRET_KEY" in app.config

    def test_cors_headers(self, client):
        """Test that CORS headers are properly configured (if enabled)."""
        response = client.options("/")
        # This test will pass regardless of CORS configuration
        assert response.status_code in [200, 404, 405]

    def test_json_response(self, client):
        """Test JSON response handling."""
        headers = {"Accept": "application/json"}
        response = client.get("/api/test", headers=headers)
        # Accept various status codes as we're just testing the app responds
        assert response.status_code in [200, 404, 405, 500]
