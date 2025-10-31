"""
Consumption data routes for managing user consumption records.

This module contains endpoints for consumption data management.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError

from app import db
from app.models.user import User
from app.models.consumption import Consumption
from app.schemas import (
    ConsumptionCreateRequest,
    ConsumptionCreateResponse,
    ConsumptionListResponse,
    ConsumptionResponse,
    ErrorResponse,
    ValidationErrorResponse,
    PaginationMetadata,
)

consumption_bp = Blueprint("consumption", __name__)


@consumption_bp.route("/health")
def consumption_health():
    """Health check endpoint for consumption routes."""
    return {"status": "ok", "service": "consumption"}


@consumption_bp.route("", methods=["POST"])
@jwt_required()
def create_consumption():
    """
    Create a new consumption record for the authenticated user.
    ---
    tags:
      - Consumption
    summary: Create consumption record
    description: Create a new consumption record with validation
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        description: Consumption data
        required: true
        schema:
          type: object
          required: [date, value, type]
          properties:
            date:
              type: string
              format: date-time
              description: Date of consumption (ISO format)
              example: "2023-10-31T10:00:00Z"
            value:
              type: number
              minimum: 0.01
              description: Consumption value (must be positive)
              example: 150.75
            type:
              type: string
              enum: [electricity, water, gas]
              description: Type of consumption
              example: "electricity"
            notes:
              type: string
              maxLength: 500
              description: Optional notes about the consumption
              example: "High usage due to air conditioning"
    responses:
      201:
        description: Consumption record created successfully
        schema:
          type: object
          properties:
            consumption:
              $ref: '#/definitions/ConsumptionResponse'
            message:
              type: string
              example: "Consumption record created successfully"
      400:
        description: Bad request - validation errors
        schema:
          $ref: '#/definitions/ValidationErrorResponse'
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/ErrorResponse'
      404:
        description: User not found
        schema:
          $ref: '#/definitions/ErrorResponse'
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/ErrorResponse'
    """
    try:
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

        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "invalid_request",
                "message": "Request body must be valid JSON"
            }), 400

        # Validate request data
        try:
            consumption_data = ConsumptionCreateRequest(**data)
        except ValidationError as e:
            error_details = {}
            for error in e.errors():
                field = ".".join(str(x) for x in error["loc"])
                error_details[field] = error["msg"]
            
            return jsonify({
                "error": "validation_error",
                "message": "Request validation failed",
                "details": error_details
            }), 400

        # Create consumption record
        consumption = Consumption(
            user_id=current_user.id,
            date=consumption_data.date,
            value=consumption_data.value,
            type=consumption_data.type,
            notes=consumption_data.notes
        )

        db.session.add(consumption)
        db.session.commit()

        # Create response
        consumption_response = ConsumptionResponse(**consumption.to_dict())
        response = ConsumptionCreateResponse(
            consumption=consumption_response,
            message="Consumption record created successfully"
        )

        return jsonify(response.model_dump()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "internal_error",
            "message": "An unexpected error occurred",
            "details": {"error": str(e)}
        }), 500


@consumption_bp.route("", methods=["GET"])
@jwt_required()
def list_consumptions():
    """
    Get consumption records for the authenticated user with pagination.
    ---
    tags:
      - Consumption
    summary: List consumption records
    description: |
      Retrieve consumption records for the authenticated user with optional pagination.
      Records are ordered by date (newest first) and filtered to show only the current user's data.
    security:
      - Bearer: []
    parameters:
      - in: query
        name: page
        type: integer
        minimum: 1
        default: 1
        description: Page number (1-based)
      - in: query
        name: per_page
        type: integer
        minimum: 1
        maximum: 100
        default: 20
        description: Number of records per page (max 100)
    responses:
      200:
        description: Consumption records retrieved successfully
        schema:
          type: object
          properties:
            consumptions:
              type: array
              items:
                $ref: '#/definitions/ConsumptionResponse'
            pagination:
              type: object
              properties:
                page:
                  type: integer
                  description: Current page number
                per_page:
                  type: integer
                  description: Number of items per page
                total_items:
                  type: integer
                  description: Total number of items
                total_pages:
                  type: integer
                  description: Total number of pages
                has_prev:
                  type: boolean
                  description: Whether there is a previous page
                has_next:
                  type: boolean
                  description: Whether there is a next page
            message:
              type: string
              example: "Consumption records retrieved successfully"
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/ErrorResponse'
      404:
        description: User not found
        schema:
          $ref: '#/definitions/ErrorResponse'
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/ErrorResponse'
    """
    try:
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

        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20

        # Query consumption records for the current user
        query = Consumption.query.filter_by(user_id=current_user.id).order_by(
            Consumption.date.desc(), Consumption.created_at.desc()
        )
        
        # Apply pagination
        paginated_result = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Convert to response format
        consumptions = [
            ConsumptionResponse(**consumption.to_dict()) 
            for consumption in paginated_result.items
        ]
        
        # Create pagination metadata
        pagination = PaginationMetadata(
            page=paginated_result.page,
            per_page=paginated_result.per_page,
            total_items=paginated_result.total,
            total_pages=paginated_result.pages,
            has_prev=paginated_result.has_prev,
            has_next=paginated_result.has_next
        )
        
        # Create response
        response = ConsumptionListResponse(
            consumptions=consumptions,
            pagination=pagination,
            message="Consumption records retrieved successfully" if consumptions else "No consumption records found"
        )
        
        return jsonify(response.model_dump()), 200

    except Exception as e:
        return jsonify({
            "error": "internal_error",
            "message": "An unexpected error occurred",
            "details": {"error": str(e)}
        }), 500


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
    # Get current user from JWT (convert string identity to int)
    current_user_id_str = get_jwt_identity()
    current_user_id = int(current_user_id_str)
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
