"""
User model for authentication and user management.

This module contains the User model for handling user data in the database.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

import bcrypt
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

if TYPE_CHECKING:
    from app.models.consumption import Consumption


class User(db.Model):
    """User model for authentication and profile management."""

    __tablename__ = "users"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True)

    # Required fields
    username: Mapped[str] = mapped_column(
        String(80), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Optional fields
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    consumptions: Mapped[list["Consumption"]] = relationship(
        "Consumption", back_populates="user", cascade="all, delete-orphan"
    )

    def __init__(self, username: str, email: str, password: str, **kwargs):
        """
        Initialize a new User instance.

        Args:
            username: User's unique username
            email: User's unique email address
            password: Plain text password (will be hashed)
            **kwargs: Additional keyword arguments
        """
        super().__init__(**kwargs)
        self.username = username
        self.email = email.lower()  # Store email in lowercase for consistency
        # Set default value for is_active if not provided
        if self.is_active is None:
            self.is_active = True
        self.set_password(password)

    def set_password(self, password: str) -> None:
        """
        Hash and set the user's password.

        Args:
            password: Plain text password to hash and store
        """
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """
        Check if the provided password matches the stored hash.

        Args:
            password: Plain text password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    @classmethod
    def find_by_email(cls, email: str) -> Optional["User"]:
        """
        Find a user by email address.

        Args:
            email: Email address to search for

        Returns:
            User instance if found, None otherwise
        """
        return cls.query.filter_by(email=email.lower()).first()

    @classmethod
    def find_by_username(cls, username: str) -> Optional["User"]:
        """
        Find a user by username.

        Args:
            username: Username to search for

        Returns:
            User instance if found, None otherwise
        """
        return cls.query.filter_by(username=username).first()

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """
        Convert User instance to dictionary.

        Args:
            include_sensitive: Whether to include sensitive fields like password_hash

        Returns:
            dict: User data as dictionary
        """
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

        if include_sensitive:
            data["password_hash"] = self.password_hash

        return data

    def __repr__(self) -> str:
        """String representation of User object."""
        return f"<User {self.username} ({self.email})>"