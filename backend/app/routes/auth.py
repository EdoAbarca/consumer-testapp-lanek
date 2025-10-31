"""
Authentication routes for user registration and login.

This module contains authentication endpoints for user registration
and login functionality.
"""

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.user import User
from app.schemas import (
    ErrorResponse,
    UserLoginRequest,
    UserLoginResponse,
    UserRegistrationRequest,
    UserRegistrationResponse,
    ValidationErrorResponse,
)
from app.utils.jwt_utils import create_tokens

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/health")
def auth_health():
    """
    Health check endpoint for authentication routes.
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Authentication service is healthy
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            service:
              type: string
              example: auth
    """
    return {"status": "ok", "service": "auth"}


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.
    ---
    tags:
      - Authentication
    summary: Register a new user account
    description: |
      This endpoint allows new users to create an account with username,
      email, and password. It validates the input data, checks for email
      uniqueness, hashes the password, and stores the user in the database.
      
      **Validation Rules:**
      - Username: 3-80 characters, alphanumeric with underscores/hyphens only
      - Email: Must be a valid email format
      - Password: Minimum 8 characters, must contain at least one letter and one number
      - Confirm Password: Must match the password field
    parameters:
      - in: body
        name: body
        description: User registration data
        required: true
        schema:
          $ref: '#/definitions/UserRegistrationRequest'
    responses:
      201:
        description: User successfully registered
        schema:
          $ref: '#/definitions/UserRegistrationResponse'
        examples:
          application/json:
            id: 1
            username: johndoe
            email: user@example.com
            is_active: true
            created_at: "2023-01-01T12:00:00Z"
            message: "User registered successfully"
      400:
        description: Validation error or email/username already exists
        schema:
          oneOf:
            - $ref: '#/definitions/ValidationErrorResponse'
            - $ref: '#/definitions/ErrorResponse'
        examples:
          validation_error:
            error: validation_error
            message: Request validation failed
            details:
              email: Invalid email format
              password: Password must be at least 8 characters long
          email_exists:
            error: email_exists
            message: An account with this email already exists
          username_exists:
            error: username_exists
            message: This username is already taken
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/ErrorResponse'
        examples:
          application/json:
            error: internal_error
            message: An unexpected error occurred
    """
    try:
        # Check if request has JSON data
        if not request.is_json:
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_content_type",
                        message="Content-Type must be application/json",
                    ).model_dump()
                ),
                400,
            )

        # Check if JSON is valid
        try:
            json_data = request.get_json()
            if json_data is None:
                return (
                    jsonify(
                        ErrorResponse(
                            error="invalid_json",
                            message="Invalid JSON payload",
                        ).model_dump()
                    ),
                    400,
                )
        except Exception:
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_json",
                        message="Invalid JSON payload",
                    ).model_dump()
                ),
                400,
            )

        # Parse and validate request data
        try:
            user_data = UserRegistrationRequest.model_validate(json_data)
        except ValidationError as e:
            # Handle validation errors properly
            errors = {}
            for error in e.errors():
                field = error.get("loc", ["unknown"])[-1] if error.get("loc") else "unknown"
                message = error.get("msg", "Validation error")
                errors[str(field)] = message
            
            return (
                jsonify(
                    ValidationErrorResponse(
                        details=errors
                    ).model_dump()
                ),
                400,
            )

        # Check if email already exists
        existing_user = User.find_by_email(user_data.email)
        if existing_user:
            return (
                jsonify(
                    ErrorResponse(
                        error="email_exists",
                        message="An account with this email already exists",
                    ).model_dump()
                ),
                400,
            )

        # Check if username already exists
        existing_username = User.find_by_username(user_data.username)
        if existing_username:
            return (
                jsonify(
                    ErrorResponse(
                        error="username_exists",
                        message="This username is already taken",
                    ).model_dump()
                ),
                400,
            )

        # Create new user
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
        )

        # Save to database
        db.session.add(new_user)
        db.session.commit()

        # Prepare response
        response_data = UserRegistrationResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            is_active=new_user.is_active,
            created_at=new_user.created_at.isoformat(),
        )

        return jsonify(response_data.model_dump()), 201

    except IntegrityError as e:
        db.session.rollback()
        # Handle database constraint violations
        if "users_email_key" in str(e.orig):
            return (
                jsonify(
                    ErrorResponse(
                        error="email_exists",
                        message="An account with this email already exists",
                    ).model_dump()
                ),
                400,
            )
        elif "users_username_key" in str(e.orig):
            return (
                jsonify(
                    ErrorResponse(
                        error="username_exists",
                        message="This username is already taken",
                    ).model_dump()
                ),
                400,
            )
        else:
            return (
                jsonify(
                    ErrorResponse(
                        error="database_error",
                        message="Unable to create user account",
                    ).model_dump()
                ),
                500,
            )

    except Exception as e:
        db.session.rollback()
        return (
            jsonify(
                ErrorResponse(
                    error="internal_error",
                    message="An unexpected error occurred",
                    details={"error": str(e)} if request.args.get("debug") else None,
                ).model_dump()
            ),
            500,
        )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user and return JWT tokens.
    ---
    tags:
      - Authentication
    summary: User login endpoint
    description: |
      This endpoint allows users to authenticate with their email and password.
      Upon successful authentication, it returns JWT access and refresh tokens
      along with user information.
      
      **Authentication Flow:**
      - Validates email and password format
      - Checks if user exists and credentials are correct
      - Verifies user account is active
      - Returns JWT tokens for authenticated sessions
    parameters:
      - in: body
        name: body
        description: User login credentials
        required: true
        schema:
          $ref: '#/definitions/UserLoginRequest'
    responses:
      200:
        description: Login successful
        schema:
          $ref: '#/definitions/UserLoginResponse'
        examples:
          application/json:
            access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
            refresh_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
            user:
              id: 1
              username: johndoe
              email: user@example.com
              is_active: true
              created_at: "2023-01-01T12:00:00Z"
              message: "User registered successfully"
            message: "Login successful"
      400:
        description: Validation error or invalid credentials
        schema:
          oneOf:
            - $ref: '#/definitions/ValidationErrorResponse'
            - $ref: '#/definitions/ErrorResponse'
        examples:
          validation_error:
            error: validation_error
            message: Request validation failed
            details:
              email: Invalid email format
              password: This field is required
          invalid_credentials:
            error: invalid_credentials
            message: Invalid email or password
          inactive_account:
            error: inactive_account
            message: User account is deactivated
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/ErrorResponse'
        examples:
          application/json:
            error: internal_error
            message: An unexpected error occurred
    """
    try:
        # Check if request has JSON data
        if not request.is_json:
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_content_type",
                        message="Content-Type must be application/json",
                    ).model_dump()
                ),
                400,
            )

        # Check if JSON is valid
        try:
            json_data = request.get_json()
            if json_data is None:
                return (
                    jsonify(
                        ErrorResponse(
                            error="invalid_json",
                            message="Invalid JSON payload",
                        ).model_dump()
                    ),
                    400,
                )
        except Exception:
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_json",
                        message="Invalid JSON payload",
                    ).model_dump()
                ),
                400,
            )

        # Parse and validate request data
        try:
            login_data = UserLoginRequest.model_validate(json_data)
        except ValidationError as e:
            # Handle validation errors properly
            errors = {}
            for error in e.errors():
                field = error.get("loc", ["unknown"])[-1] if error.get("loc") else "unknown"
                message = error.get("msg", "Validation error")
                errors[str(field)] = message
            
            return (
                jsonify(
                    ValidationErrorResponse(
                        details=errors
                    ).model_dump()
                ),
                400,
            )

        # Find user by email
        user = User.find_by_email(login_data.email)
        if not user:
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_credentials",
                        message="Invalid email or password",
                    ).model_dump()
                ),
                400,
            )

        # Check password
        if not user.check_password(login_data.password):
            return (
                jsonify(
                    ErrorResponse(
                        error="invalid_credentials",
                        message="Invalid email or password",
                    ).model_dump()
                ),
                400,
            )

        # Check if user account is active
        if not user.is_active:
            return (
                jsonify(
                    ErrorResponse(
                        error="inactive_account",
                        message="User account is deactivated",
                    ).model_dump()
                ),
                400,
            )

        # Create JWT tokens
        tokens = create_tokens(user)

        # Prepare user data for response
        user_data = UserRegistrationResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )

        # Prepare response
        response_data = UserLoginResponse(
            access_token=tokens['access_token'],
            refresh_token=tokens['refresh_token'],
            user=user_data,
        )

        return jsonify(response_data.model_dump()), 200

    except Exception as e:
        return (
            jsonify(
                ErrorResponse(
                    error="internal_error",
                    message="An unexpected error occurred",
                    details={"error": str(e)} if request.args.get("debug") else None,
                ).model_dump()
            ),
            500,
        )