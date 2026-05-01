from flask import Blueprint, request
from app.services.evaluation_service import EvaluationService
from app.utils.response import success_response, error_response


evaluation_bp = Blueprint('evaluation', __name__)
evaluation_service = EvaluationService()


@evaluation_bp.post('/rubrics')
def create_rubric():
    try:
        return success_response(evaluation_service.create_rubric(request.json), 'Rubric created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/criteria')
def add_criterion():
    try:
        return success_response(evaluation_service.add_criterion(request.json), 'Criterion created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/scales')
def add_scale():
    try:
        return success_response(evaluation_service.add_scale(request.json), 'Scale created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.patch('/rubrics/<rubric_id>/publish')
def publish_rubric(rubric_id):
    try:
        return success_response(evaluation_service.publish_rubric(rubric_id), 'Rubric published')
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/evaluations')
def create_evaluation():
    try:
        return success_response(evaluation_service.create_evaluation(request.json), 'Evaluation created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.patch('/evaluations/<evaluation_id>/associate-rubric/<rubric_id>')
def associate_rubric(evaluation_id, rubric_id):
    try:
        return success_response(evaluation_service.associate_rubric(evaluation_id, rubric_id), 'Rubric associated')
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/grades')
def grade_student():
    try:
        return success_response(evaluation_service.grade_student(request.json), 'Grade processed', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/<entity_name>')
def create_entity(entity_name):
    try:
        return success_response(evaluation_service.create_entity(entity_name, request.json), 'Entity created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/grade-details')
def create_grade_detail():
    try:
        return success_response(evaluation_service.create_entity('grade-details', request.json), 'Grade detail created', 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.post('/groups/<group_id>/register-final-scores')
def register_final_scores(group_id):
    try:
        return success_response(evaluation_service.register_final_scores(group_id), 'Final scores registered')
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.get('/<entity_name>')
def list_entities(entity_name):
    try:
        return success_response(evaluation_service.list_entities(entity_name))
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.get('/<entity_name>/<entity_id>')
def get_entity(entity_name, entity_id):
    try:
        return success_response(evaluation_service.get_entity(entity_name, entity_id))
    except ValueError as exc:
        return error_response(str(exc), 404)


@evaluation_bp.put('/<entity_name>/<entity_id>')
def update_entity(entity_name, entity_id):
    try:
        return success_response(evaluation_service.update_entity(entity_name, entity_id, request.json), 'Entity updated')
    except ValueError as exc:
        return error_response(str(exc), 400)


@evaluation_bp.delete('/<entity_name>/<entity_id>')
def delete_entity(entity_name, entity_id):
    try:
        return success_response(evaluation_service.delete_entity(entity_name, entity_id), 'Entity deleted')
    except ValueError as exc:
        return error_response(str(exc), 404)


@evaluation_bp.get('/<entity_name>/search')
def search_entity(entity_name):
    try:
        return success_response(evaluation_service.search_entities(entity_name, request.args.to_dict()))
    except ValueError as exc:
        return error_response(str(exc), 400)
