import os

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
DB_PATH = os.path.join(BASE_DIR, 'academic.db')


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-secret-key')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    EXCLUDED_AUTH_PATHS = {
        '/health',
        '/api/auth/login',
        '/api/auth/register-admin',
        '/api/users/public/register-student',
        '/api/users/public/register-teacher'
    }
