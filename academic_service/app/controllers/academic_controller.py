from flask import Blueprint, request
from app.services.academic_service import AcademicService
from app.utils.response import success_response, error_response


academic_bp = Blueprint('academic', __name__)
academic_service = AcademicService()


@academic_bp.post('/careers')
def create_career():
    try:
        return success_response(academic_service.create_career(request.json), 'Career created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/semesters')
def create_semester():
    try:
        return success_response(academic_service.create_semester(request.json), 'Semester created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/subjects')
def create_subject():
    try:
        return success_response(academic_service.create_subject(request.json), 'Subject created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/study-plans')
def create_study_plan():
    try:
        return success_response(academic_service.create_study_plan(request.json), 'Study plan item created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/groups')
def create_group():
    try:
        return success_response(academic_service.create_group(request.json), 'Group created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.patch('/groups/<group_id>/assign-teacher/<teacher_id>')
def assign_teacher(group_id, teacher_id):
    try:
        return success_response(academic_service.assign_teacher_to_group(group_id, teacher_id), 'Teacher assigned')
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/registrations')
def create_registration():
    try:
        return success_response(academic_service.create_registration(request.json), 'Registration created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.post('/enrollments')
def create_enrollment():
    try:
        return success_response(academic_service.create_enrollment(request.json), 'Enrollment created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.get('/<entity_name>')
def list_entities(entity_name):
    try:
        return success_response(academic_service.list_entities(entity_name))
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.get('/<entity_name>/<entity_id>')
def get_entity(entity_name, entity_id):
    try:
        return success_response(academic_service.get_entity(entity_name, entity_id))
    except ValueError as exc:
        return error_response(str(exc), 404)


@academic_bp.put('/<entity_name>/<entity_id>')
def update_entity(entity_name, entity_id):
    try:
        return success_response(academic_service.update_entity(entity_name, entity_id, request.json), 'Entity updated')
    except ValueError as exc:
        return error_response(str(exc), 400)


@academic_bp.delete('/<entity_name>/<entity_id>')
def delete_entity(entity_name, entity_id):
    try:
        return success_response(academic_service.delete_entity(entity_name, entity_id), 'Entity deleted')
    except ValueError as exc:
        return error_response(str(exc), 404)


@academic_bp.get('/<entity_name>/search')
def search_entity(entity_name):
    try:
        result = academic_service.search_entities(entity_name, request.args.to_dict())
        return success_response(result)
    except ValueError as exc:
        return error_response(str(exc), 400)
