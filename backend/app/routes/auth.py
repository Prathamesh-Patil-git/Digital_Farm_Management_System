from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from bson import ObjectId

from app.db import DB
from app.utils.responses import success_response, error_response
from app.services.otp_service import OTPService
from app.models.farmers import Farmer

auth_bp = Blueprint('auth', __name__)
otp_service = OTPService()


# -------------------------------
# REGISTER STEP 1: Request OTP
# -------------------------------
@auth_bp.route('/send-otp', methods=['POST'])
def register():
    data = request.get_json() or {}
    mobile = data.get('mobile')

    if not mobile:
        return error_response("Mobile number is required", 400)

    # Check if mobile already exists
    if Farmer.objects(mobile=mobile).first():
        return error_response("Mobile number already registered", 409)

    # Send OTP using Twilio
    verification_sid = otp_service.send_otp(mobile)

    if verification_sid:
        return success_response(
            {"message": "OTP sent successfully", "sid": verification_sid},
            200
        )

    return error_response("Failed to send OTP", 500)


# -------------------------------
# LOGIN STEP 1: Request OTP
# -------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    mobile = data.get('mobile')

    if not mobile:
        return error_response("Mobile number is required", 400)

    farmer = Farmer.objects(mobile=mobile).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    verification_sid = otp_service.send_otp(mobile)

    if verification_sid:
        return success_response(
            {"message": "OTP sent successfully", "sid": verification_sid},
            200
        )

    return error_response("Failed to send OTP", 500)


# -------------------------------
# LOGIN STEP 2: Verify OTP + Login
# -------------------------------
@auth_bp.route('/verify-otp-and-login', methods=['POST'])
def verify_otp_and_login():
    data = request.get_json() or {}

    mobile = data.get('mobile')
    otp_code = data.get('otp_code')

    if not mobile or not otp_code:
        return error_response("Mobile number and OTP are required", 400)

    if not otp_service.verify_otp(mobile, otp_code):
        return error_response("Invalid OTP", 401)

    farmer = Farmer.objects(mobile=mobile).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    access_token = create_access_token(
        identity=str(farmer.id),
        expires_delta=timedelta(hours=24)
    )

    return success_response(
        {"message": "Login successful", "access_token": access_token},
        200
    )


# -------------------------------
# REGISTER STEP 2: Verify OTP + Create Farmer + Auto Login
# -------------------------------
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}

    required_fields = ["mobile", "otp_code"]
    if not all(data.get(f) for f in required_fields):
        return error_response("Missing required fields", 400)

    mobile = data["mobile"]
    otp_code = data["otp_code"]

    if not otp_service.verify_otp(mobile, otp_code):
        return error_response("Invalid OTP", 401)

    # OPTIONAL (Recommended): return a temp token
    temp_token = create_access_token(
        identity=mobile,
        expires_delta=timedelta(minutes=10)   # short lived
    )

    return success_response(
        {"message": "OTP verified", "otp_verified": True, "temp_token": temp_token},
        200
    )

@auth_bp.route('/register', methods=['POST'])
@jwt_required()  # We use temp token provided after OTP verification
def register_farmer():
    current_mobile = get_jwt_identity()

    if not current_mobile:
        return error_response("Mobile number is required", 400)

    data = request.get_json() or {}

    # Validate required fields
    required_fields = ["name", "aadhar_number"]
    if not all(data.get(f) for f in required_fields):
        return error_response("Missing required fields", 400)

    if Farmer.objects(mobile=current_mobile).first():
        return error_response("Mobile number already registered", 409)

    # Create Farmer instance with basic required fields
    farmer = Farmer(
        name=data["name"],
        mobile=current_mobile,
        aadhar_number=data["aadhar_number"],
        mobile_verified=True
    )

    # Assign other fields if present in the request data
    if 'age' in data: farmer.age = data['age']
    if 'gender' in data: farmer.gender = data['gender']
    if 'address' in data: farmer.address = data['address']
    if 'photo_path' in data: farmer.photo_path = data['photo_path']
    if 'aadhar_photo_path' in data: farmer.aadhar_photo_path = data['aadhar_photo_path']
    if 'tahsildar_verification_path' in data: farmer.tahsildar_verification_path = data['tahsildar_verification_path']
    if 'is_verified' in data: farmer.is_verified = data['is_verified']

    # Handle embedded GPSLocation
    if 'gps_location' in data and isinstance(data['gps_location'], dict):
        from app.models.farmers import GPSLocation # Import here to avoid circular dependency if any
        farmer.gps_location = GPSLocation(
            lat=data['gps_location'].get('lat'),
            lng=data['gps_location'].get('lng')
        )

    # Handle embedded AfterRegistration
    if 'after_registration' in data and isinstance(data['after_registration'], dict):
        from app.models.farmers import AfterRegistration # Import here to avoid circular dependency if any
        farmer.after_registration = AfterRegistration(
            maintains_record_book=data['after_registration'].get('maintains_record_book'),
            medicines_in_use=data['after_registration'].get('medicines_in_use'),
            follows_vet=data['after_registration'].get('follows_vet'),
            vet_name=data['after_registration'].get('vet_name'),
            milk_supply_to=data['after_registration'].get('milk_supply_to'),
            cow_count=data['after_registration'].get('cow_count'),
            goat_count=data['after_registration'].get('goat_count')
        )

    try:
        farmer.save()
    except Exception as e:
        return error_response(f"Failed to save farmer data: {str(e)}", 500)

    access_token = create_access_token(
        identity=str(farmer.id),
        expires_delta=timedelta(hours=24)
    )

    return success_response(
        {"message": "Registration successful", "access_token": access_token},
        201
    )


# -------------------------------
# GET LOGGED-IN FARMER
# -------------------------------
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    farmer_id = get_jwt_identity()

    farmer = Farmer.objects(id=farmer_id).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    serialized = farmer.to_json()

    # Debug:
    print("🚀 Final JSON:", serialized)

    return success_response(serialized, 200)
