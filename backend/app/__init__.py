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
    
    # Configure JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Handle expired token."""
        return {
            'error': 'token_expired',
            'message': 'Token has expired'
        }, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid token."""
        return {
            'error': 'invalid_token',
            'message': 'Invalid token format'
        }, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing token."""
        return {
            'error': 'missing_token',
            'message': 'Authorization token is required'
        }, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Handle revoked token."""
        return {
            'error': 'token_revoked',
            'message': 'Token has been revoked'
        }, 401

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
            'MonthlyConsumption': {
                'type': 'object',
                'properties': {
                    'month': {
                        'type': 'string',
                        'description': 'Month in YYYY-MM format',
                        'example': '2023-10',
                    },
                    'total': {
                        'type': 'number',
                        'description': 'Total consumption for the month',
                        'example': 281.5,
                    },
                    'electricity': {
                        'type': 'number',
                        'description': 'Electricity consumption for the month',
                        'example': 150.75,
                    },
                    'water': {
                        'type': 'number',
                        'description': 'Water consumption for the month',
                        'example': 85.5,
                    },
                    'gas': {
                        'type': 'number',
                        'description': 'Gas consumption for the month',
                        'example': 45.25,
                    },
                },
            },
            'ConsumptionAnalytics': {
                'type': 'object',
                'properties': {
                    'total_consumption': {
                        'type': 'number',
                        'description': 'Total consumption across all records',
                        'example': 1250.75,
                    },
                    'average_monthly': {
                        'type': 'number',
                        'description': 'Average consumption per month',
                        'example': 125.08,
                    },
                    'current_month_total': {
                        'type': 'number',
                        'description': 'Current month total consumption',
                        'example': 95.5,
                    },
                    'last_month_total': {
                        'type': 'number',
                        'description': 'Last month total consumption',
                        'example': 110.25,
                    },
                    'monthly_data': {
                        'type': 'array',
                        'items': {
                            '$ref': '#/definitions/MonthlyConsumption',
                        },
                        'description': 'Monthly consumption breakdown for charts',
                    },
                    'total_records': {
                        'type': 'integer',
                        'description': 'Total number of consumption records',
                        'example': 25,
                    },
                    'consumption_by_type': {
                        'type': 'object',
                        'description': 'Total consumption breakdown by type',
                        'properties': {
                            'electricity': {
                                'type': 'number',
                                'example': 650.3,
                            },
                            'water': {
                                'type': 'number',
                                'example': 400.2,
                            },
                            'gas': {
                                'type': 'number',
                                'example': 200.25,
                            },
                        },
                    },
                },
            },
            'AnalyticsResponse': {
                'type': 'object',
                'properties': {
                    'analytics': {
                        '$ref': '#/definitions/ConsumptionAnalytics',
                        'description': 'Consumption analytics data',
                    },
                    'message': {
                        'type': 'string',
                        'description': 'Success message',
                        'example': 'Analytics data retrieved successfully',
                    },
                },
            },
        },
    }
    
    swagger.init_app(app)

    # Import models to ensure they are registered with SQLAlchemy
    from app.models import User, Consumption

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
