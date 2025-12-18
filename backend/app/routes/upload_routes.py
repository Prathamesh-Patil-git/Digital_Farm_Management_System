from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.storage_service import StorageService
from app.utils.responses import success_response, error_response

upload_bp = Blueprint("upload", __name__)
storage = StorageService()


# -----------------------------------------------------------
# Helper: Validate uploaded file
# -----------------------------------------------------------
def validate_file(uploaded_file):
    if uploaded_file is None:
        return "No file provided."

    # Basic MIME filtering (optional expand)
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if uploaded_file.content_type not in allowed_types:
        return f"Invalid file type: {uploaded_file.content_type}"

    return None


# -----------------------------------------------------------
# Upload Farmer files
# -----------------------------------------------------------
@upload_bp.route('/farmer', methods=['POST'])
@jwt_required()
def upload_farmer_file():
    file = request.files.get("file")
    error = validate_file(file)
    if error:
        return error_response(error, 400)

    farmer_id = get_jwt_identity()

    storage_path = storage.generate_path(f"farmers/{farmer_id}", file.filename)
    file_bytes = file.read()

    try:
        path = storage.upload_file(storage_path, file_bytes, file.content_type)
        url = storage.get_signed_url(path)
    except Exception as e:
        return error_response(str(e), 500)

    return success_response({"path": path, "url": url}, 200)


# -----------------------------------------------------------
# Upload Vet files
# -----------------------------------------------------------
@upload_bp.route('/vet', methods=['POST'])
@jwt_required()
def upload_vet_file():
    file = request.files.get("file")
    error = validate_file(file)
    if error:
        return error_response(error, 400)

    vet_id = get_jwt_identity()

    storage_path = storage.generate_path(f"vets/{vet_id}", file.filename)
    file_bytes = file.read()

    try:
        path = storage.upload_file(storage_path, file_bytes, file.content_type)
        url = storage.get_signed_url(path)
    except Exception as e:
        return error_response(str(e), 500)

    return success_response({"path": path, "url": url}, 200)


# -----------------------------------------------------------
# Upload Animal files
# -----------------------------------------------------------
@upload_bp.route('/animal/<animal_id>', methods=['POST'])
@jwt_required()
def upload_animal_file(animal_id):
    file = request.files.get("file")
    error = validate_file(file)
    if error:
        return error_response(error, 400)

    storage_path = storage.generate_path(f"animals/{animal_id}", file.filename)
    file_bytes = file.read()

    try:
        path = storage.upload_file(storage_path, file_bytes, file.content_type)
        url = storage.get_signed_url(path)
    except Exception as e:
        return error_response(str(e), 500)

    return success_response({"path": path, "url": url}, 200)


# -----------------------------------------------------------
# Upload Treatment files (reports, prescriptions)
# -----------------------------------------------------------
@upload_bp.route('/treatment/<treatment_id>', methods=['POST'])
@jwt_required()
def upload_treatment_file(treatment_id):
    file = request.files.get("file")
    error = validate_file(file)
    if error:
        return error_response(error, 400)

    storage_path = storage.generate_path(f"treatments/{treatment_id}", file.filename)
    file_bytes = file.read()

    try:
        path = storage.upload_file(storage_path, file_bytes, file.content_type)
        url = storage.get_signed_url(path)
    except Exception as e:
        return error_response(str(e), 500)

    return success_response({"path": path, "url": url}, 200)
