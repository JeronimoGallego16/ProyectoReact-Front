import uuid
from datetime import datetime
from enum import Enum
from . import db


def generate_uuid():
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserRole(str, Enum):
    ADMIN = 'ADMIN'
    TEACHER = 'TEACHER'
    STUDENT = 'STUDENT'


class User(TimestampMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    teacher = db.relationship('Teacher', uselist=False, back_populates='user', cascade='all, delete-orphan')
    student = db.relationship('Student', uselist=False, back_populates='user', cascade='all, delete-orphan')


class Teacher(TimestampMixin, db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(30))
    identification = db.Column(db.String(50), unique=True, nullable=False)
    specialty = db.Column(db.String(120))

    user = db.relationship('User', back_populates='teacher')
    groups = db.relationship('Group', back_populates='teacher', cascade='all, delete-orphan')


class Student(TimestampMixin, db.Model):
    __tablename__ = 'students'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    identification = db.Column(db.String(50), unique=True, nullable=False)

    user = db.relationship('User', back_populates='student')
    registrations = db.relationship('Registration', back_populates='student')
    enrollments = db.relationship('Enrollment', back_populates='student')
    grade_details = db.relationship('GradeDetail', back_populates='student')


class Career(TimestampMixin, db.Model):
    __tablename__ = 'careers'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    registrations = db.relationship('Registration', back_populates='career')
    study_plans = db.relationship('StudyPlan', back_populates='career')
    # Semesters are now independent of Career


class Semester(TimestampMixin, db.Model):
    __tablename__ = 'semesters'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=False)
    groups = db.relationship('Group', back_populates='semester')


class Subject(TimestampMixin, db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    credits = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    groups = db.relationship('Group', back_populates='subject')
    study_plans = db.relationship('StudyPlan', back_populates='subject')
    evaluations = db.relationship('Evaluation', back_populates='subject')
    rubrics = db.relationship('Rubric', back_populates='subject')


class StudyPlan(TimestampMixin, db.Model):
    __tablename__ = 'study_plans'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    career_id = db.Column(db.String(36), db.ForeignKey('careers.id'), nullable=False)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    suggested_semester = db.Column(db.Integer, nullable=False)
    is_published = db.Column(db.Boolean, nullable=False, default=False)

    career = db.relationship('Career', back_populates='study_plans')
    subject = db.relationship('Subject', back_populates='study_plans')


class Group(TimestampMixin, db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    teacher_id = db.Column(db.String(36), db.ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    semester_id = db.Column(db.String(36), db.ForeignKey('semesters.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    group_code = db.Column(db.String(50), unique=True, nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=30)

    teacher = db.relationship('Teacher', back_populates='groups', passive_deletes=True)
    subject = db.relationship('Subject', back_populates='groups')
    semester = db.relationship('Semester', back_populates='groups')
    enrollments = db.relationship('Enrollment', back_populates='group')
    evaluations = db.relationship('Evaluation', back_populates='group')


class Enrollment(TimestampMixin, db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    student_id = db.Column(db.String(36), db.ForeignKey('students.id'), nullable=False)
    group_id = db.Column(db.String(36), db.ForeignKey('groups.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(30), nullable=False, default='ACTIVE')

    student = db.relationship('Student', back_populates='enrollments')
    group = db.relationship('Group', back_populates='enrollments')
    grades = db.relationship('Grade', back_populates='enrollment')

    __table_args__ = (db.UniqueConstraint('student_id', 'group_id', name='uq_student_group_enrollment'),)


class Registration(TimestampMixin, db.Model):
    __tablename__ = 'registrations'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    career_id = db.Column(db.String(36), db.ForeignKey('careers.id'), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey('students.id'), nullable=False)
    admission_period = db.Column(db.String(20), nullable=False)
    academic_status = db.Column(db.String(30), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    career = db.relationship('Career', back_populates='registrations')
    student = db.relationship('Student', back_populates='registrations')


class Rubric(TimestampMixin, db.Model):
    __tablename__ = 'rubrics'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)

    subject = db.relationship('Subject', back_populates='rubrics')
    criteria = db.relationship('Criterion', back_populates='rubric', cascade='all, delete-orphan')
    grades = db.relationship('Grade', back_populates='rubric')
    evaluations = db.relationship('Evaluation', back_populates='rubric')


class Criterion(TimestampMixin, db.Model):
    __tablename__ = 'criteria'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    rubric_id = db.Column(db.String(36), db.ForeignKey('rubrics.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    weight = db.Column(db.Float, nullable=False)

    rubric = db.relationship('Rubric', back_populates='criteria')
    scales = db.relationship('Scale', back_populates='criterion', cascade='all, delete-orphan')


class Scale(TimestampMixin, db.Model):
    __tablename__ = 'scales'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    criterion_id = db.Column(db.String(36), db.ForeignKey('criteria.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    value = db.Column(db.Float, nullable=False)

    criterion = db.relationship('Criterion', back_populates='scales')
    grade_details = db.relationship('GradeDetail', back_populates='scale')
    __table_args__ = (db.UniqueConstraint('criterion_id', 'value', name='uq_criterion_scale_value'),)


class Evaluation(TimestampMixin, db.Model):
    __tablename__ = 'evaluations'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    rubric_id = db.Column(db.String(36), db.ForeignKey('rubrics.id'), nullable=True)
    group_id = db.Column(db.String(36), db.ForeignKey('groups.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    weight = db.Column(db.Float, nullable=False)

    subject = db.relationship('Subject', back_populates='evaluations')
    rubric = db.relationship('Rubric', back_populates='evaluations')
    group = db.relationship('Group', back_populates='evaluations')
    # grades relationship removed: Grade no longer references Evaluation


class Grade(TimestampMixin, db.Model):
    __tablename__ = 'grades'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    enrollment_id = db.Column(db.String(36), db.ForeignKey('enrollments.id'), nullable=False)
    rubric_id = db.Column(db.String(36), db.ForeignKey('rubrics.id'), nullable=False)
    final_score = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default='DRAFT')
    observations = db.Column(db.Text)
    is_locked = db.Column(db.Boolean, nullable=False, default=False)

    enrollment = db.relationship('Enrollment', back_populates='grades')
    rubric = db.relationship('Rubric', back_populates='grades')
    # GradeDetail no longer linked to Grade; details are per Student

    __table_args__ = (db.UniqueConstraint('enrollment_id', 'rubric_id', name='uq_grade_enrollment_rubric'),)


class GradeDetail(TimestampMixin, db.Model):
    __tablename__ = 'grade_details'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    scale_id = db.Column(db.String(36), db.ForeignKey('scales.id'), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey('students.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text)

    scale = db.relationship('Scale', back_populates='grade_details')
    student = db.relationship('Student', back_populates='grade_details')
