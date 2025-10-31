"""
Pydantic schemas for authentication and consumption endpoints.

This module contains request and response schemas for authentication
operations like user registration and login, as well as consumption
data management.
"""

import re
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class UserRegistrationRequest(BaseModel):
    """Schema for user registration request."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=80,
        description="Unique username for the user",
        examples=["johndoe", "user123"],
    )
    email: EmailStr = Field(
        ..., description="Valid email address", examples=["user@example.com"]
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password with minimum 8 characters",
        examples=["SecurePass123!"],
    )
    confirm_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password confirmation - must match password",
        examples=["SecurePass123!"],
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Username can only contain letters, numbers, underscores, and hyphens"
            )
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        # Check for at least one letter and one number
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")

        return v

    @model_validator(mode='after')
    def validate_passwords_match(self) -> 'UserRegistrationRequest':
        """Validate that password and confirm_password match."""
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class UserRegistrationResponse(BaseModel):
    """Schema for user registration response."""

    id: int = Field(..., description="Unique user ID")
    username: str = Field(..., description="User's username")
    email: str = Field(..., description="User's email address")
    is_active: bool = Field(..., description="Whether the user account is active")
    created_at: str = Field(..., description="ISO timestamp of account creation")
    message: str = Field(
        default="User registered successfully",
        description="Success message",
    )


class UserLoginRequest(BaseModel):
    """Schema for user login request."""

    email: EmailStr = Field(
        ..., description="User's email address", examples=["user@example.com"]
    )
    password: str = Field(
        ..., description="User's password", examples=["SecurePass123!"]
    )


class UserLoginResponse(BaseModel):
    """Schema for user login response."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    user: UserRegistrationResponse = Field(..., description="User information")
    message: str = Field(
        default="Login successful", description="Success message"
    )


class ErrorResponse(BaseModel):
    """Schema for error responses."""

    error: str = Field(..., description="Error type or code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(
        default=None, description="Additional error details"
    )


class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses."""

    error: str = Field(default="validation_error", description="Error type")
    message: str = Field(
        default="Request validation failed", description="Error message"
    )
    details: dict = Field(..., description="Field-specific validation errors")


class SuccessResponse(BaseModel):
    """Schema for generic success responses."""

    success: bool = Field(default=True, description="Success status")
    message: str = Field(..., description="Success message")
    data: Optional[dict] = Field(default=None, description="Additional response data")


# Consumption Schemas

class ConsumptionCreateRequest(BaseModel):
    """Schema for creating a new consumption record."""

    date: datetime = Field(
        ..., 
        description="Date of the consumption (ISO format)",
        examples=["2023-10-31T10:00:00Z"]
    )
    value: float = Field(
        ..., 
        gt=0, 
        description="Consumption value (must be positive)",
        examples=[150.75, 85.2, 25.0]
    )
    type: str = Field(
        ..., 
        description="Type of consumption",
        examples=["electricity", "water", "gas"]
    )
    notes: Optional[str] = Field(
        default=None, 
        max_length=500,
        description="Optional notes about the consumption",
        examples=["High usage due to air conditioning", "Normal monthly reading"]
    )

    @field_validator("type")
    @classmethod
    def validate_consumption_type(cls, v: str) -> str:
        """Validate consumption type."""
        valid_types = ["electricity", "water", "gas"]
        if v.lower() not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v.lower()

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: datetime) -> datetime:
        """Validate that consumption date is not in the future."""
        # Get current time with timezone awareness matching the input
        now = datetime.now(timezone.utc) if v.tzinfo else datetime.now()
        if v > now:
            raise ValueError("Consumption date cannot be in the future")
        return v


class ConsumptionResponse(BaseModel):
    """Schema for consumption record response."""

    id: int = Field(..., description="Unique consumption record ID")
    user_id: int = Field(..., description="ID of the user who owns this record")
    date: str = Field(..., description="ISO timestamp of consumption date")
    value: float = Field(..., description="Consumption value")
    type: str = Field(..., description="Type of consumption")
    notes: Optional[str] = Field(default=None, description="Optional notes")
    created_at: str = Field(..., description="ISO timestamp of record creation")
    updated_at: str = Field(..., description="ISO timestamp of last update")


class ConsumptionCreateResponse(BaseModel):
    """Schema for consumption creation response."""

    consumption: ConsumptionResponse = Field(..., description="Created consumption record")
    message: str = Field(
        default="Consumption record created successfully",
        description="Success message"
    )


class PaginationMetadata(BaseModel):
    """Schema for pagination metadata."""

    page: int = Field(..., description="Current page number (1-based)")
    per_page: int = Field(..., description="Number of items per page")
    total_items: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    has_prev: bool = Field(..., description="Whether there is a previous page")
    has_next: bool = Field(..., description="Whether there is a next page")


class ConsumptionListResponse(BaseModel):
    """Schema for consumption list response."""

    consumptions: list[ConsumptionResponse] = Field(..., description="List of consumption records")
    pagination: PaginationMetadata = Field(..., description="Pagination information")
    message: str = Field(
        default="Consumption records retrieved successfully",
        description="Success message"
    )