"""
Consumption data routes placeholder.

This module will contain endpoints for consumption data management.
"""

from flask import Blueprint

consumption_bp = Blueprint("consumption", __name__)


@consumption_bp.route("/health")
def consumption_health():
    """Health check endpoint for consumption routes."""
    return {"status": "ok", "service": "consumption"}
