"""
Models package for the application.

This package contains all database models used by the application.
"""

from .user import User
from .consumption import Consumption

__all__ = ["User", "Consumption"]
