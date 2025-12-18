from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from mongoengine.queryset.visitor import Q

from app.utils.responses import success_response, error_response
from app.models.treatments import Treatment, MedicineDetail
from app.models.farmers import Farmer
from app.models.vets import Vet
from app.models.animals import Animal

treatments_bp = Blueprint("treatments", __name__)


#------------------------------------------------------------
# 1) FARMER CREATES TREATMENT REQUEST
#------------------------------------------------------------
@treatments_bp.route('/request', methods=['POST'])
@jwt_required()
def create_treatment_request():
    data = request.get_json() or {}
    farmer_id = get_jwt_identity()

    farmer = Farmer.objects(id=farmer_id).first()
    if not farmer:
        return error_response("Only farmers can create treatment requests", 403)

    required_fields = ["animal_id", "symptoms", "diagnosis"]
    if not all(data.get(f) for f in required_fields):
        return error_response("Missing fields", 400)

    animal = Animal.objects(id=data["animal_id"], farmer=farmer).first()
    if not animal:
        return error_response("Animal not found", 403)

    treatment = Treatment(
        farmer=farmer,
        animal=animal,
        diagnosis=data["diagnosis"],
        symptoms=data.get("symptoms", []),
        notes=data.get("notes"),
        medicines=[],
        status="pending"
    ).save()

    animal.treatment_ids.append(str(treatment.id))
    animal.save()

    return success_response(treatment.to_json(), 201)


#------------------------------------------------------------
# 2) GET A SINGLE TREATMENT
#------------------------------------------------------------
@treatments_bp.route('/<treatment_id>', methods=['GET'])
@jwt_required()
def get_treatment(treatment_id):
    user_id = get_jwt_identity()

    treatment = Treatment.objects(id=treatment_id).first()
    if not treatment:
        return error_response("Treatment not found", 404)

    farmer = Farmer.objects(id=user_id).first()
    vet = Vet.objects(id=user_id).first()

    if farmer and str(treatment.farmer.id) != str(farmer.id):
        return error_response("Not allowed", 403)

    if vet:
        if treatment.vet:
            if str(treatment.vet.id) != str(vet.id):
                return error_response("Not allowed", 403)
        else:
            if treatment.status != "pending":
                return error_response("Not allowed", 403)

    return success_response(treatment.to_json(), 200)


#------------------------------------------------------------
# 3) VET DIAGNOSES TREATMENT
#------------------------------------------------------------
@treatments_bp.route('/<treatment_id>/diagnose', methods=['PUT'])
@jwt_required()
def diagnose_treatment(treatment_id):
    data = request.get_json() or {}
    vet_id = get_jwt_identity()

    vet = Vet.objects(id=vet_id).first()
    if not vet:
        return error_response("Only vets can diagnose", 403)

    treatment = Treatment.objects(id=treatment_id).first()
    if not treatment:
        return error_response("Treatment not found", 404)

    if treatment.status != "pending":
        return error_response("Already diagnosed", 400)

    medicines = data.get("medicines")
    if not medicines or not isinstance(medicines, list):
        return error_response("Invalid medicine list", 400)

    entries = []
    for m in medicines:
        if not m.get("name") or not m.get("dosage") or not m.get("withdrawal_period_days"):
            return error_response("Incomplete medicine entry", 400)

        med = MedicineDetail(
            name=m["name"],
            dosage=m["dosage"],
            route=m.get("route"),
            frequency=m.get("frequency"),
            duration_days=m.get("duration_days", 1),
            withdrawal_period_days=m["withdrawal_period_days"]
        ).save()
        entries.append(med)

    treatment.vet = vet
    treatment.medicines = entries
    treatment.notes = data.get("notes")
    treatment.status = "diagnosed"
    treatment.treatment_start_date = datetime.utcnow()
    treatment.save()

    return success_response(treatment.to_json(), 200)


#------------------------------------------------------------
# 4) GET ALL TREATMENTS FOR AN ANIMAL
#------------------------------------------------------------
@treatments_bp.route('/animal/<animal_id>', methods=['GET'])
@jwt_required()
def get_treatments_by_animal(animal_id):
    user_id = get_jwt_identity()

    farmer = Farmer.objects(id=user_id).first()
    vet = Vet.objects(id=user_id).first()

    animal = Animal.objects(id=animal_id).first()
    if not animal:
        return error_response("Animal not found", 404)

    if farmer and str(animal.farmer.id) != str(farmer.id):
        return error_response("Not allowed", 403)

    query = Q(animal=animal)
    if vet:
        query &= (Q(vet=vet) | Q(status="pending"))

    treatments = Treatment.objects(query)

    return success_response([t.to_json() for t in treatments], 200)
