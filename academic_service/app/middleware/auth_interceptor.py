from flask import request, g
import jwt
from app.config.settings import Config
from app.utils.security import decode_access_token


def auth_middleware():
    return None
    if request.path in Config.EXCLUDED_AUTH_PATHS:
        return None
    if request.method == 'OPTIONS':
        return None
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return {'message': 'Missing Bearer token'}, 401
    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return {'message': 'Missing Bearer token'}, 401
    try:
        g.current_user = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        return {'message': 'Token expired'}, 401
    except jwt.InvalidTokenError:
        return {'message': 'Invalid token'}, 401
    return None
