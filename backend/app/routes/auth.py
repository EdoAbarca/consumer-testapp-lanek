"""
Authentication routes placeholder.

This module will contain authentication endpoints for user registration and login.
"""

from flask import Blueprint

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/health')
def auth_health():
    """Health check endpoint for authentication routes."""
    return {'status': 'ok', 'service': 'auth'}