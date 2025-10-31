"""
Unit tests for authentication endpoints.

This module contains comprehensive tests for user registration and authentication
functionality including validation, error handling, and database operations.
"""

import json
import pytest
from datetime import timedelta
from flask import Flask

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
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner for the Flask application."""
    return app.test_cli_runner()


class TestAuthHealthEndpoint:
    """Test cases for the authentication health endpoint."""

    def test_auth_health_endpoint(self, client):
        """Test the authentication health check endpoint."""
        response = client.get("/api/auth/health")
        assert response.status_code == 200

        data = response.get_json()
        assert data is not None
        assert data["status"] == "ok"
        assert data["service"] == "auth"


class TestUserRegistration:
    """Test cases for user registration functionality."""

    def test_successful_registration(self, client):
        """Test successful user registration with valid data."""
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )

        assert response.status_code == 201

        data = response.get_json()
        assert data is not None
        assert data["id"] is not None
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["is_active"] is True
        assert data["created_at"] is not None
        assert data["message"] == "User registered successfully"


class TestLoginEndpoint:
    """Test cases for the user login endpoint."""

    def test_successful_login(self, client, app):
        """Test successful user login."""
        # First register a user
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
        
        client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json",
        )

        # Now test login
        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        json_response = json.loads(response.data)

        # Check response structure
        assert "access_token" in json_response
        assert "refresh_token" in json_response
        assert "user" in json_response
        assert "message" in json_response

        # Check user data
        assert json_response["user"]["username"] == "testuser"
        assert json_response["user"]["email"] == "test@example.com"
        assert json_response["user"]["is_active"] is True
        assert json_response["message"] == "Login successful"

        # Check tokens are strings and not empty
        assert isinstance(json_response["access_token"], str)
        assert len(json_response["access_token"]) > 0
        assert isinstance(json_response["refresh_token"], str)
        assert len(json_response["refresh_token"]) > 0

    def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "testpass123"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "invalid_credentials"
        assert json_response["message"] == "Invalid email or password"

    def test_login_invalid_password(self, client, app):
        """Test login with wrong password."""
        # First register a user
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
        
        client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json",
        )

        # Now test login with wrong password
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "invalid_credentials"
        assert json_response["message"] == "Invalid email or password"

    def test_login_inactive_user(self, client, app):
        """Test login with deactivated user account."""
        # First register a user
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
        
        client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json",
        )

        # Deactivate the user
        with app.app_context():
            user = User.find_by_email("test@example.com")
            user.is_active = False
            db.session.commit()

        # Now test login
        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "inactive_account"
        assert json_response["message"] == "User account is deactivated"

    def test_login_missing_content_type(self, client):
        """Test login without proper content-type header."""
        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            # Missing content_type="application/json"
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "invalid_content_type"
        assert json_response["message"] == "Content-Type must be application/json"

    def test_login_invalid_json(self, client):
        """Test login with invalid JSON payload."""
        response = client.post(
            "/api/auth/login",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "invalid_json"
        assert json_response["message"] == "Invalid JSON payload"

    def test_login_validation_errors(self, client):
        """Test login with validation errors."""
        # Test missing fields
        login_data = {"email": "test@example.com"}  # Missing password

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "validation_error"
        assert "details" in json_response

        # Test invalid email format
        login_data = {
            "email": "invalid-email",
            "password": "testpass123"
        }

        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        json_response = json.loads(response.data)
        assert json_response["error"] == "validation_error"
        assert "details" in json_response


class TestProtectedRoutes:
    """Test cases for JWT-protected routes."""

    def test_access_protected_route_with_valid_token(self, client, app):
        """Test accessing protected route with valid JWT token."""
        # First register and login a user
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
        
        client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json",
        )

        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }

        login_response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert login_response.status_code == 200
        login_json = json.loads(login_response.data)
        access_token = login_json["access_token"]

        # Now access protected route with token
        response = client.get(
            "/api/consumption/dashboard",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        json_response = json.loads(response.data)
        assert json_response["message"] == "Welcome to the dashboard"
        assert json_response["user"]["username"] == "testuser"
        assert json_response["user"]["email"] == "test@example.com"

    def test_access_protected_route_without_token(self, client):
        """Test accessing protected route without token."""
        response = client.get("/api/consumption/dashboard")

        assert response.status_code == 401
        json_response = json.loads(response.data)
        assert json_response["error"] == "missing_token"
        assert json_response["message"] == "Authorization token is required"

    def test_access_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token."""
        response = client.get(
            "/api/consumption/dashboard",
            headers={"Authorization": "Bearer invalid_token_here"}
        )

        assert response.status_code == 401
        json_response = json.loads(response.data)
        assert json_response["error"] == "invalid_token"

        # Verify user was created in database
        user = User.query.filter_by(email="test@example.com").first()
        assert user is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.check_password("SecurePass123!")

    def test_duplicate_email_registration(self, client):
        """Test registration with an email that already exists."""
        # Create first user
        registration_data = {
            "username": "firstuser",
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )
        assert response.status_code == 201

        # Try to register with same email
        duplicate_data = {
            "username": "seconduser",
            "email": "test@example.com",  # Same email
            "password": "AnotherPass123!",
            "confirm_password": "AnotherPass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(duplicate_data),
            content_type="application/json"
        )

        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "email_exists"
        assert data["message"] == "An account with this email already exists"

    def test_duplicate_username_registration(self, client):
        """Test registration with a username that already exists."""
        # Create first user
        registration_data = {
            "username": "testuser",
            "email": "first@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )
        assert response.status_code == 201

        # Try to register with same username
        duplicate_data = {
            "username": "testuser",  # Same username
            "email": "second@example.com",
            "password": "AnotherPass123!",
            "confirm_password": "AnotherPass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(duplicate_data),
            content_type="application/json"
        )

        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "username_exists"
        assert data["message"] == "This username is already taken"

    def test_password_mismatch_validation(self, client):
        """Test registration with password and confirm_password that don't match."""
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "DifferentPass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )

        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "validation_error"
        assert data["message"] == "Request validation failed"
        assert "Password and confirm password do not match" in str(data["details"])

    def test_invalid_email_validation(self, client):
        """Test registration with invalid email format."""
        registration_data = {
            "username": "testuser",
            "email": "invalid-email-format",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )

        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "validation_error"
        assert data["message"] == "Request validation failed"
        assert "email" in data["details"]

    def test_weak_password_validation(self, client):
        """Test registration with passwords that don't meet strength requirements."""
        test_cases = [
            {
                "password": "short",
                "expected_error": "at least 8 characters"
            },
            {
                "password": "NoNumbers!",
                "expected_error": "at least one number"
            },
            {
                "password": "12345678",
                "expected_error": "at least one letter"
            }
        ]

        for case in test_cases:
            registration_data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": case["password"],
                "confirm_password": case["password"]
            }

            response = client.post(
                "/api/auth/register",
                data=json.dumps(registration_data),
                content_type="application/json"
            )

            assert response.status_code == 400

            data = response.get_json()
            assert data is not None
            assert data["error"] == "validation_error"
            assert case["expected_error"] in str(data["details"])

    def test_invalid_username_validation(self, client):
        """Test registration with invalid username formats."""
        test_cases = [
            "user with spaces",
            "user@invalid",
            "user#invalid",
            "",
            "ab"  # Too short
        ]

        for username in test_cases:
            registration_data = {
                "username": username,
                "email": "test@example.com",
                "password": "SecurePass123!",
                "confirm_password": "SecurePass123!"
            }

            response = client.post(
                "/api/auth/register",
                data=json.dumps(registration_data),
                content_type="application/json"
            )

            assert response.status_code == 400

            data = response.get_json()
            assert data is not None
            assert data["error"] == "validation_error"

    def test_missing_required_fields(self, client):
        """Test registration with missing required fields."""
        test_cases = [
            {},  # All fields missing
            {"username": "testuser"},  # Missing email, password, confirm_password
            {"email": "test@example.com"},  # Missing username, password, confirm_password
            {"username": "testuser", "email": "test@example.com"},  # Missing passwords
            {
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123!"
            }  # Missing confirm_password
        ]

        for registration_data in test_cases:
            response = client.post(
                "/api/auth/register",
                data=json.dumps(registration_data),
                content_type="application/json"
            )

            assert response.status_code == 400

            data = response.get_json()
            assert data is not None
            assert data["error"] == "validation_error"

    def test_invalid_json_payload(self, client):
        """Test registration with invalid JSON payload."""
        response = client.post(
            "/api/auth/register",
            data="invalid json",
            content_type="application/json"
        )

        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "invalid_json"
        assert data["message"] == "Invalid JSON payload"

    def test_missing_content_type(self, client):
        """Test registration without proper content type header."""
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data)
            # Missing content_type="application/json"
        )

        # Should return 400 for invalid content type
        assert response.status_code == 400

        data = response.get_json()
        assert data is not None
        assert data["error"] == "invalid_content_type"
        assert data["message"] == "Content-Type must be application/json"


