from datetime import date, datetime
from flask_sqlalchemy.model import Model


def serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Model):
        return model_to_dict(value)
    return value


def model_to_dict(instance):
    return {column.name: serialize_value(getattr(instance, column.name)) for column in instance.__table__.columns}
