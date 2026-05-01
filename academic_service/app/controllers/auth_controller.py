from flask import Blueprint, request
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.utils.response import success_response, error_response


auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()
user_service = UserService()


@auth_bp.post('/login')
def login():
    try:
        result = auth_service.login(request.json.get('email'), request.json.get('password'))
        return success_response(result, 'Login successful')
    except ValueError as exc:
        return error_response(str(exc), 401)


@auth_bp.post('/register-admin')
def register_admin():
    try:
        payload = {**request.json, 'role': 'ADMIN'}
        result = user_service.create_user(payload)
        return success_response(result, 'Admin created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)
