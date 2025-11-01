"""
Consumption model for tracking user consumption data.

This module contains the Consumption model for handling consumption data
records in the database.
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.user import User

from app import db


class ConsumptionType(Enum):
    """Enum for consumption types."""

    ELECTRICITY = "electricity"
    WATER = "water"
    GAS = "gas"


class Consumption(db.Model):
    """Consumption model for tracking user consumption data."""

    __tablename__ = "consumptions"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Required fields
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    value: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Consumption value with 2 decimal places",
    )
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Type of consumption: electricity, water, or gas",
    )

    # Optional fields
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="Optional notes about the consumption record"
    )

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
    user: Mapped["User"] = relationship("User", back_populates="consumptions")

    def __init__(
        self,
        user_id: int,
        date: datetime,
        value: float,
        type: str,
        notes: Optional[str] = None,
        **kwargs,
    ):
        """
        Initialize a new Consumption instance.

        Args:
            user_id: ID of the user who owns this consumption record
            date: Date of the consumption
            value: Consumption value (numeric)
            type: Type of consumption (electricity, water, gas)
            notes: Optional notes about the consumption
            **kwargs: Additional keyword arguments
        """
        super().__init__(**kwargs)
        self.user_id = user_id
        self.date = date
        self.value = value
        self.type = type
        self.notes = notes

    @classmethod
    def get_valid_types(cls) -> list[str]:
        """
        Get list of valid consumption types.

        Returns:
            list[str]: List of valid consumption type strings
        """
        return [t.value for t in ConsumptionType]

    def to_dict(self) -> dict:
        """
        Convert Consumption instance to dictionary.

        Returns:
            dict: Consumption data as dictionary
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "value": float(self.value),
            "type": self.type,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        """String representation of Consumption object."""
        return (
            f"<Consumption {self.id}: {self.type} - {self.value} on {self.date.date()}>"
        )
