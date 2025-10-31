"""
JWT utilities for authentication and authorization.

This module provides utilities for creating, validating, and managing JWT tokens
for user authentication and authorization.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional

from flask import current_app, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from functools import wraps

from app.models.user import User


def create_tokens(user: User) -> Dict[str, str]:
    """
    Create access and refresh tokens for a user.
    
    Args:
        user: User instance for whom to create tokens
        
    Returns:
        Dictionary containing access_token and refresh_token
    """
    # Create access token with user ID as identity (convert to string)
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }


def get_current_user() -> Optional[User]:
    """
    Get the current user from JWT token.
    
    Returns:
        User instance if token is valid and user exists, None otherwise
    """
    try:
        # Verify JWT is present and valid
        verify_jwt_in_request()
        
        # Get user ID from token (convert from string to int)
        user_id_str = get_jwt_identity()
        
        if not user_id_str:
            return None
            
        user_id = int(user_id_str)
        
        # Find and return user
        return User.query.get(user_id)
        
    except (ValueError, TypeError):
        # Handle conversion errors
        return None
    except Exception:
        return None


def token_required(f):
    """
    Decorator for protecting routes with JWT authentication.
    
    Usage:
        @app.route('/protected')
        @token_required
        def protected_route():
            return jsonify({'message': 'Access granted'})
    """
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        # Get current user
        current_user = get_current_user()
        
        if not current_user:
            return {
                'error': 'invalid_token',
                'message': 'Invalid or expired token'
            }, 401
            
        if not current_user.is_active:
            return {
                'error': 'inactive_user',
                'message': 'User account is deactivated'
            }, 401
            
        # Add current_user to kwargs for the route handler
        kwargs['current_user'] = current_user
        return f(*args, **kwargs)
    
    return decorated_function