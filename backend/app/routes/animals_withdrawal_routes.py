from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.db import DB
from app.utils.responses import success_response

animals_withdrawal_bp = Blueprint(
    'animals_withdrawal', __name__, url_prefix='/animals/withdrawal'
)


@animals_withdrawal_bp.route('/active', methods=['GET'])
@jwt_required()
def get_animals_under_withdrawal():
    farmer_id = get_jwt_identity()
    now = datetime.utcnow().isoformat()

    # Get farmer's animals
    animals = list(DB.animals.find({'farmer_id': farmer_id}))

    if not animals:
        return success_response([], 200)

    animal_ids = [str(a['_id']) for a in animals]

    # Active alerts
    alerts = list(DB.withdrawal_alerts.find({
        'animal_id': {'$in': animal_ids},
        'safe_from': {'$gt': now}
    }))

    alert_map = {a['animal_id']: a for a in alerts}

    result = []
    for animal in animals:
        aid = str(animal['_id'])
        if aid in alert_map:
            animal['_id'] = aid
            animal['withdrawal_status'] = 'UNDER_WITHDRAWAL'
            animal['safe_from'] = alert_map[aid]['safe_from']
            result.append(animal)

    return success_response(result, 200)

@animals_withdrawal_bp.route('/safe', methods=['GET'])
@jwt_required()
def get_safe_animals():
    farmer_id = get_jwt_identity()
    now = datetime.utcnow().isoformat()

    animals = list(DB.animals.find({'farmer_id': farmer_id}))
    if not animals:
        return success_response([], 200)

    animal_ids = [str(a['_id']) for a in animals]

    active_alerts = list(DB.withdrawal_alerts.find({
        'animal_id': {'$in': animal_ids},
        'safe_from': {'$gt': now}
    }))

    unsafe_ids = {a['animal_id'] for a in active_alerts}

    result = []
    for animal in animals:
        aid = str(animal['_id'])
        if aid not in unsafe_ids:
            animal['_id'] = aid
            animal['withdrawal_status'] = 'SAFE'
            result.append(animal)

    return success_response(result, 200)

@animals_withdrawal_bp.route('/status', methods=['GET'])
@jwt_required()
def get_animals_with_status():
    farmer_id = get_jwt_identity()
    now = datetime.utcnow().isoformat()

    animals = list(DB.animals.find({'farmer_id': farmer_id}))
    if not animals:
        return success_response([], 200)

    animal_ids = [str(a['_id']) for a in animals]

    alerts = list(DB.withdrawal_alerts.find({
        'animal_id': {'$in': animal_ids},
        'safe_from': {'$gt': now}
    }))

    alert_map = {a['animal_id']: a for a in alerts}

    result = []
    for animal in animals:
        aid = str(animal['_id'])
        animal['_id'] = aid

        if aid in alert_map:
            animal['withdrawal_status'] = 'UNDER_WITHDRAWAL'
            animal['safe_from'] = alert_map[aid]['safe_from']
        else:
            animal['withdrawal_status'] = 'SAFE'
            animal['safe_from'] = None

        result.append(animal)

    return success_response(result, 200)
