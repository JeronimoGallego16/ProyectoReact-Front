from flask import Blueprint, request
from app.services.user_service import UserService
from app.utils.response import success_response, error_response


user_bp = Blueprint('users', __name__)
user_service = UserService()


@user_bp.post('/')
def create_user():
    try:
        result = user_service.create_user(request.json)
        return success_response(result, 'User created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@user_bp.get('/')
def list_users():
    return success_response(user_service.list_users())


@user_bp.get('/<user_id>')
def get_user(user_id):
    try:
        return success_response(user_service.get_user(user_id))
    except ValueError as exc:
        return error_response(str(exc), 404)


@user_bp.post('/public/register-student')
def public_register_student():
    try:
        payload = {**request.json, 'role': 'STUDENT'}
        result = user_service.create_user(payload)
        return success_response(result, 'Student created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@user_bp.post('/public/register-teacher')
def public_register_teacher():
    try:
        payload = {**request.json, 'role': 'TEACHER'}
        result = user_service.create_user(payload)
        return success_response(result, 'Teacher created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@user_bp.put('/<user_id>')
def update_user(user_id):
    try:
        result = user_service.update_user(user_id, request.json)
        return success_response(result, 'User updated')
    except ValueError as exc:
        return error_response(str(exc), 400)


@user_bp.delete('/<user_id>')
def delete_user(user_id):
    try:
        result = user_service.delete_user(user_id)
        return success_response(result, 'User deleted')
    except ValueError as exc:
        return error_response(str(exc), 404)


@user_bp.patch('/<user_id>/deactivate')
def deactivate_user(user_id):
    try:
        result = user_service.deactivate_user(user_id)
        return success_response(result, 'User deactivated')
    except ValueError as exc:
        return error_response(str(exc), 404)


@user_bp.get('/search')
def search_users():
    filters = {
        'role': request.args.get('role'),
        'is_active': None if request.args.get('is_active') is None else request.args.get('is_active').lower() == 'true',
        'email': request.args.get('email'),
        'code': request.args.get('code'),
        'identification': request.args.get('identification'),
        'first_name': request.args.get('first_name'),
        'last_name': request.args.get('last_name')
    }
    result = user_service.search_users(filters)
    return success_response(result)