class TestUserModel:
    """Test cases for the User model."""

    def test_user_creation(self, app):
        """Test User model creation and basic functionality."""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                password="SecurePass123!"
            )

            assert user.username == "testuser"
            assert user.email == "test@example.com"
            assert user.password_hash is not None
            assert user.password_hash != "SecurePass123!"  # Should be hashed
            assert user.is_active is True

    def test_password_hashing(self, app):
        """Test password hashing and verification."""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                password="SecurePass123!"
            )

            # Password should be hashed
            assert user.password_hash != "SecurePass123!"

            # Password verification should work
            assert user.check_password("SecurePass123!") is True
            assert user.check_password("WrongPassword") is False

    def test_email_normalization(self, app):
        """Test that email addresses are normalized to lowercase."""
        with app.app_context():
            user = User(
                username="testuser",
                email="Test@EXAMPLE.COM",
                password="SecurePass123!"
            )

            assert user.email == "test@example.com"

    def test_user_find_methods(self, app):
        """Test User model class methods for finding users."""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                password="SecurePass123!"
            )
            db.session.add(user)
            db.session.commit()

            # Test find_by_email
            found_user = User.find_by_email("test@example.com")
            assert found_user is not None
            assert found_user.username == "testuser"

            # Test find_by_email case insensitive
            found_user = User.find_by_email("TEST@EXAMPLE.COM")
            assert found_user is not None

            # Test find_by_username
            found_user = User.find_by_username("testuser")
            assert found_user is not None
            assert found_user.email == "test@example.com"

            # Test not found
            assert User.find_by_email("notfound@example.com") is None
            assert User.find_by_username("notfound") is None

    def test_user_to_dict(self, app):
        """Test User model to_dict method."""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                password="SecurePass123!"
            )
            db.session.add(user)
            db.session.commit()

            # Test without sensitive data
            data = user.to_dict()
            assert "id" in data
            assert data["username"] == "testuser"
            assert data["email"] == "test@example.com"
            assert data["is_active"] is True
            assert "created_at" in data
            assert "updated_at" in data
            assert "password_hash" not in data

            # Test with sensitive data
            data_with_sensitive = user.to_dict(include_sensitive=True)
            assert "password_hash" in data_with_sensitive

    def test_user_repr(self, app):
        """Test User model string representation."""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                password="SecurePass123!"
            )

            repr_str = repr(user)
            assert "testuser" in repr_str
            assert "test@example.com" in repr_str


