"""
Integration tests for the authentication API.

This module contains integration tests that test the complete flow
from HTTP request to database storage.
"""

import json
import pytest

from app import create_app, db
from app.models.user import User


@pytest.fixture
def app():
    """Create a test Flask application for integration tests."""
    from app.config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SECRET_KEY = "test-secret-key"
        JWT_SECRET_KEY = "test-jwt-secret-key"
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
    """Create a test client for integration tests."""
    return app.test_client()


class TestRegistrationIntegration:
    """Integration tests for user registration."""

    def test_full_registration_flow(self, client, app):
        """Test the complete registration flow from API to database."""
        # Test data
        registration_data = {
            "username": "integrationuser",
            "email": "integration@example.com",
            "password": "IntegrationPass123!",
            "confirm_password": "IntegrationPass123!"
        }

        # Step 1: Make registration request
        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )

        # Step 2: Verify API response
        assert response.status_code == 201
        
        response_data = response.get_json()
        assert response_data is not None
        assert response_data["username"] == "integrationuser"
        assert response_data["email"] == "integration@example.com"
        assert response_data["is_active"] is True
        assert "id" in response_data
        assert "created_at" in response_data
        assert response_data["message"] == "User registered successfully"

        # Step 3: Verify database persistence
        with app.app_context():
            user = User.query.filter_by(email="integration@example.com").first()
            assert user is not None
            assert user.username == "integrationuser"
            assert user.email == "integration@example.com"
            assert user.is_active is True
            assert user.password_hash is not None
            assert user.password_hash != "IntegrationPass123!"  # Password should be hashed
            assert user.check_password("IntegrationPass123!") is True
            assert user.check_password("WrongPassword") is False

        # Step 4: Verify user can be found using model methods
        with app.app_context():
            found_by_email = User.find_by_email("integration@example.com")
            assert found_by_email is not None
            assert found_by_email.id == user.id

            found_by_username = User.find_by_username("integrationuser")
            assert found_by_username is not None
            assert found_by_username.id == user.id

    def test_registration_prevents_duplicate_users(self, client, app):
        """Test that registration prevents creating duplicate users."""
        registration_data = {
            "username": "duplicatetest",
            "email": "duplicate@example.com",
            "password": "TestPass123!",
            "confirm_password": "TestPass123!"
        }

        # Register first user
        response1 = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )
        assert response1.status_code == 201

        # Try to register with same email
        duplicate_email_data = {
            "username": "differentuser",
            "email": "duplicate@example.com",  # Same email
            "password": "DifferentPass123!",
            "confirm_password": "DifferentPass123!"
        }

        response2 = client.post(
            "/api/auth/register",
            data=json.dumps(duplicate_email_data),
            content_type="application/json"
        )
        assert response2.status_code == 400

        # Try to register with same username
        duplicate_username_data = {
            "username": "duplicatetest",  # Same username
            "email": "different@example.com",
            "password": "DifferentPass123!",
            "confirm_password": "DifferentPass123!"
        }

        response3 = client.post(
            "/api/auth/register",
            data=json.dumps(duplicate_username_data),
            content_type="application/json"
        )
        assert response3.status_code == 400

        # Verify only one user exists in database
        with app.app_context():
            users = User.query.all()
            assert len(users) == 1
            assert users[0].username == "duplicatetest"
            assert users[0].email == "duplicate@example.com"

    def test_registration_with_case_insensitive_email(self, client, app):
        """Test that email case is normalized and duplicate detection works case-insensitively."""
        # Register with uppercase email
        registration_data = {
            "username": "casetest",
            "email": "CaseTest@EXAMPLE.COM",
            "password": "CasePass123!",
            "confirm_password": "CasePass123!"
        }

        response = client.post(
            "/api/auth/register",
            data=json.dumps(registration_data),
            content_type="application/json"
        )
        assert response.status_code == 201

        # Verify email is stored in lowercase
        with app.app_context():
            user = User.query.first()
            assert user.email == "casetest@example.com"  # Should be lowercase

        # Try to register with same email in different case
        duplicate_data = {
            "username": "anotheruser",
            "email": "casetest@example.com",  # Lowercase version
            "password": "AnotherPass123!",
            "confirm_password": "AnotherPass123!"
        }

        response2 = client.post(
            "/api/auth/register",
            data=json.dumps(duplicate_data),
            content_type="application/json"
        )
        assert response2.status_code == 400

        data = response2.get_json()
        assert data["error"] == "email_exists"

    def test_multiple_successful_registrations(self, client, app):
        """Test that multiple users can be registered successfully."""
        users_data = [
            {
                "username": "user1",
                "email": "user1@example.com",
                "password": "Pass123!",
                "confirm_password": "Pass123!"
            },
            {
                "username": "user2",
                "email": "user2@example.com",
                "password": "Pass456!",
                "confirm_password": "Pass456!"
            },
            {
                "username": "user3",
                "email": "user3@example.com",
                "password": "Pass789!",
                "confirm_password": "Pass789!"
            }
        ]

        # Register all users
        for user_data in users_data:
            response = client.post(
                "/api/auth/register",
                data=json.dumps(user_data),
                content_type="application/json"
            )
            assert response.status_code == 201

        # Verify all users exist in database
        with app.app_context():
            users = User.query.all()
            assert len(users) == 3

            usernames = {user.username for user in users}
            emails = {user.email for user in users}

            assert usernames == {"user1", "user2", "user3"}
            assert emails == {"user1@example.com", "user2@example.com", "user3@example.com"}

            # Verify all passwords work
            for user in users:
                expected_password = f"Pass{user.username[-1]}{'23' if user.username[-1] == '1' else '56' if user.username[-1] == '2' else '89'}!"
                assert user.check_password(expected_password) is True