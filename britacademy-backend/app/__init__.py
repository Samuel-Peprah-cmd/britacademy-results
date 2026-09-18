from flask import Flask
from app.config import Config
from app.extensions import db, jwt
from flask_cors import CORS # We need this for the React frontend!

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app) # Allow frontend to talk to backend

    # Register Blueprints
    from app.api.auth import auth_bp
    from app.api.admin import admin_bp
    from app.api.tutor import tutor_bp
    from app.api.student import student_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(tutor_bp, url_prefix='/api/tutor')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'Britannia API is up and running!'}, 200

    return app