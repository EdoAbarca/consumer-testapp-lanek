"""
Flask application factory module.

This module contains the Flask application factory function that creates
and configures the Flask application instance.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flasgger import Swagger

from app.config import Config

# Initialize Flask extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
swagger = Swagger()


def create_app(config_class=Config):
    """
    Create and configure the Flask application.

    Args:
        config_class: Configuration class to use for the app

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # Configure Swagger with Flasgger
    app.config['SWAGGER'] = {
        'title': 'Consumer TestApp Lanek API',
        'version': '1.0.0',
        'description': 'Backend API for Consumer Data Management System - Lanek Technical Test',
        'contact': {
            'name': 'API Support',
            'email': 'developer@example.com',
        },
        'license': {
            'name': 'MIT',
            'url': 'https://opensource.org/licenses/MIT',
        },
        'host': 'localhost:5000',
        'basePath': '/api',
        'schemes': ['http', 'https'],
        'consumes': ['application/json'],
        'produces': ['application/json'],
        'securityDefinitions': {
            'Bearer': {
                'type': 'apiKey',
                'name': 'Authorization',
                'in': 'header',
                'description': 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
            }
        },
        'definitions': {
            'UserRegistrationRequest': {
                'type': 'object',
                'required': ['username', 'email', 'password', 'confirm_password'],
                'properties': {
                    'username': {
                        'type': 'string',
                        'minLength': 3,
                        'maxLength': 80,
                        'description': 'Unique username for the user',
                        'example': 'johndoe',
                    },
                    'email': {
                        'type': 'string',
                        'format': 'email',
                        'description': 'Valid email address',
                        'example': 'user@example.com',
                    },
                    'password': {
                        'type': 'string',
                        'minLength': 8,
                        'maxLength': 128,
                        'description': 'Password with minimum 8 characters',
                        'example': 'SecurePass123!',
                    },
                    'confirm_password': {
                        'type': 'string',
                        'minLength': 8,
                        'maxLength': 128,
                        'description': 'Password confirmation - must match password',
                        'example': 'SecurePass123!',
                    },
                },
            },
            'UserRegistrationResponse': {
                'type': 'object',
                'properties': {
                    'id': {
                        'type': 'integer',
                        'description': 'Unique user ID',
                        'example': 1,
                    },
                    'username': {
                        'type': 'string',
                        'description': 'User\'s username',
                        'example': 'johndoe',
                    },
                    'email': {
                        'type': 'string',
                        'format': 'email',
                        'description': 'User\'s email address',
                        'example': 'user@example.com',
                    },
                    'is_active': {
                        'type': 'boolean',
                        'description': 'Whether the user account is active',
                        'example': True,
                    },
                    'created_at': {
                        'type': 'string',
                        'format': 'date-time',
                        'description': 'ISO timestamp of account creation',
                        'example': '2023-01-01T12:00:00Z',
                    },
                    'message': {
                        'type': 'string',
                        'description': 'Success message',
                        'example': 'User registered successfully',
                    },
                },
            },
            'ErrorResponse': {
                'type': 'object',
                'properties': {
                    'error': {
                        'type': 'string',
                        'description': 'Error type or code',
                        'example': 'email_exists',
                    },
                    'message': {
                        'type': 'string',
                        'description': 'Human-readable error message',
                        'example': 'An account with this email already exists',
                    },
                    'details': {
                        'type': 'object',
                        'description': 'Additional error details',
                    },
                },
            },
            'ValidationErrorResponse': {
                'type': 'object',
                'properties': {
                    'error': {
                        'type': 'string',
                        'description': 'Error type',
                        'example': 'validation_error',
                    },
                    'message': {
                        'type': 'string',
                        'description': 'Error message',
                        'example': 'Request validation failed',
                    },
                    'details': {
                        'type': 'object',
                        'description': 'Field-specific validation errors',
                        'example': {
                            'email': 'Invalid email format',
                            'password': 'Password must be at least 8 characters long',
                        },
                    },
                },
            },
        },
    }
    
    swagger.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.consumption import consumption_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(consumption_bp, url_prefix="/api/consumption")

    # Add health check endpoint
    @app.route("/health")
    @app.route("/api/health")
    def health_check():
        """
        Health check endpoint for monitoring.
        ---
        tags:
          - Health
        responses:
          200:
            description: Service is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: healthy
                service:
                  type: string
                  example: consumer-testapp-backend
                version:
                  type: string
                  example: 1.0.0
        """
        return {
            "status": "healthy",
            "service": "consumer-testapp-backend",
            "version": "1.0.0",
        }

    return app
