from app.models import db
from app.models.entities import Rubric, Criterion, Scale, Evaluation, Grade, GradeDetail, Enrollment, Student
from app.repositories.repositories import (
    RubricRepository, CriterionRepository, ScaleRepository,
    EvaluationRepository, GradeRepository, EnrollmentRepository, GradeDetailRepository
)
from app.utils.serializers import model_to_dict


class EvaluationService:
    def __init__(self):
        self.rubric_repository = RubricRepository()
        self.criterion_repository = CriterionRepository()
        self.scale_repository = ScaleRepository()
        self.evaluation_repository = EvaluationRepository()
        self.grade_repository = GradeRepository()
        self.enrollment_repository = EnrollmentRepository()
        self.grade_detail_repository = GradeDetailRepository()
        self.repo_map = {
            'rubrics': self.rubric_repository,
            'criteria': self.criterion_repository,
            'scales': self.scale_repository,
            'evaluations': self.evaluation_repository,
            'grades': self.grade_repository,
            'grade-details': self.grade_detail_repository,
        }

    def _resolve_repository(self, entity_name):
        repository = self.repo_map.get(entity_name)
        if not repository:
            raise ValueError('unsupported entity')
        return repository

    def _get_entity_or_fail(self, entity_name, entity_id):
        repository = self._resolve_repository(entity_name)
        entity = repository.get_by_id(entity_id)
        if not entity:
            raise ValueError(f'{entity_name[:-1]} not found')
        return entity, repository

    def list_entities(self, entity_name):
        repository = self._resolve_repository(entity_name)
        items = repository.get_all()
        if entity_name == 'grades':
            return [self.get_grade(item.id) for item in items]
        return [model_to_dict(item) for item in items]

    def get_entity(self, entity_name, entity_id):
        entity, _ = self._get_entity_or_fail(entity_name, entity_id)
        if entity_name == 'grades':
            return self.get_grade(entity_id)
        return model_to_dict(entity)

    def update_entity(self, entity_name, entity_id, payload):
        entity, _ = self._get_entity_or_fail(entity_name, entity_id)

        if entity_name == 'scales':
            criterion_id = payload.get('criterion_id', entity.criterion_id)
            value = payload.get('value', entity.value)
            duplicate = Scale.query.filter_by(criterion_id=criterion_id, value=value).first()
            if duplicate and duplicate.id != entity.id:
                raise ValueError('scale value must be unique inside the criterion')

        if entity_name == 'grades' and entity.is_locked:
            raise ValueError('grade is locked')

        for field, value in payload.items():
            if hasattr(entity, field):
                setattr(entity, field, value)

        db.session.commit()
        return self.get_grade(entity.id) if entity_name == 'grades' else model_to_dict(entity)

    def delete_entity(self, entity_name, entity_id):
        entity, repository = self._get_entity_or_fail(entity_name, entity_id)
        repository.delete(entity)
        return {'id': entity_id, 'deleted': True, 'entity': entity_name}

    def search_entities(self, entity_name, filters):
        repository = self._resolve_repository(entity_name)
        items = repository.search_by_attributes(filters)
        if entity_name == 'grades':
            return [self.get_grade(item.id) for item in items]
        return [model_to_dict(item) for item in items]

    def create_rubric(self, payload):
        entity = Rubric(**payload)
        return model_to_dict(self.rubric_repository.create(entity))

    def create_entity(self, entity_name, payload):
        if entity_name == 'grade-details':
            # validate scale and student
            scale = self.scale_repository.get_by_id(payload.get('scale_id'))
            if not scale:
                raise ValueError('scale not found')
            student = Student.query.get(payload.get('student_id'))
            if not student:
                raise ValueError('student not found')
            entity = GradeDetail(**payload)
            created = self.grade_detail_repository.create(entity)
            return model_to_dict(created)
        raise ValueError('unsupported entity for creation')

    def add_criterion(self, payload):
        entity = Criterion(**payload)
        criterion = self.criterion_repository.create(entity)
        return model_to_dict(criterion)

    def add_scale(self, payload):
        criterion = self.criterion_repository.get_by_id(payload['criterion_id'])
        if not criterion:
            raise ValueError('criterion not found')
        existing_values = {scale.value for scale in criterion.scales}
        if payload['value'] in existing_values:
            raise ValueError('scale value must be unique inside the criterion')
        entity = Scale(**payload)
        return model_to_dict(self.scale_repository.create(entity))

    def publish_rubric(self, rubric_id):
        rubric = self.rubric_repository.get_by_id(rubric_id)
        if not rubric:
            raise ValueError('rubric not found')
        if not rubric.criteria:
            raise ValueError('rubric must have criteria before publishing')
        total_weight = sum(item.weight for item in rubric.criteria)
        if round(total_weight, 2) != 100.0:
            raise ValueError('criteria weights must sum 100')
        for criterion in rubric.criteria:
            if len(criterion.scales) < 2 or len(criterion.scales) > 5:
                raise ValueError('each criterion must have between 2 and 5 scales')
        rubric.is_public = True
        db.session.commit()
        return model_to_dict(rubric)

    def create_evaluation(self, payload):
        entity = Evaluation(**payload)
        return model_to_dict(self.evaluation_repository.create(entity))

    def associate_rubric(self, evaluation_id, rubric_id):
        evaluation = self.evaluation_repository.get_by_id(evaluation_id)
        rubric = self.rubric_repository.get_by_id(rubric_id)
        if not evaluation:
            raise ValueError('evaluation not found')
        if not rubric or not rubric.is_public:
            raise ValueError('rubric must exist and be public')
        # If there are existing grades for enrollments in this evaluation's group, prevent changing rubric
        enrollment_ids = [e.id for e in Enrollment.query.filter_by(group_id=evaluation.group_id).all()]
        existing_grade = Grade.query.filter(Grade.enrollment_id.in_(enrollment_ids)).first() if enrollment_ids else None
        if existing_grade and evaluation.rubric_id and evaluation.rubric_id != rubric_id:
            raise ValueError('rubric cannot be changed because grades already exist')
        evaluation.rubric_id = rubric_id
        evaluation.subject_id = rubric.subject_id
        db.session.commit()
        return model_to_dict(evaluation)

    def grade_student(self, payload):
        enrollment = self.enrollment_repository.get_by_id(payload['enrollment_id'])
        if not enrollment:
            raise ValueError('enrollment not found')

        # Support providing either evaluation_id or rubric_id
        evaluation = None
        rubric = None
        if 'evaluation_id' in payload and payload.get('evaluation_id'):
            evaluation = self.evaluation_repository.get_by_id(payload['evaluation_id'])
            if not evaluation or not evaluation.rubric_id:
                raise ValueError('evaluation must have an associated rubric')
            rubric = evaluation.rubric
        elif 'rubric_id' in payload and payload.get('rubric_id'):
            rubric = self.rubric_repository.get_by_id(payload['rubric_id'])
            if not rubric:
                raise ValueError('rubric not found')
        else:
            raise ValueError('either evaluation_id or rubric_id must be provided')

        # find or create Grade (unique by enrollment + rubric)
        grade = Grade.query.filter_by(enrollment_id=enrollment.id, rubric_id=rubric.id).first()
        if not grade:
            grade = Grade(enrollment_id=enrollment.id, rubric_id=rubric.id)
            db.session.add(grade)
            db.session.flush()
        elif grade.is_locked:
            raise ValueError('grade is locked')

        # Use GradeDetail per student (scale <-> student). Remove previous details for this student
        student_id = enrollment.student_id
        rubric_scale_ids = {scale.id for criterion in rubric.criteria for scale in criterion.scales}
        GradeDetail.query.filter(GradeDetail.student_id == student_id, GradeDetail.scale_id.in_(list(rubric_scale_ids))).delete(synchronize_session=False)

        selected_scale_ids = {item['scale_id'] for item in payload['details']}
        if not selected_scale_ids.issubset(rubric_scale_ids):
            raise ValueError('one or more scales do not belong to the evaluation rubric')

        criteria_covered = set()
        final_score = 0
        for detail_payload in payload['details']:
            scale = self.scale_repository.get_by_id(detail_payload['scale_id'])
            weight = scale.criterion.weight
            criteria_covered.add(scale.criterion_id)
            score = scale.value * (weight / 100.0)
            final_score += score
            db.session.add(GradeDetail(
                scale_id=scale.id,
                student_id=student_id,
                score=score,
                comment=detail_payload.get('comment')
            ))

        rubric_criteria_ids = {criterion.id for criterion in rubric.criteria}
        if payload.get('status', 'DRAFT') == 'SENT' and criteria_covered != rubric_criteria_ids:
            raise ValueError('all criteria must be graded before sending')

        grade.final_score = round(final_score, 2)
        grade.status = payload.get('status', 'DRAFT')
        grade.observations = payload.get('observations')
        db.session.commit()
        return self.get_grade(grade.id)

    def register_final_scores(self, group_id):
        enrollments = Enrollment.query.filter_by(group_id=group_id, status='ACTIVE').all()
        response = []
        for enrollment in enrollments:
            evaluations = Evaluation.query.filter_by(group_id=group_id).all()
            rubric_to_eval = {ev.rubric_id: ev for ev in evaluations if ev.rubric_id}
            rubric_ids = list(rubric_to_eval.keys())
            grades = Grade.query.filter(Grade.enrollment_id == enrollment.id, Grade.rubric_id.in_(rubric_ids)).all() if rubric_ids else []
            final_score = round(sum(g.final_score * (rubric_to_eval[g.rubric_id].weight / 100.0) for g in grades), 2)
            for grade in grades:
                grade.is_locked = True
            response.append({
                'enrollment_id': enrollment.id,
                'student_id': enrollment.student_id,
                'official_final_score': final_score,
                'evaluations_count': len(grades)
            })
        db.session.commit()
        return response

    def get_grade(self, grade_id):
        grade = self.grade_repository.get_by_id(grade_id)
        if not grade:
            raise ValueError('grade not found')
        body = model_to_dict(grade)
        # collect details from GradeDetail entries for this student limited to the grade's rubric
        enrollment = grade.enrollment
        student_id = enrollment.student_id
        # determine rubric from grade
        rubric = grade.rubric
        rubric_scale_ids = {scale.id for criterion in rubric.criteria for scale in criterion.scales} if rubric else set()
        details = GradeDetail.query.filter(GradeDetail.student_id == student_id, GradeDetail.scale_id.in_(list(rubric_scale_ids))).all()
        body['details'] = [model_to_dict(detail) for detail in details]
        return body
