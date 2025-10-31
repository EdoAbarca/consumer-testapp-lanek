"""
Pydantic schemas for authentication endpoints.

This module contains request and response schemas for authentication
operations like user registration and login.
"""

import re
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