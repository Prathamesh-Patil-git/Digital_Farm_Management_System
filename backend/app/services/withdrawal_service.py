from datetime import datetime, timedelta
from app.db import DB
from bson.objectid import ObjectId

class WithdrawalService:
    @staticmethod
    def create_withdrawal_alert(treatment_id, animal_id, withdrawal_days):
        treatment_date = datetime.utcnow()
        safe_from = treatment_date + timedelta(days=withdrawal_days)
        DB.withdrawal_alerts.insert_one({
            'treatment_id': treatment_id,
            'animal_id': animal_id,
            'safe_from': safe_from.isoformat(),
            'alert_sent': False,
            'created_at': treatment_date.isoformat()
        })
        return safe_from.isoformat()

    @staticmethod
    def check_animal_safety(animal_id):
        # Check for any active withdrawal alerts for the given animal
        active_alert = DB.withdrawal_alerts.find_one({
            'animal_id': animal_id,
            'safe_from': {'$gt': datetime.utcnow().isoformat()}
        })
        return active_alert is None

    @staticmethod
    def get_active_withdrawal_alerts_for_farmer(farmer_id):
        # Find all animal IDs for the given farmer
        animal_ids = [str(animal['_id']) for animal in DB.animals.find({'farmer_id': farmer_id})]

        if not animal_ids:
            return []

        # Find any active withdrawal alerts for these animals
        active_alerts = list(DB.withdrawal_alerts.find({
            'animal_id': {'$in': animal_ids},
            'safe_from': {'$gt': datetime.utcnow().isoformat()}
        }))

        for alert in active_alerts:
            alert['_id'] = str(alert['_id'])

        return active_alerts