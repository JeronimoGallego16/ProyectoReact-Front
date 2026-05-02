from app.models import db
from app.models.entities import User
from app.utils.security import hash_password


def initialize_database():
    db.create_all()
    admin = User.query.filter_by(email='admin@example.com').first()
    if not admin:
        db.session.add(User(
            email='admin@example.com',
            password_hash=hash_password('Admin123*'),
            code='ADM-001',
            role='ADMIN',
            is_active=True,
        ))
        db.session.commit()
