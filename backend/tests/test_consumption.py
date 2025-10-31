"""
Unit tests for consumption endpoints.

This module contains comprehensive tests for consumption data management
functionality including creation, validation, error handling, and user access control.
"""

import json
import pytest
from datetime import datetime, timedelta, timezone
from flask import Flask

from app import create_app, db
from app.models.user import User
from app.models.consumption import Consumption


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


@pytest.fixture
def test_user(app):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        password="testpassword123"
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authorization headers for test user."""
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = client.post(
        "/api/auth/login",
        data=json.dumps(login_data),
        content_type="application/json"
    )
    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestConsumptionCreation:
    """Test consumption record creation functionality."""

    def test_create_consumption_success(self, client, auth_headers):
        """Test successful consumption record creation."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 150.75,
            "type": "electricity",
            "notes": "Monthly reading"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json
        assert data["message"] == "Consumption record created successfully"
        assert "consumption" in data
        
        consumption = data["consumption"]
        assert consumption["value"] == 150.75
        assert consumption["type"] == "electricity"
        assert consumption["notes"] == "Monthly reading"
        assert "id" in consumption
        assert "created_at" in consumption

    def test_create_consumption_minimum_required_fields(self, client, auth_headers):
        """Test creating consumption with only required fields."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "water"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json
        consumption = data["consumption"]
        assert consumption["value"] == 100.0
        assert consumption["type"] == "water"
        assert consumption["notes"] is None

    def test_create_consumption_all_types(self, client, auth_headers):
        """Test creating consumption records for all valid types."""
        types = ["electricity", "water", "gas"]
        
        for consumption_type in types:
            consumption_data = {
                "date": "2023-10-15T10:00:00Z",
                "value": 50.0,
                "type": consumption_type
            }

            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers
            )

            assert response.status_code == 201
            data = response.json
            assert data["consumption"]["type"] == consumption_type


class TestConsumptionValidation:
    """Test consumption data validation."""

    def test_missing_required_fields(self, client, auth_headers):
        """Test validation when required fields are missing."""
        test_cases = [
            # Missing date
            {"value": 100.0, "type": "electricity"},
            # Missing value
            {"date": "2023-10-15T10:00:00Z", "type": "water"},
            # Missing type
            {"date": "2023-10-15T10:00:00Z", "value": 100.0},
            # Empty data
            {}
        ]

        for consumption_data in test_cases:
            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers
            )

            assert response.status_code == 400
            data = response.json
            assert data["error"] == "validation_error"
            assert "details" in data

    def test_invalid_consumption_type(self, client, auth_headers):
        """Test validation with invalid consumption type."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "invalid_type"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"
        assert "type" in data["details"]

    def test_negative_value(self, client, auth_headers):
        """Test validation with negative consumption value."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": -50.0,
            "type": "electricity"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"
        assert "value" in data["details"]

    def test_zero_value(self, client, auth_headers):
        """Test validation with zero consumption value."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 0.0,
            "type": "water"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"

    def test_future_date(self, client, auth_headers):
        """Test validation with future date."""
        future_date = (datetime.now() + timedelta(days=1)).isoformat() + "Z"
        consumption_data = {
            "date": future_date,
            "value": 100.0,
            "type": "gas"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"
        assert "date" in data["details"]

    def test_invalid_date_format(self, client, auth_headers):
        """Test validation with invalid date format."""
        consumption_data = {
            "date": "not-a-date",
            "value": 100.0,
            "type": "electricity"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"

    def test_long_notes(self, client, auth_headers):
        """Test validation with notes exceeding maximum length."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "electricity",
            "notes": "x" * 501  # Exceeds 500 character limit
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"
        assert "notes" in data["details"]


class TestConsumptionAuthentication:
    """Test authentication and authorization for consumption endpoints."""

    def test_create_consumption_without_token(self, client):
        """Test creating consumption without authentication token."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "electricity"
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json"
        )

        assert response.status_code == 401

    def test_create_consumption_with_invalid_token(self, client):
        """Test creating consumption with invalid authentication token."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "electricity"
        }

        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=headers
        )

        assert response.status_code == 422  # JWT validation error

    def test_create_consumption_inactive_user(self, client, app):
        """Test creating consumption with inactive user account."""
        # Create inactive user
        user = User(
            username="inactiveuser",
            email="inactive@example.com",
            password="testpassword123"
        )
        user.is_active = False
        db.session.add(user)
        db.session.commit()

        # Get token for inactive user
        login_data = {
            "email": "inactive@example.com",
            "password": "testpassword123"
        }
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json"
        )
        # Login should fail for inactive user, but let's test the consumption endpoint too
        
        if response.status_code == 200:
            token = response.json["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            consumption_data = {
                "date": "2023-10-15T10:00:00Z",
                "value": 100.0,
                "type": "electricity"
            }

            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=headers
            )

            assert response.status_code == 401
            data = response.json
            assert data["error"] == "inactive_user"


class TestConsumptionErrorHandling:
    """Test error handling for consumption endpoints."""

    def test_invalid_json(self, client, auth_headers):
        """Test handling of invalid JSON data."""
        response = client.post(
            "/api/consumption",
            data="invalid json",
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "invalid_request"

    def test_empty_request_body(self, client, auth_headers):
        """Test handling of empty request body."""
        response = client.post(
            "/api/consumption",
            content_type="application/json",
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "invalid_request"


class TestConsumptionModel:
    """Test the Consumption model functionality."""

    def test_consumption_creation(self, app, test_user):
        """Test creating a consumption model instance."""
        consumption_date = datetime.now(timezone.utc)
        consumption = Consumption(
            user_id=test_user.id,
            date=consumption_date,
            value=150.75,
            type="electricity",
            notes="Test consumption"
        )
        
        db.session.add(consumption)
        db.session.commit()

        assert consumption.id is not None
        assert consumption.user_id == test_user.id
        assert consumption.value == 150.75
        assert consumption.type == "electricity"
        assert consumption.notes == "Test consumption"

    def test_consumption_to_dict(self, app, test_user):
        """Test consumption to_dict method."""
        consumption_date = datetime.now(timezone.utc)
        consumption = Consumption(
            user_id=test_user.id,
            date=consumption_date,
            value=100.0,
            type="water",
            notes="Test notes"
        )
        
        db.session.add(consumption)
        db.session.commit()

        data = consumption.to_dict()
        assert data["user_id"] == test_user.id
        assert data["value"] == 100.0
        assert data["type"] == "water"
        assert data["notes"] == "Test notes"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_consumption_relationship(self, app, test_user):
        """Test consumption-user relationship."""
        consumption = Consumption(
            user_id=test_user.id,
            date=datetime.now(timezone.utc),
            value=75.5,
            type="gas"
        )
        
        db.session.add(consumption)
        db.session.commit()

        # Test relationship from consumption to user
        assert consumption.user.id == test_user.id
        assert consumption.user.username == test_user.username

        # Test relationship from user to consumptions
        assert len(test_user.consumptions) == 1
        assert test_user.consumptions[0].id == consumption.id

    def test_get_valid_types(self):
        """Test getting valid consumption types."""
        valid_types = Consumption.get_valid_types()
        assert "electricity" in valid_types
        assert "water" in valid_types
        assert "gas" in valid_types
        assert len(valid_types) == 3