class TestUserRegistrationSchema:
    """Test cases for the UserRegistrationRequest schema."""

    def test_valid_schema_validation(self):
        """Test schema validation with valid data."""
        from app.schemas import UserRegistrationRequest

        valid_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        schema = UserRegistrationRequest.model_validate(valid_data)
        assert schema.username == "testuser"
        assert schema.email == "test@example.com"
        assert schema.password == "SecurePass123!"
        assert schema.confirm_password == "SecurePass123!"

    def test_username_validation(self):
        """Test username validation rules."""
        from app.schemas import UserRegistrationRequest
        from pydantic import ValidationError

        # Test valid usernames
        valid_usernames = ["testuser", "test_user", "test-user", "user123", "123user"]
        for username in valid_usernames:
            data = {
                "username": username,
                "email": "test@example.com",
                "password": "SecurePass123!",
                "confirm_password": "SecurePass123!"
            }
            schema = UserRegistrationRequest.model_validate(data)
            assert schema.username == username.lower()

        # Test invalid usernames
        invalid_usernames = ["test user", "test@user", "test#user", ""]
        for username in invalid_usernames:
            data = {
                "username": username,
                "email": "test@example.com",
                "password": "SecurePass123!",
                "confirm_password": "SecurePass123!"
            }
            with pytest.raises(ValidationError):
                UserRegistrationRequest.model_validate(data)