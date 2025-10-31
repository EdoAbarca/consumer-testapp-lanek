"""
Unit tests for consumption endpoints.

This module contains comprehensive tests for consumption data management
functionality including creation, validation, error handling, and user access control.
"""

import json
from datetime import datetime, timedelta, timezone

import pytest
from flask import Flask

from app import create_app, db
from app.models.consumption import Consumption
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


@pytest.fixture
def test_user(app):
    """Create a test user."""
    user = User(
        username="testuser", email="test@example.com", password="testpassword123"
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authorization headers for test user."""
    login_data = {"email": "test@example.com", "password": "testpassword123"}
    response = client.post(
        "/api/auth/login", data=json.dumps(login_data), content_type="application/json"
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
            "notes": "Monthly reading",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
            "type": "water",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
                "type": consumption_type,
            }

            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers,
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
            {},
        ]

        for consumption_data in test_cases:
            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers,
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
            "type": "invalid_type",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
            "type": "electricity",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
            "type": "water",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"

    def test_future_date(self, client, auth_headers):
        """Test validation with future date."""
        future_date = (datetime.now() + timedelta(days=1)).isoformat() + "Z"
        consumption_data = {"date": future_date, "value": 100.0, "type": "gas"}

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "validation_error"
        assert "date" in data["details"]

    def test_invalid_date_format(self, client, auth_headers):
        """Test validation with invalid date format."""
        consumption_data = {"date": "not-a-date", "value": 100.0, "type": "electricity"}

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
            "notes": "x" * 501,  # Exceeds 500 character limit
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
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
            "type": "electricity",
        }

        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
        )

        assert response.status_code == 401

    def test_create_consumption_with_invalid_token(self, client):
        """Test creating consumption with invalid authentication token."""
        consumption_data = {
            "date": "2023-10-15T10:00:00Z",
            "value": 100.0,
            "type": "electricity",
        }

        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=headers,
        )

        assert response.status_code == 401  # JWT validation error

    def test_create_consumption_inactive_user(self, client, app):
        """Test creating consumption with inactive user account."""
        # Create inactive user
        user = User(
            username="inactiveuser",
            email="inactive@example.com",
            password="testpassword123",
        )
        user.is_active = False
        db.session.add(user)
        db.session.commit()

        # Get token for inactive user
        login_data = {"email": "inactive@example.com", "password": "testpassword123"}
        response = client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )
        # Login should fail for inactive user, but let's test the consumption endpoint too

        if response.status_code == 200:
            token = response.json["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            consumption_data = {
                "date": "2023-10-15T10:00:00Z",
                "value": 100.0,
                "type": "electricity",
            }

            response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=headers,
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
            headers=auth_headers,
        )

        assert response.status_code == 400
        data = response.json
        assert data["error"] == "invalid_request"

    def test_empty_request_body(self, client, auth_headers):
        """Test handling of empty request body."""
        response = client.post(
            "/api/consumption", content_type="application/json", headers=auth_headers
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
            notes="Test consumption",
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
            notes="Test notes",
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
            type="gas",
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


class TestConsumptionList:
    """Test consumption list functionality."""

    def test_list_empty_consumptions(self, client, auth_headers):
        """Test listing consumption records when none exist."""
        response = client.get("/api/consumption", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert "consumptions" in data
        assert "pagination" in data
        assert "message" in data
        assert len(data["consumptions"]) == 0
        assert data["pagination"]["total_items"] == 0
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 20
        assert data["pagination"]["total_pages"] == 0
        assert data["pagination"]["has_prev"] is False
        assert data["pagination"]["has_next"] is False
        assert data["message"] == "No consumption records found"

    def test_list_single_consumption(self, client, auth_headers, test_user):
        """Test listing consumption records with a single record."""
        # Create a consumption record
        consumption_data = {
            "date": "2023-10-31T10:00:00Z",
            "value": 150.75,
            "type": "electricity",
            "notes": "Test consumption",
        }

        # Create the record
        create_response = client.post(
            "/api/consumption",
            data=json.dumps(consumption_data),
            content_type="application/json",
            headers=auth_headers,
        )
        assert create_response.status_code == 201

        # List records
        response = client.get("/api/consumption", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data["consumptions"]) == 1
        assert data["pagination"]["total_items"] == 1
        assert data["pagination"]["total_pages"] == 1
        assert data["pagination"]["has_prev"] is False
        assert data["pagination"]["has_next"] is False
        assert data["message"] == "Consumption records retrieved successfully"

        # Verify record data
        consumption = data["consumptions"][0]
        assert consumption["value"] == 150.75
        assert consumption["type"] == "electricity"
        assert consumption["notes"] == "Test consumption"
        assert consumption["user_id"] == test_user.id

    def test_list_multiple_consumptions_pagination(
        self, client, auth_headers, test_user
    ):
        """Test listing consumption records with pagination."""
        # Create multiple consumption records
        for i in range(25):
            consumption_data = {
                "date": f"2023-10-{str(i+1).zfill(2)}T10:00:00Z",
                "value": 100.0 + i,
                "type": "electricity",
                "notes": f"Test consumption {i+1}",
            }

            create_response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers,
            )
            assert create_response.status_code == 201

        # Test first page (default)
        response = client.get("/api/consumption", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data["consumptions"]) == 20  # Default per_page
        assert data["pagination"]["total_items"] == 25
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 20
        assert data["pagination"]["total_pages"] == 2
        assert data["pagination"]["has_prev"] is False
        assert data["pagination"]["has_next"] is True

        # Test second page
        response = client.get("/api/consumption?page=2", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data["consumptions"]) == 5  # Remaining records
        assert data["pagination"]["page"] == 2
        assert data["pagination"]["has_prev"] is True
        assert data["pagination"]["has_next"] is False

    def test_list_custom_per_page(self, client, auth_headers, test_user):
        """Test listing consumption records with custom per_page parameter."""
        # Create 15 consumption records
        for i in range(15):
            consumption_data = {
                "date": f"2023-10-{str(i+1).zfill(2)}T10:00:00Z",
                "value": 100.0 + i,
                "type": "electricity",
                "notes": f"Test consumption {i+1}",
            }

            create_response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers,
            )
            assert create_response.status_code == 201

        # Test custom per_page
        response = client.get("/api/consumption?per_page=5", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data["consumptions"]) == 5
        assert data["pagination"]["per_page"] == 5
        assert data["pagination"]["total_pages"] == 3

    def test_list_invalid_pagination_parameters(self, client, auth_headers):
        """Test listing with invalid pagination parameters."""
        # Test invalid page (negative)
        response = client.get("/api/consumption?page=-1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json
        assert data["pagination"]["page"] == 1  # Should default to 1

        # Test invalid per_page (too large)
        response = client.get("/api/consumption?per_page=200", headers=auth_headers)
        assert response.status_code == 200
        data = response.json
        assert data["pagination"]["per_page"] == 20  # Should default to 20

        # Test invalid per_page (zero)
        response = client.get("/api/consumption?per_page=0", headers=auth_headers)
        assert response.status_code == 200
        data = response.json
        assert data["pagination"]["per_page"] == 20  # Should default to 20

    def test_list_user_isolation(self, client, app):
        """Test that users only see their own consumption records."""
        with app.app_context():
            # Create two test users
            user1 = User(
                username="user1", email="user1@example.com", password="password123"
            )
            user1.set_password("password123")
            user2 = User(
                username="user2", email="user2@example.com", password="password123"
            )
            user2.set_password("password123")

            db.session.add(user1)
            db.session.add(user2)
            db.session.commit()

            # Login as user1
            login_response1 = client.post(
                "/api/auth/login",
                data=json.dumps(
                    {"email": "user1@example.com", "password": "password123"}
                ),
                content_type="application/json",
            )
            assert login_response1.status_code == 200
            token1 = login_response1.json["access_token"]
            headers1 = {"Authorization": f"Bearer {token1}"}

            # Login as user2
            login_response2 = client.post(
                "/api/auth/login",
                data=json.dumps(
                    {"email": "user2@example.com", "password": "password123"}
                ),
                content_type="application/json",
            )
            assert login_response2.status_code == 200
            token2 = login_response2.json["access_token"]
            headers2 = {"Authorization": f"Bearer {token2}"}

            # Create consumption record for user1
            consumption_data1 = {
                "date": "2023-10-31T10:00:00Z",
                "value": 150.75,
                "type": "electricity",
                "notes": "User1 consumption",
            }
            create_response1 = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data1),
                content_type="application/json",
                headers=headers1,
            )
            assert create_response1.status_code == 201

            # Create consumption record for user2
            consumption_data2 = {
                "date": "2023-11-01T10:00:00Z",
                "value": 200.50,
                "type": "water",
                "notes": "User2 consumption",
            }
            create_response2 = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data2),
                content_type="application/json",
                headers=headers2,
            )
            assert create_response2.status_code == 201

            # User1 should only see their own record
            response1 = client.get("/api/consumption", headers=headers1)
            assert response1.status_code == 200
            data1 = response1.json
            assert len(data1["consumptions"]) == 1
            assert data1["consumptions"][0]["notes"] == "User1 consumption"
            assert data1["consumptions"][0]["user_id"] == user1.id

            # User2 should only see their own record
            response2 = client.get("/api/consumption", headers=headers2)
            assert response2.status_code == 200
            data2 = response2.json
            assert len(data2["consumptions"]) == 1
            assert data2["consumptions"][0]["notes"] == "User2 consumption"
            assert data2["consumptions"][0]["user_id"] == user2.id

    def test_list_records_order(self, client, auth_headers, test_user):
        """Test that consumption records are ordered by date (newest first)."""
        # Create records with different dates
        dates = [
            "2023-10-30T10:00:00Z",
            "2023-11-01T10:00:00Z",
            "2023-10-31T10:00:00Z",
        ]

        for i, date in enumerate(dates):
            consumption_data = {
                "date": date,
                "value": 100.0 + i,
                "type": "electricity",
                "notes": f"Record {i+1}",
            }

            create_response = client.post(
                "/api/consumption",
                data=json.dumps(consumption_data),
                content_type="application/json",
                headers=auth_headers,
            )
            assert create_response.status_code == 201

        # List records
        response = client.get("/api/consumption", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        consumptions = data["consumptions"]
        assert len(consumptions) == 3

        # Verify order (newest first)
        assert consumptions[0]["date"] == "2023-11-01T10:00:00"
        assert consumptions[1]["date"] == "2023-10-31T10:00:00"
        assert consumptions[2]["date"] == "2023-10-30T10:00:00"

    def test_list_without_authentication(self, client):
        """Test that listing requires authentication."""
        response = client.get("/api/consumption")
        assert response.status_code == 401
        data = response.json
        assert data["error"] == "missing_token"

    def test_list_with_invalid_token(self, client):
        """Test listing with invalid JWT token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/consumption", headers=headers)
        assert response.status_code == 401  # JWT decode error

    def test_list_with_inactive_user(self, client, app):
        """Test listing consumption records with deactivated user."""
        with app.app_context():
            # Create and deactivate user
            user = User(
                username="inactive",
                email="inactive@example.com",
                password="password123",
            )
            user.set_password("password123")
            user.is_active = False
            db.session.add(user)
            db.session.commit()

            # Login (this should work even with inactive user)
            login_response = client.post(
                "/api/auth/login",
                data=json.dumps(
                    {"email": "inactive@example.com", "password": "password123"}
                ),
                content_type="application/json",
            )

            # Skip this test if login fails for inactive users
            if login_response.status_code != 200:
                return

            token = login_response.json["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Try to list consumptions
            response = client.get("/api/consumption", headers=headers)
            assert response.status_code == 401
            data = response.json
            assert data["error"] == "inactive_user"


class TestConsumptionAnalytics:
    """Test consumption analytics endpoint functionality."""

    @pytest.fixture
    def sample_consumption_data(self, app, test_user):
        """Create sample consumption data for analytics testing."""
        with app.app_context():
            user = User.query.get(test_user.id)

            # Create consumption records for different months and types
            consumption_records = [
                # October 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 10, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=150.75,
                    type="electricity",
                    notes="October electricity",
                ),
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 10, 20, 10, 0, 0, tzinfo=timezone.utc),
                    value=85.50,
                    type="water",
                    notes="October water",
                ),
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 10, 25, 10, 0, 0, tzinfo=timezone.utc),
                    value=45.25,
                    type="gas",
                    notes="October gas",
                ),
                # September 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 9, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=140.00,
                    type="electricity",
                    notes="September electricity",
                ),
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 9, 20, 10, 0, 0, tzinfo=timezone.utc),
                    value=80.00,
                    type="water",
                    notes="September water",
                ),
                # August 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 8, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=120.00,
                    type="electricity",
                    notes="August electricity",
                ),
            ]

            for record in consumption_records:
                db.session.add(record)
            db.session.commit()

            return consumption_records

    def test_analytics_success_with_data(
        self, client, auth_headers, sample_consumption_data
    ):
        """Test successful analytics retrieval with consumption data."""
        response = client.get("/api/consumption/analytics", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data["message"] == "Analytics data retrieved successfully"
        assert "analytics" in data

        analytics = data["analytics"]

        # Check required fields
        assert "total_consumption" in analytics
        assert "average_monthly" in analytics
        assert "current_month_total" in analytics
        assert "last_month_total" in analytics
        assert "monthly_data" in analytics
        assert "total_records" in analytics
        assert "consumption_by_type" in analytics

        # Verify calculations
        assert analytics["total_consumption"] == 621.5  # Sum of all values
        assert analytics["total_records"] == 6

        # Check consumption by type
        consumption_by_type = analytics["consumption_by_type"]
        assert consumption_by_type["electricity"] == 410.75  # 150.75 + 140.00 + 120.00
        assert consumption_by_type["water"] == 165.50  # 85.50 + 80.00
        assert consumption_by_type["gas"] == 45.25

        # Check monthly data structure
        monthly_data = analytics["monthly_data"]
        assert isinstance(monthly_data, list)

        # Should have data for months with records
        october_data = next(
            (item for item in monthly_data if item["month"] == "2023-10"), None
        )
        assert october_data is not None
        assert october_data["total"] == 281.5  # 150.75 + 85.50 + 45.25
        assert october_data["electricity"] == 150.75
        assert october_data["water"] == 85.50
        assert october_data["gas"] == 45.25

    def test_analytics_success_no_data(self, client, auth_headers):
        """Test analytics retrieval with no consumption data."""
        response = client.get("/api/consumption/analytics", headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data["message"] == "Analytics data retrieved successfully"

        analytics = data["analytics"]
        assert analytics["total_consumption"] == 0.0
        assert analytics["average_monthly"] == 0.0
        assert analytics["current_month_total"] == 0.0
        assert analytics["last_month_total"] == 0.0
        assert analytics["total_records"] == 0
        assert analytics["monthly_data"] == []

        # Check empty consumption by type
        consumption_by_type = analytics["consumption_by_type"]
        assert consumption_by_type["electricity"] == 0.0
        assert consumption_by_type["water"] == 0.0
        assert consumption_by_type["gas"] == 0.0

    def test_analytics_unauthorized(self, client):
        """Test analytics access without authentication."""
        response = client.get("/api/consumption/analytics")
        assert response.status_code == 401

    def test_analytics_invalid_token(self, client):
        """Test analytics access with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/consumption/analytics", headers=headers)
        assert response.status_code == 401

    def test_analytics_user_isolation(self, client, app):
        """Test that analytics only shows data for the authenticated user."""
        with app.app_context():
            # Create two users
            user1 = User(
                username="user1", email="user1@example.com", password="password123"
            )
            user1.set_password("password123")
            user2 = User(
                username="user2", email="user2@example.com", password="password123"
            )
            user2.set_password("password123")

            db.session.add(user1)
            db.session.add(user2)
            db.session.commit()

            # Add consumption data for both users
            consumption1 = Consumption(
                user_id=user1.id,
                date=datetime.now(timezone.utc),
                value=100.0,
                type="electricity",
            )
            consumption2 = Consumption(
                user_id=user2.id,
                date=datetime.now(timezone.utc),
                value=200.0,
                type="electricity",
            )

            db.session.add(consumption1)
            db.session.add(consumption2)
            db.session.commit()

            # Login as user1
            login_response = client.post(
                "/api/auth/login",
                data=json.dumps(
                    {"email": "user1@example.com", "password": "password123"}
                ),
                content_type="application/json",
            )
            assert login_response.status_code == 200

            token = login_response.json["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Get analytics for user1
            response = client.get("/api/consumption/analytics", headers=headers)
            assert response.status_code == 200

            analytics = response.json["analytics"]
            # Should only see user1's data (100.0), not user2's data (200.0)
            assert analytics["total_consumption"] == 100.0
            assert analytics["total_records"] == 1

    def test_analytics_with_inactive_user(self, client, app):
        """Test analytics access with deactivated user."""
        with app.app_context():
            # Create and deactivate user
            user = User(
                username="inactive",
                email="inactive@example.com",
                password="password123",
            )
            user.set_password("password123")
            user.is_active = False
            db.session.add(user)
            db.session.commit()

            # Login (this should work even with inactive user for some systems)
            login_response = client.post(
                "/api/auth/login",
                data=json.dumps(
                    {"email": "inactive@example.com", "password": "password123"}
                ),
                content_type="application/json",
            )

            # Skip this test if login fails for inactive users
            if login_response.status_code != 200:
                return

            token = login_response.json["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Try to get analytics
            response = client.get("/api/consumption/analytics", headers=headers)
            assert response.status_code == 401
            data = response.json
            assert data["error"] == "inactive_user"

    def test_analytics_monthly_data_ordering(
        self, client, auth_headers, app, test_user
    ):
        """Test that monthly data is properly ordered by month."""
        with app.app_context():
            user = User.query.get(test_user.id)

            # Create consumption records in different months (not in chronological order)
            consumption_records = [
                # March 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 3, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=100.0,
                    type="electricity",
                ),
                # January 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=200.0,
                    type="electricity",
                ),
                # February 2023
                Consumption(
                    user_id=user.id,
                    date=datetime(2023, 2, 15, 10, 0, 0, tzinfo=timezone.utc),
                    value=150.0,
                    type="electricity",
                ),
            ]

            for record in consumption_records:
                db.session.add(record)
            db.session.commit()

        response = client.get("/api/consumption/analytics", headers=auth_headers)

        assert response.status_code == 200
        analytics = response.json["analytics"]
        monthly_data = analytics["monthly_data"]

        # Check that months are in chronological order
        expected_months = ["2023-01", "2023-02", "2023-03"]
        actual_months = [item["month"] for item in monthly_data]
        assert actual_months == expected_months

        # Check values
        assert monthly_data[0]["total"] == 200.0  # January
        assert monthly_data[1]["total"] == 150.0  # February
        assert monthly_data[2]["total"] == 100.0  # March
