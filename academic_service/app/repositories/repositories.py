from .base_repository import BaseRepository
from app.models.entities import (
    User, Teacher, Student, Career, Semester, Subject,
    StudyPlan, Group, Enrollment, Registration,
    Rubric, Criterion, Scale, Evaluation, Grade, GradeDetail
)


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)


class TeacherRepository(BaseRepository):
    def __init__(self):
        super().__init__(Teacher)


class StudentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Student)


class CareerRepository(BaseRepository):
    def __init__(self):
        super().__init__(Career)


class SemesterRepository(BaseRepository):
    def __init__(self):
        super().__init__(Semester)


class SubjectRepository(BaseRepository):
    def __init__(self):
        super().__init__(Subject)


class StudyPlanRepository(BaseRepository):
    def __init__(self):
        super().__init__(StudyPlan)


class GroupRepository(BaseRepository):
    def __init__(self):
        super().__init__(Group)


class EnrollmentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Enrollment)


class RegistrationRepository(BaseRepository):
    def __init__(self):
        super().__init__(Registration)


class RubricRepository(BaseRepository):
    def __init__(self):
        super().__init__(Rubric)


class CriterionRepository(BaseRepository):
    def __init__(self):
        super().__init__(Criterion)


class ScaleRepository(BaseRepository):
    def __init__(self):
        super().__init__(Scale)


class EvaluationRepository(BaseRepository):
    def __init__(self):
        super().__init__(Evaluation)


class GradeRepository(BaseRepository):
    def __init__(self):
        super().__init__(Grade)


class GradeDetailRepository(BaseRepository):
    def __init__(self):
        super().__init__(GradeDetail)
