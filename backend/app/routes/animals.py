from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.animals import Animal
from app.models.farmers import Farmer
from app.utils.responses import success_response, error_response

animals_bp = Blueprint('animals', __name__)


# ------------------------------------------------------
# Create a new animal for logged-in farmer
# ------------------------------------------------------
@animals_bp.route('/', methods=['POST'])
@jwt_required()
def create_animal():
    data = request.get_json() or {}

    required_fields = ["species", "breed", "gender", "tag_number"]
    if not all(data.get(f) for f in required_fields):
        return error_response("Missing required fields", 400)

    farmer_id = get_jwt_identity()

    farmer = Farmer.objects(id=farmer_id).first()
    if not farmer:
        return error_response("Farmer not found", 404)

    # Prevent duplicate tag numbers
    if Animal.objects(tag_number=data["tag_number"]).first():
        return error_response("Tag number already exists", 409)

    animal = Animal(
        farmer=farmer,
        species=data["species"],
        breed=data.get("breed"),
        gender=data.get("gender"),
        age=data.get("age"),
        weight=data.get("weight"),
        tag_number=data["tag_number"],
        is_lactating=data.get("is_lactating", False),
        daily_milk_yield=data.get("daily_milk_yield", 0),
        pregnancy_status=data.get("pregnancy_status", "unknown"),
        profile_photo_path=data.get("profile_photo_path"),  # uploaded via /uploads/animal
        additional_image_paths=data.get("additional_image_paths", [])
    )

    animal.save()

    animal_json = animal.to_mongo().to_dict()
    animal_json["_id"] = str(animal_json["_id"])

    return success_response(animal_json, 201)


# ------------------------------------------------------
# Get single animal (farmer can view only their own)
# ------------------------------------------------------
@animals_bp.route('/<animal_id>', methods=['GET'])
@jwt_required()
def get_animal(animal_id):
    farmer_id = get_jwt_identity()

    try:
        animal = Animal.objects(id=animal_id).first()
    except:
        return error_response("Invalid animal ID", 400)

    if not animal:
        return error_response("Animal not found", 404)

    # Ownership enforcement
    if str(animal.farmer.id) != farmer_id:
        return error_response("Not allowed to view this animal", 403)

    animal_json = animal.to_mongo().to_dict()
    animal_json["_id"] = str(animal_json["_id"])
    animal_json["farmer"] = str(animal.farmer.id)

    return success_response(animal_json, 200)


# ------------------------------------------------------
# Get all animals of the logged-in farmer
# ------------------------------------------------------
@animals_bp.route('/mine', methods=['GET'])
@jwt_required()
def get_my_animals():
    farmer_id = get_jwt_identity()

    animals = Animal.objects(farmer=farmer_id).all()

    animal_list = []
    for animal in animals:
        data = animal.to_mongo().to_dict()
        data["_id"] = str(data["_id"])
        data["farmer"] = str(animal.farmer.id)
        animal_list.append(data)

    return success_response(animal_list, 200)


# ------------------------------------------------------
# Get animals by farmer ID (for veterinarians & authorities)
# ------------------------------------------------------
@animals_bp.route('/farmer/<farmer_id>', methods=['GET'])
@jwt_required()
def get_animals_by_farmer(farmer_id):
    auth_user_id = get_jwt_identity()

    # If logged in user is the same farmer → allowed
    if auth_user_id == farmer_id:
        pass
    else:
        # Future: role-based access check (authority/vet)
        # For now → block
        return error_response("Not allowed to view other farmers' animals", 403)

    try:
        animals = Animal.objects(farmer=farmer_id).all()
    except:
        return error_response("Invalid farmer ID", 400)

    animal_list = []
    for animal in animals:
        data = animal.to_mongo().to_dict()
        data["_id"] = str(data["_id"])
        data["farmer"] = str(animal.farmer.id)
        animal_list.append(data)

    return success_response(animal_list, 200)


# ------------------------------------------------------
# Update animal (only owner)
# ------------------------------------------------------
@animals_bp.route('/<animal_id>', methods=['PUT'])
@jwt_required()
def update_animal(animal_id):
    farmer_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        animal = Animal.objects(id=animal_id).first()
    except:
        return error_response("Invalid animal ID", 400)

    if not animal:
        return error_response("Animal not found", 404)

    # Ownership enforcement
    if str(animal.farmer.id) != farmer_id:
        return error_response("Not allowed to update this animal", 403)

    allowed_fields = [
        "species", "breed", "gender", "age", "weight",
        "is_lactating", "daily_milk_yield", "pregnancy_status",
        "profile_photo_path", "additional_image_paths"
    ]

    for field in allowed_fields:
        if field in data:
            setattr(animal, field, data[field])

    animal.save()

    animal_json = animal.to_mongo().to_dict()
    animal_json["_id"] = str(animal_json["_id"])

    return success_response(animal_json, 200)
