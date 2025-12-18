from app.db import DB
from app.models.base_utils import serialize_doc
from bson.objectid import ObjectId

class AlertService:
    @staticmethod
    def create_alert(treatment_id, due_date):
        alert_data = {
            'treatment_id': treatment_id,
            'due_date': due_date,
            'sent': False
        }
        result = DB.alerts.insert_one(alert_data)
        return str(result.inserted_id)

    @staticmethod
    def get_alert_by_id(alert_id):
        alert = DB.alerts.find_one({'_id': ObjectId(alert_id)})
        return serialize_doc(alert)

    @staticmethod
    def get_all_alerts():
        alerts = list(DB.alerts.find({}))
        return [serialize_doc(alert) for alert in alerts]

    @staticmethod
    def mark_alert_as_sent(alert_id):
        DB.alerts.update_one({'_id': ObjectId(alert_id)}, {'$set': {'sent': True}})
        return AlertService.get_alert_by_id(alert_id)