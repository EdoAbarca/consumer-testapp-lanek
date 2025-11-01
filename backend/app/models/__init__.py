"""
Models package for the application.

This package contains all database models used by the application.
"""

from .consumption import Consumption
from .user import User

__all__ = ["User", "Consumption"]
