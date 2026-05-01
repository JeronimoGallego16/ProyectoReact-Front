from app.repositories.repositories import UserRepository
from app.utils.security import verify_password, create_access_token


class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()

    def login(self, email: str, password: str):
        user = self.user_repository.find_one_by(email=email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError('Invalid credentials')
        if not user.is_active:
            raise ValueError('Inactive user')

        token = create_access_token({
            'user_id': user.id,
            'email': user.email,
            'role': user.role
        })
        return {
            'access_token': token,
            'token_type': 'Bearer',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'code': user.code,
                'is_active': user.is_active
            }
        }
