from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "admin":
                return jsonify({"msg": "Admins only!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def tutor_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            # Admins should also be able to access tutor routes if needed, 
            # but for strict separation, we'll allow both here or just tutors.
            if claims.get("role") not in ["tutor", "admin"]:
                return jsonify({"msg": "Tutors only!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper