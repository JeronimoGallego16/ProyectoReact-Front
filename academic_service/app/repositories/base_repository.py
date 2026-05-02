from sqlalchemy import or_
from app.models import db


class BaseRepository:
    def __init__(self, model):
        self.model = model

    def create(self, entity):
        db.session.add(entity)
        db.session.commit()
        return entity

    def get_by_id(self, entity_id):
        return self.model.query.get(entity_id)

    def get_all(self):
        return self.model.query.all()

    def update(self):
        db.session.commit()

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()

    def find_one_by(self, **filters):
        return self.model.query.filter_by(**filters).first()

    def find_all_by(self, **filters):
        return self.model.query.filter_by(**filters).all()

    def search_by_attributes(self, filters: dict):
        query = self.model.query
        for field_name, value in filters.items():
            column = getattr(self.model, field_name, None)
            if column is not None and value is not None:
                query = query.filter(column.ilike(f'%{value}%') if isinstance(value, str) else column == value)
        return query.all()

    def search_or_like(self, filters: dict):
        conditions = []
        for field_name, value in filters.items():
            column = getattr(self.model, field_name, None)
            if column is not None and value is not None:
                conditions.append(column.ilike(f'%{value}%') if isinstance(value, str) else column == value)
        if not conditions:
            return []
        return self.model.query.filter(or_(*conditions)).all()
