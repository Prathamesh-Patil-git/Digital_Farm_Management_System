from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from app.utils.responses import success_response, error_response
from app.services.otp_service import OTPService
from app.models.vets import Vet
from app.utils.serializer import SerializerMixin

veterinarian_auth_bp = Blueprint('veterinarian_auth', __name__)
otp_service = OTPService()

# ============================================================
# 1️⃣ REGISTER → STEP 1 → SEND OTP
# ============================================================
@veterinarian_auth_bp.route('/register/send-otp', methods=['POST'])
def vet_register_send_otp():
    data = request.get_json() or {}
    mobile = data.get("mobile")

    if not mobile:
        return error_response("Mobile number is required", 400)

    if Vet.objects(mobile=mobile).first():
        return error_response("Mobile already registered", 409)

    sid = otp_service.send_otp(mobile)
    if sid:
        return success_response({"message": "OTP sent successfully"}, 200)

    return error_response("Failed to send OTP", 500)


# ============================================================
# 2️⃣ REGISTER → STEP 2 → VERIFY OTP (RETURN TEMP TOKEN)
# ============================================================
@veterinarian_auth_bp.route('/register/verify-otp', methods=['POST'])
def vet_register_verify_otp():
    data = request.get_json() or {}

    mobile = data.get("mobile")
    otp_code = data.get("otp_code")

    if not mobile or not otp_code:
        return error_response("Mobile number and OTP are required", 400)

    if not otp_service.verify_otp(mobile, otp_code):
        return error_response("Invalid OTP", 401)

    # Generate temp token valid for 10 minutes
    temp_token = create_access_token(
        identity=mobile,
        expires_delta=timedelta(minutes=10)
    )

    return success_response(
        {"message": "OTP verified", "temp_token": temp_token},
        200
    )


# ============================================================
# 3️⃣ REGISTER → STEP 3 → CREATE VET ACCOUNT (TEMP TOKEN REQUIRED)
# ============================================================
@veterinarian_auth_bp.route('/register', methods=['POST'])
@jwt_required()
def vet_register():
    mobile = get_jwt_identity()  # mobile extracted from temp token

    data = request.get_json() or {}
    required = ["name", "qualification", "registration_number"]

    if not all(data.get(f) for f in required):
        return error_response("Missing required fields", 400)

    if Vet.objects(mobile=mobile).first():
        return error_response("Mobile already registered", 409)

    vet = Vet(
        name=data["name"],
        mobile=mobile,
        qualification=data["qualification"],
        registration_number=data["registration_number"],
        mobile_verified=True
    )
    vet.save()

    access_token = create_access_token(identity=str(vet.id), expires_delta=timedelta(hours=24))

    return success_response(
        {"message": "Registration successful", "access_token": access_token},
        201
    )


# ============================================================
# 4️⃣ LOGIN → STEP 1 → SEND OTP
# ============================================================
@veterinarian_auth_bp.route('/login/send-otp', methods=['POST'])
def vet_login_send_otp():
    data = request.get_json() or {}
    mobile = data.get("mobile")

    if not mobile:
        return error_response("Mobile number is required", 400)

    if not Vet.objects(mobile=mobile).first():
        return error_response("Veterinarian not found", 404)

    sid = otp_service.send_otp(mobile)
    if sid:
        return success_response({"message": "OTP sent successfully"}, 200)

    return error_response("Failed to send OTP", 500)


# ============================================================
# 5️⃣ LOGIN → STEP 2 → VERIFY OTP + LOGIN
# ============================================================
@veterinarian_auth_bp.route('/login/verify-otp', methods=['POST'])
def vet_login_verify_otp():
    data = request.get_json() or {}

    mobile = data.get("mobile")
    otp_code = data.get("otp_code")

    if not mobile or not otp_code:
        return error_response("Mobile number and OTP are required", 400)

    if not otp_service.verify_otp(mobile, otp_code):
        return error_response("Invalid OTP", 401)

    vet = Vet.objects(mobile=mobile).first()
    if not vet:
        return error_response("Veterinarian not found", 404)

    access_token = create_access_token(identity=str(vet.id), expires_delta=timedelta(hours=24))

    return success_response(
        {"message": "Login successful", "access_token": access_token},
        200
    )


# ============================================================
# 6️⃣ GET CURRENT LOGGED-IN VET
# ============================================================
@veterinarian_auth_bp.route('/me', methods=['GET'])
@jwt_required()
def vet_me():
    vet_id = get_jwt_identity()
    vet = Vet.objects(id=vet_id).first()

    if not vet:
        return error_response("Veterinarian not found", 404)

    return success_response(vet.to_json(), 200)


