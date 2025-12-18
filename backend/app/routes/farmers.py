from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.models.farmer_model import Farmer
from app.utils.responses import success_response, error_response

farmers_bp = Blueprint('farmers', __name__)


# --------------------------------------------------
# CREATE FARMER (NOT USED — farmers created in OTP register)
# --------------------------------------------------
@farmers_bp.route('/', methods=['POST'])
@jwt_required()
def create_farmer():
    return error_response("Farmers are created via OTP registration. Use /auth/verify-otp-and-register", 400)


# --------------------------------------------------
# GET ALL FARMERS (Admin use)
# --------------------------------------------------
@farmers_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_farmers():
    # Later → restrict to admin using roles
    farmers = Farmer.objects().all()

    farmer_list = []
    for farmer in farmers:
        data = farmer.to_mongo().to_dict()
        data['_id'] = str(data['_id'])
        farmer_list.append(data)

    return success_response(farmer_list, 200)


# --------------------------------------------------
# GET LOGGED-IN FARMER PROFILE
# --------------------------------------------------
@farmers_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    farmer_id = get_jwt_identity()

    farmer = Farmer.objects(id=farmer_id).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    farmer_json = farmer.to_mongo().to_dict()
    farmer_json['_id'] = str(farmer_json['_id'])

    return success_response(farmer_json, 200)


# --------------------------------------------------
# GET ANY FARMER (admin/authority only in future)
# --------------------------------------------------
@farmers_bp.route('/<farmer_id>', methods=['GET'])
@jwt_required()
def get_farmer(farmer_id):
    try:
        farmer = Farmer.objects(id=farmer_id).first()
    except:
        return error_response("Invalid Farmer ID", 400)

    if not farmer:
        return error_response("Farmer not found", 404)

    farmer_json = farmer.to_mongo().to_dict()
    farmer_json['_id'] = str(farmer_json['_id'])

    return success_response(farmer_json, 200)


# --------------------------------------------------
# UPDATE FARMER PROFILE (Logged-in farmer only)
# --------------------------------------------------
@farmers_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    farmer_id = get_jwt_identity()
    data = request.get_json() or {}

    farmer = Farmer.objects(id=farmer_id).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    # Allowed fields for update
    allowed_fields = [
        "name", "age", "gender", "address",
        "gps_location",
        "after_registration"
    ]

    for field in allowed_fields:
        if field in data:
            setattr(farmer, field, data[field])

    farmer.save()

    farmer_json = farmer.to_mongo().to_dict()
    farmer_json['_id'] = str(farmer_json['_id'])

    return success_response(farmer_json, 200)


# --------------------------------------------------
# ADMIN UPDATE ANY FARMER (reserved for authority)
# --------------------------------------------------
@farmers_bp.route('/<farmer_id>', methods=['PUT'])
@jwt_required()
def update_farmer_admin(farmer_id):
    # TODO: add role check (authority/admin)

    data = request.get_json() or {}

    try:
        farmer = Farmer.objects(id=farmer_id).first()
    except:
        return error_response("Invalid Farmer ID", 400)

    if not farmer:
        return error_response("Farmer not found", 404)

    for key, value in data.items():
        if hasattr(farmer, key):
            setattr(farmer, key, value)

    farmer.save()

    farmer_json = farmer.to_mongo().to_dict()
    farmer_json['_id'] = str(farmer_json['_id'])

    return success_response(farmer_json, 200)
