from app.models import db
from app.models.entities import User, Teacher, Student, UserRole
from app.repositories.repositories import UserRepository, TeacherRepository, StudentRepository
from app.utils.security import hash_password
from app.utils.serializers import model_to_dict


class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.teacher_repository = TeacherRepository()
        self.student_repository = StudentRepository()

    def create_user(self, payload: dict):
        email = payload.get('email')
        password = payload.get('password')
        code = payload.get('code')
        role = payload.get('role')

        if not email or not password or not code or not role:
            raise ValueError('email, password, code and role are required')
        if self.user_repository.find_one_by(email=email):
            raise ValueError('email already exists')
        if self.user_repository.find_one_by(code=code):
            raise ValueError('code already exists')

        user = User(email=email, password_hash=hash_password(password), code=code, role=role, is_active=True)
        db.session.add(user)
        db.session.flush()

        if role == UserRole.TEACHER.value:
            identification = payload.get('identification')
            if self.teacher_repository.find_one_by(identification=identification):
                raise ValueError('teacher identification already exists')
            profile = Teacher(
                user_id=user.id,
                first_name=payload.get('first_name'),
                last_name=payload.get('last_name'),
                phone=payload.get('phone'),
                identification=identification,
                specialty=payload.get('specialty')
            )
            db.session.add(profile)
        elif role == UserRole.STUDENT.value:
            identification = payload.get('identification')
            if self.student_repository.find_one_by(identification=identification):
                raise ValueError('student identification already exists')
            profile = Student(
                user_id=user.id,
                first_name=payload.get('first_name'),
                last_name=payload.get('last_name'),
                identification=identification,
            )
            db.session.add(profile)

        db.session.commit()
        return self.get_user_with_profile(user.id)

    def list_users(self):
        return [self.get_user_with_profile(user.id) for user in self.user_repository.get_all()]

    def get_user(self, user_id: str):
        user = self.get_user_with_profile(user_id)
        if not user:
            raise ValueError('user not found')
        return user

    def update_user(self, user_id: str, payload: dict):
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError('user not found')

        if 'email' in payload and payload['email'] != user.email and self.user_repository.find_one_by(email=payload['email']):
            raise ValueError('email already exists')
        if 'code' in payload and payload['code'] != user.code and self.user_repository.find_one_by(code=payload['code']):
            raise ValueError('code already exists')

        if 'password' in payload and payload['password']:
            user.password_hash = hash_password(payload['password'])

        for field in ['email', 'code', 'is_active']:
            if field in payload:
                setattr(user, field, payload[field])

        profile = user.teacher or user.student
        if profile:
            for field in ['first_name', 'last_name', 'phone', 'identification', 'specialty']:
                if hasattr(profile, field) and field in payload:
                    if field == 'identification' and payload[field] != getattr(profile, field):
                        duplicate = self.teacher_repository.find_one_by(identification=payload[field]) if user.teacher else self.student_repository.find_one_by(identification=payload[field])
                        if duplicate and duplicate.id != profile.id:
                            raise ValueError('identification already exists')
                    setattr(profile, field, payload[field])

        db.session.commit()
        return self.get_user_with_profile(user.id)

    def delete_user(self, user_id: str):
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError('user not found')
        self.user_repository.delete(user)
        return {'id': user_id, 'deleted': True, 'entity': 'users'}

    def deactivate_user(self, user_id: str):
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError('user not found')
        user.is_active = False
        db.session.commit()
        return self.get_user_with_profile(user.id)

    def get_user_with_profile(self, user_id: str):
        user = self.user_repository.get_by_id(user_id)
        if not user:
            return None
        body = model_to_dict(user)
        if user.teacher:
            body['profile'] = model_to_dict(user.teacher)
        if user.student:
            body['profile'] = model_to_dict(user.student)
        return body

    def search_users(self, filters: dict):
        users = self.user_repository.get_all()
        results = []
        for user in users:
            profile = user.teacher or user.student
            if filters.get('role') and user.role != filters['role']:
                continue
            if 'is_active' in filters and filters['is_active'] is not None and user.is_active != filters['is_active']:
                continue
            if filters.get('email') and filters['email'].lower() not in user.email.lower():
                continue
            if filters.get('code') and filters['code'].lower() not in user.code.lower():
                continue
            if profile and filters.get('identification') and filters['identification'].lower() not in profile.identification.lower():
                continue
            if profile and filters.get('first_name') and filters['first_name'].lower() not in profile.first_name.lower():
                continue
            if profile and filters.get('last_name') and filters['last_name'].lower() not in profile.last_name.lower():
                continue
            item = model_to_dict(user)
            item['profile'] = model_to_dict(profile) if profile else None
            results.append(item)
        return results
