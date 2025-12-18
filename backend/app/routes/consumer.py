from flask import Blueprint
from datetime import datetime

from app.models.farmers import Farmer
from app.models.animals import Animal
from app.models.treatments import Treatment
from app.utils.responses import success_response, error_response

consumer_bp = Blueprint("consumer", __name__)


# -----------------------------------------------------
# CONSUMER SAFETY CHECK
# /consumer/safety/<farmer_id>
# -----------------------------------------------------
@consumer_bp.route('/safety/<farmer_id>', methods=['GET'])
def check_safety(farmer_id):
    # Validate farmer
    try:
        farmer = Farmer.objects(id=farmer_id).first()
    except:
        return error_response("Invalid Farmer ID", 400)

    if not farmer:
        return error_response("Farmer not found", 404)

    # Get all animals registered under the farmer
    animals = Animal.objects(farmer=farmer).all()

    if not animals:
        return success_response({
            "status": "Safe",
            "message": "No animals found for this farmer."
        }, 200)

    now = datetime.utcnow()

    # Find any active withdrawal treatments
    active_violations = Treatment.objects(
        animal__in=animals,
        withdrawal_ends_on__gt=now
    ).count()

    if active_violations > 0:
        return success_response({
            "status": "Under Withdrawal",
            "message": "Milk or meat from this farmer is currently NOT SAFE.",
            "safe_after": "Wait until withdrawal period ends."
        }, 200)

    return success_response({
        "status": "Safe",
        "message": "Milk and meat from this farmer are safe for consumption."
    }, 200)
