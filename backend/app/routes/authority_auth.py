from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

from app.models.authorities import Authority
from app.utils.responses import success_response, error_response

authority_auth_bp = Blueprint('authority_auth', __name__)


# ------------------------------------------------------
# REGISTER NEW AUTHORITY (Admin use only)
# ------------------------------------------------------
@authority_auth_bp.route('/register', methods=['POST'])
def register_authority():
    data = request.get_json() or {}

    required = ["name", "username", "password"]
    if not all(data.get(x) for x in required):
        return error_response("Missing required fields", 400)

    if Authority.objects(username=data["username"]).first():
        return error_response("Username already exists", 409)

    authority = Authority(
        name=data["name"],
        username=data["username"],
        password_hash=generate_password_hash(data["password"]),
        designation=data.get("designation"),
        department=data.get("department"),
        mobile=data.get("mobile")
    )
    authority.save()

    return success_response({"message": "Authority registered successfully"}, 201)


# ------------------------------------------------------
# LOGIN USING USERNAME + PASSWORD
# ------------------------------------------------------
@authority_auth_bp.route('/login', methods=['POST'])
def login_authority():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return error_response("Username and password required", 400)

    authority = Authority.objects(username=username).first()
    if not authority:
        return error_response("Invalid username or password", 401)

    if not check_password_hash(authority.password_hash, password):
        return error_response("Invalid username or password", 401)

    token = create_access_token(
        identity=str(authority.id),
        expires_delta=timedelta(hours=8)
    )

    return success_response(
        {"message": "Login successful", "access_token": token},
        200
    )


# ------------------------------------------------------
# GET LOGGED-IN AUTHORITY PROFILE
# ------------------------------------------------------
@authority_auth_bp.route('/me', methods=['GET'])
@jwt_required()
def authority_me():
    authority_id = get_jwt_identity()

    authority = Authority.objects(id=authority_id).first()
    if not authority:
        return error_response("User not found", 404)

    data = authority.to_mongo().to_dict()
    data["_id"] = str(data["_id"])
    del data["password_hash"]

    return success_response(data, 200)
