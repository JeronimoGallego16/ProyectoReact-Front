def success_response(data=None, message='Success', status_code=200):
    return {'message': message, 'data': data}, status_code


def error_response(message='Error', status_code=400, details=None):
    body = {'message': message}
    if details is not None:
        body['details'] = details
    return body, status_code
