from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.authorized_medicine import AuthorizedMedicine
from app.models.vets import Vet
from app.models.farmers import Farmer
from app.utils.responses import success_response, error_response

medicines_bp = Blueprint("medicines", __name__)

# ======================================================
# HELPER: TEMP ROLE CHECK (until RBAC is added)
# ======================================================
def _is_authority(user_id):
    """
    Temporary logic:
    - Vets and Farmers are NOT authorities
    - Anyone else is treated as authority/admin
    """
    if Vet.objects(id=user_id).first():
        return False
    if Farmer.objects(id=user_id).first():
        return False
    return True


# ======================================================
# 1️⃣ GET ALL AUTHORIZED MEDICINES
# (Vet / Farmer / Authority)
# ======================================================
@medicines_bp.route('/authorized', methods=['GET'])
@jwt_required()
def get_authorized_medicines():
    print("\n[MEDICINE] get_authorized_medicines CALLED")

    medicines = AuthorizedMedicine.objects()
    print(f"[MEDICINE] medicines found = {medicines.count()}")

    return success_response([
        {
            "_id": str(m.id),
            "name": m.name,
            "dosage": m.dosage,
            "route": m.route,
            "frequency": m.frequency,
            "duration_days": m.duration_days,
            "withdrawal_period_days": m.withdrawal_period_days
        }
        for m in medicines
    ], 200)


# # ======================================================
# # 2️⃣ GET SINGLE AUTHORIZED MEDICINE
# # ======================================================
# @medicines_bp.route('/authorized/<medicine_id>', methods=['GET'])
# @jwt_required()
# def get_authorized_medicine(medicine_id):
#     print(f"\n[MEDICINE] get_authorized_medicine CALLED: {medicine_id}")

#     medicine = AuthorizedMedicine.objects(id=medicine_id).first()
#     if not medicine:
#         print("[MEDICINE] ERROR: Medicine not found")
#         return error_response("Medicine not found", 404)

#     return success_response({
#         "_id": str(medicine.id),
#         "name": medicine.name,
#         "dosage": medicine.dosage,
#         "route": medicine.route,
#         "frequency": medicine.frequency,
#         "duration_days": medicine.duration_days,
#         "withdrawal_period_days": medicine.withdrawal_period_days
#     }, 200)


# ======================================================
# 3️⃣ CREATE AUTHORIZED MEDICINE
# 🔒 Authority / Admin only
# ======================================================
@medicines_bp.route('/authorized', methods=['POST'])
@jwt_required()
def create_authorized_medicine():
    print("\n[MEDICINE] create_authorized_medicine CALLED")

    user_id = get_jwt_identity()
    if not _is_authority(user_id):
        print("[MEDICINE] ERROR: Unauthorized user tried to create medicine")
        return error_response("Not allowed to create medicines", 403)

    data = request.get_json() or {}

    required_fields = ["name", "dosage", "withdrawal_period_days"]
    if not all(data.get(f) for f in required_fields):
        print("[MEDICINE] ERROR: Missing required fields")
        return error_response("Missing required fields", 400)

    if AuthorizedMedicine.objects(name=data["name"]).first():
        print("[MEDICINE] ERROR: Medicine already exists")
        return error_response("Medicine already exists", 409)

    medicine = AuthorizedMedicine(
        name=data["name"],
        dosage=data["dosage"],
        route=data.get("route"),
        frequency=data.get("frequency"),
        duration_days=data.get("duration_days", 1),
        withdrawal_period_days=data["withdrawal_period_days"]
    ).save()

    print(f"[MEDICINE] Authorized medicine created: {medicine.name}")

    return success_response({
        "_id": str(medicine.id)
    }, 201)


# ======================================================
# 4️⃣ UPDATE AUTHORIZED MEDICINE
# 🔒 Authority / Admin only
# ======================================================
@medicines_bp.route('/authorized/<medicine_id>', methods=['PUT'])
@jwt_required()
def update_authorized_medicine(medicine_id):
    print(f"\n[MEDICINE] update_authorized_medicine CALLED: {medicine_id}")

    user_id = get_jwt_identity()
    if not _is_authority(user_id):
        return error_response("Not allowed", 403)

    medicine = AuthorizedMedicine.objects(id=medicine_id).first()
    if not medicine:
        print("[MEDICINE] ERROR: Medicine not found")
        return error_response("Medicine not found", 404)

    data = request.get_json() or {}

    allowed_fields = [
        "dosage",
        "route",
        "frequency",
        "duration_days",
        "withdrawal_period_days"
    ]

    for field in allowed_fields:
        if field in data:
            setattr(medicine, field, data[field])

    medicine.save()
    print(f"[MEDICINE] Medicine updated: {medicine.name}")

    return success_response({
        "_id": str(medicine.id)
    }, 200)


# ======================================================
# 5️⃣ DELETE AUTHORIZED MEDICINE
# 🔒 Authority / Admin only
# ======================================================
@medicines_bp.route('/authorized/<medicine_id>', methods=['DELETE'])
@jwt_required()
def delete_authorized_medicine(medicine_id):
    print(f"\n[MEDICINE] delete_authorized_medicine CALLED: {medicine_id}")

    user_id = get_jwt_identity()
    if not _is_authority(user_id):
        return error_response("Not allowed", 403)

    medicine = AuthorizedMedicine.objects(id=medicine_id).first()
    if not medicine:
        print("[MEDICINE] ERROR: Medicine not found")
        return error_response("Medicine not found", 404)

    medicine.delete()
    print("[MEDICINE] Medicine deleted successfully")

    return success_response({
        "message": "Medicine deleted successfully"
    }, 200)

@medicines_bp.route('/authorized/<medicine_id>', methods=['GET'])
@jwt_required()
def get_authorized_medicine(medicine_id):
    print(f"\n[MEDICINE] get_authorized_medicine CALLED")
    print(f"[MEDICINE] medicine_id = {medicine_id}")

    try:
        medicine = AuthorizedMedicine.objects(id=medicine_id).first()
    except Exception as e:
        print(f"[MEDICINE] ERROR: Invalid medicine ID → {e}")
        return error_response("Invalid medicine ID", 400)

    if not medicine:
        print("[MEDICINE] ERROR: Medicine not found")
        return error_response("Medicine not found", 404)

    response = {
        "_id": str(medicine.id),
        "name": medicine.name,
        "dosage": medicine.dosage,
        "route": medicine.route,
        "frequency": medicine.frequency,
        "duration_days": medicine.duration_days,
        "withdrawal_period_days": medicine.withdrawal_period_days
    }

    print(f"[MEDICINE] Medicine fetched successfully: {medicine.name}")
    return success_response(response, 200)
