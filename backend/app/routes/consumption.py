"""
Consumption data routes placeholder.

This module will contain endpoints for consumption data management.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.user import User

consumption_bp = Blueprint("consumption", __name__)


@consumption_bp.route("/health")
def consumption_health():
    """Health check endpoint for consumption routes."""
    return {"status": "ok", "service": "consumption"}


@consumption_bp.route("/dashboard")
@jwt_required()
def dashboard():
    """
    Get user dashboard data (protected route example).
    ---
    tags:
      - Consumption
    summary: Get user dashboard
    description: Protected endpoint that requires JWT authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Dashboard data returned successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Welcome to the dashboard"
            user:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                username:
                  type: string
                  example: "johndoe"
                email:
                  type: string
                  example: "user@example.com"
      401:
        description: Unauthorized - invalid or missing token
        schema:
          type: object
          properties:
            error:
              type: string
              example: "missing_token"
            message:
              type: string
              example: "Authorization token is required"
    """
    # Get current user from JWT
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({
            "error": "user_not_found",
            "message": "User not found"
        }), 404
        
    if not current_user.is_active:
        return jsonify({
            "error": "inactive_user",
            "message": "User account is deactivated"
        }), 401

    return jsonify({
        "message": "Welcome to the dashboard",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email
        }
    }), 200
