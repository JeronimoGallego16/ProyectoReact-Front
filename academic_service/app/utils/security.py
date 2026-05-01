from datetime import datetime, timedelta, timezone
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def create_access_token(payload: dict, expires_in_hours: int = 8) -> str:
    now = datetime.now(timezone.utc)
    token_payload = {
        **payload,
        'iat': now,
        'exp': now + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(token_payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
