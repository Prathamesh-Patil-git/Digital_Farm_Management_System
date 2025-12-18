from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider
from flask_jwt_extended import JWTManager
from flask_cors import CORS  # Make sure this is imported
from datetime import datetime
from app.config import Config
from app.db import DB
from bson import ObjectId


# ============================================================
# GLOBAL JSON PROVIDER (Fixes ALL BSON + datetime problems)
# ============================================================
class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        # Convert Mongo ObjectId globally
        if isinstance(obj, ObjectId):
            return str(obj)

        # Convert datetime to ISO format
        if isinstance(obj, datetime):
            return obj.isoformat()

        # Fall back to original provider
        return super().default(obj)


# ============================================================
# APPLICATION FACTORY
# ============================================================
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # -----------------------------------------------
    # CORS Configuration - ENABLE THIS
    # -----------------------------------------------
    # This is CRITICAL: Enable CORS for all routes
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True)

    # -----------------------------------------------
    # JSON ENGINE FIX — THE MOST IMPORTANT PART
    # -----------------------------------------------
    # Register custom JSON provider (NEW Flask system)
    app.json_provider_class = CustomJSONProvider
    app.json = app.json_provider_class(app)

    # Disable old JSON encoder so Flask MUST use the provider
    app.json_encoder = None     # ← CRITICAL FIX!

    # -----------------------------------------------
    # JWT initialization
    # -----------------------------------------------
    jwt = JWTManager(app)

    # -----------------------------------------------
    # MongoDB Initialization
    # -----------------------------------------------
    DB.initialize()

    # -----------------------------------------------
    # Register Blueprints
    # -----------------------------------------------
    from app.routes.auth import auth_bp
    from app.routes.farmers import farmers_bp
    from app.routes.animals import animals_bp
    from app.routes.treatments import treatments_bp
    from app.routes.consumer import consumer_bp
    from app.routes.authority_auth import authority_auth_bp
    from app.routes.veterinarian_auth import veterinarian_auth_bp
    from app.routes.upload_routes import upload_bp
    from app.routes.authority_dashboard import authority_dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(farmers_bp, url_prefix='/farmers')
    app.register_blueprint(animals_bp, url_prefix='/animals')
    app.register_blueprint(treatments_bp, url_prefix='/treatments')
    app.register_blueprint(consumer_bp, url_prefix='/consumer')
    app.register_blueprint(veterinarian_auth_bp, url_prefix='/veterinarian/auth')
    app.register_blueprint(authority_auth_bp, url_prefix='/authority/auth')
    app.register_blueprint(upload_bp, url_prefix='/uploads')
    app.register_blueprint(authority_dashboard_bp, url_prefix='/authority/dashboard')

    # -----------------------------------------------
    # Health Check Route
    # -----------------------------------------------
    @app.route('/')
    def health_check():
        return jsonify({
            "service": "Digital Farm API",
            "version": "1.0.0",
            "status": "running"
        }), 200

    # -----------------------------------------------
    # Error Handlers with CORS headers
    # -----------------------------------------------
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not found",
            "message": str(error)
        }), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "error": "Internal server error",
            "message": str(error)
        }), 500

    return app