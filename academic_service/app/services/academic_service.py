from datetime import date
from app.models import db
from app.models.entities import Career, Semester, Subject, StudyPlan, Group, Registration, Enrollment
from app.repositories.repositories import (
    CareerRepository, SemesterRepository, SubjectRepository, StudyPlanRepository,
    GroupRepository, RegistrationRepository, EnrollmentRepository, StudentRepository,
    TeacherRepository
)
from app.utils.serializers import model_to_dict


class AcademicService:
    def __init__(self):
        self.career_repository = CareerRepository()
        self.semester_repository = SemesterRepository()
        self.subject_repository = SubjectRepository()
        self.study_plan_repository = StudyPlanRepository()
        self.group_repository = GroupRepository()
        self.registration_repository = RegistrationRepository()
        self.enrollment_repository = EnrollmentRepository()
        self.student_repository = StudentRepository()
        self.teacher_repository = TeacherRepository()
        self.repo_map = {
            'careers': (self.career_repository, Career),
            'semesters': (self.semester_repository, Semester),
            'subjects': (self.subject_repository, Subject),
            'study-plans': (self.study_plan_repository, StudyPlan),
            'groups': (self.group_repository, Group),
            'registrations': (self.registration_repository, Registration),
            'enrollments': (self.enrollment_repository, Enrollment),
            'students': (self.student_repository, None),
            'teachers': (self.teacher_repository, None),
        }

    def _resolve_repository(self, entity_name):
        resolved = self.repo_map.get(entity_name)
        if not resolved:
            raise ValueError('unsupported entity')
        return resolved

    def _get_entity_or_fail(self, entity_name, entity_id):
        repository, _ = self._resolve_repository(entity_name)
        entity = repository.get_by_id(entity_id)
        if not entity:
            raise ValueError(f'{entity_name[:-1]} not found')
        return entity, repository

    def _validate_dates(self, payload):
        start_date = date.fromisoformat(payload['start_date'])
        end_date = date.fromisoformat(payload['end_date'])
        if start_date >= end_date:
            raise ValueError('start_date must be earlier than end_date')
        return start_date, end_date

    def _deactivate_other_active_semesters(self, current_semester_id=None):
        # Semesters are global (no career dependency). Deactivate other active semesters.
        active_semesters = self.semester_repository.find_all_by(is_active=True)
        for semester in active_semesters:
            if semester.id != current_semester_id:
                semester.is_active = False

    def create_career(self, payload):
        if self.career_repository.find_one_by(code=payload['code']):
            raise ValueError('career code already exists')
        entity = Career(**payload)
        return model_to_dict(self.career_repository.create(entity))

    def list_entities(self, entity_name):
        repository, _ = self._resolve_repository(entity_name)
        return [model_to_dict(item) for item in repository.get_all()]

    def get_entity(self, entity_name, entity_id):
        entity, _ = self._get_entity_or_fail(entity_name, entity_id)
        return model_to_dict(entity)

    def update_entity(self, entity_name, entity_id, payload):
        entity, _ = self._get_entity_or_fail(entity_name, entity_id)

        if entity_name == 'careers':
            if 'code' in payload and payload['code'] != entity.code and self.career_repository.find_one_by(code=payload['code']):
                raise ValueError('career code already exists')
        elif entity_name == 'semesters':
            if 'start_date' in payload or 'end_date' in payload:
                merged = {
                    'start_date': payload.get('start_date', entity.start_date.isoformat()),
                    'end_date': payload.get('end_date', entity.end_date.isoformat())
                }
                start_date, end_date = self._validate_dates(merged)
                entity.start_date = start_date
                entity.end_date = end_date
                if payload.get('is_active') is True:
                    self._deactivate_other_active_semesters(entity.id)
        elif entity_name == 'subjects':
            if 'code' in payload and payload['code'] != entity.code and self.subject_repository.find_one_by(code=payload['code']):
                raise ValueError('subject code already exists')
            if 'credits' in payload and int(payload['credits']) <= 0:
                raise ValueError('credits must be positive')
        elif entity_name == 'groups':
            if 'group_code' in payload and payload['group_code'] != entity.group_code and self.group_repository.find_one_by(group_code=payload['group_code']):
                raise ValueError('group code already exists')
        elif entity_name == 'registrations':
            if payload.get('is_active'):
                active = Registration.query.filter_by(
                    student_id=payload.get('student_id', entity.student_id),
                    career_id=payload.get('career_id', entity.career_id),
                    is_active=True
                ).first()
                if active and active.id != entity.id:
                    raise ValueError('student already has an active registration in this career')
        elif entity_name == 'enrollments':
            if 'group_id' in payload or 'student_id' in payload:
                active = Enrollment.query.filter_by(
                    student_id=payload.get('student_id', entity.student_id),
                    group_id=payload.get('group_id', entity.group_id)
                ).first()
                if active and active.id != entity.id:
                    raise ValueError('student is already enrolled in this group')

        for field, value in payload.items():
            if not hasattr(entity, field):
                continue
            if entity_name == 'semesters' and field in {'start_date', 'end_date'}:
                continue
            setattr(entity, field, value)

        db.session.commit()
        return model_to_dict(entity)

    def delete_entity(self, entity_name, entity_id):
        entity, repository = self._get_entity_or_fail(entity_name, entity_id)
        repository.delete(entity)
        return {'id': entity_id, 'deleted': True, 'entity': entity_name}

    def create_semester(self, payload):
        start_date, end_date = self._validate_dates(payload)
        if payload.get('is_active'):
            self._deactivate_other_active_semesters()
        entity = Semester(
            name=payload['name'],
            code=payload['code'],
            start_date=start_date,
            end_date=end_date,
            is_active=payload.get('is_active', False)
        )
        db.session.add(entity)
        db.session.commit()
        return model_to_dict(entity)

    def create_subject(self, payload):
        if self.subject_repository.find_one_by(code=payload['code']):
            raise ValueError('subject code already exists')
        if int(payload['credits']) <= 0:
            raise ValueError('credits must be positive')
        entity = Subject(**payload)
        return model_to_dict(self.subject_repository.create(entity))

    def create_study_plan(self, payload):
        entity = StudyPlan(**payload)
        return model_to_dict(self.study_plan_repository.create(entity))

    def create_group(self, payload):
        if self.group_repository.find_one_by(group_code=payload['group_code']):
            raise ValueError('group code already exists')
        if 'teacher_id' not in payload or not payload.get('teacher_id'):
            raise ValueError('teacher_id is required for group')
        teacher = self.teacher_repository.get_by_id(payload['teacher_id'])
        if not teacher:
            raise ValueError('teacher not found')
        entity = Group(**payload)
        return model_to_dict(self.group_repository.create(entity))

    def assign_teacher_to_group(self, group_id, teacher_id):
        group = self.group_repository.get_by_id(group_id)
        teacher = self.teacher_repository.get_by_id(teacher_id)
        if not group:
            raise ValueError('group not found')
        if not teacher:
            raise ValueError('teacher not found')
        if not group.subject_id:
            raise ValueError('group has no subject assigned')
        existing = Group.query.filter_by(teacher_id=teacher_id, subject_id=group.subject_id, semester_id=group.semester_id).first()
        if existing and existing.id != group.id:
            raise ValueError('teacher already has a group with the same subject in this semester')
        if group.teacher_id == teacher_id:
            raise ValueError('teacher is already assigned to this group')
        group.teacher_id = teacher_id
        db.session.commit()
        return model_to_dict(group)

    def create_registration(self, payload):
        student = self.student_repository.get_by_id(payload['student_id'])
        if not student:
            raise ValueError('student not found')
        active_registration = Registration.query.filter_by(
            student_id=payload['student_id'],
            career_id=payload['career_id'],
            is_active=True
        ).first()
        if active_registration:
            raise ValueError('student already has an active registration in this career')
        entity = Registration(**payload)
        return model_to_dict(self.registration_repository.create(entity))

    def create_enrollment(self, payload):
        student = self.student_repository.get_by_id(payload['student_id'])
        group = self.group_repository.get_by_id(payload['group_id'])
        if not student:
            raise ValueError('student not found')
        if not group:
            raise ValueError('group not found')
        registration = Registration.query.filter_by(student_id=student.id, is_active=True).first()
        if not registration:
            raise ValueError('student does not have an active registration')
        existing = Enrollment.query.filter_by(student_id=student.id, group_id=group.id).first()
        if existing:
            raise ValueError('student is already enrolled in this group')
        current_size = Enrollment.query.filter_by(group_id=group.id, status='ACTIVE').count()
        if current_size >= group.capacity:
            raise ValueError('group has no available capacity')
        entity = Enrollment(student_id=student.id, group_id=group.id, status=payload.get('status', 'ACTIVE'))
        return model_to_dict(self.enrollment_repository.create(entity))

    def search_entities(self, entity_name, filters):
        repository, _ = self._resolve_repository(entity_name)
        return [model_to_dict(item) for item in repository.search_by_attributes(filters)]
