from flask import Flask
from .config.settings import Config
from .models import db
from .middleware.auth_interceptor import auth_middleware
from .controllers.auth_controller import auth_bp
from .controllers.user_controller import user_bp
from .controllers.academic_controller import academic_bp
from .controllers.evaluation_controller import evaluation_bp
from .utils.db_init import initialize_database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    app.before_request(auth_middleware)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(academic_bp, url_prefix='/api/academic')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluation')

    with app.app_context():
        initialize_database()

    @app.get('/health')
    def health():
        return {'status': 'ok', 'service': 'academic-service'}

    return app
