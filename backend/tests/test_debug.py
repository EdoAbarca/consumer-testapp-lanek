"""
Debug test for authentication flow.
"""

import json
from datetime import timedelta

import pytest

from app import create_app, db
from app.models.user import User


@pytest.fixture
def app():
    """Create a test Flask application."""
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SECRET_KEY = "test-secret-key"
        JWT_SECRET_KEY = "test-jwt-secret-key"
        JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
        JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)
        WTF_CSRF_ENABLED = False
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


def test_auth_flow_debug(client):
    """Debug the complete authentication flow."""
    # Step 1: Register user
    registration_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
    }

    register_response = client.post(
        "/api/auth/register",
        data=json.dumps(registration_data),
        content_type="application/json",
    )

    print(f"Register status: {register_response.status_code}")
    print(f"Register response: {register_response.get_json()}")

    # Step 2: Login
    login_data = {"email": "test@example.com", "password": "testpassword123"}

    login_response = client.post(
        "/api/auth/login", data=json.dumps(login_data), content_type="application/json"
    )

    print(f"Login status: {login_response.status_code}")
    print(f"Login response: {login_response.get_json()}")

    if login_response.status_code == 200:
        token = login_response.json["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 3: Test consumption endpoint
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 150.75,
            "type": "electricity",
            "notes": "Monthly reading",
        }

        consumption_response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=headers,
        )

        print(f"Consumption status: {consumption_response.status_code}")
        print(f"Consumption response: {consumption_response.get_json()}")

        assert consumption_response.status_code == 201
    else:
        assert False, "Login failed"
