from mongoengine import Document, StringField, DateTimeField, BooleanField
from datetime import datetime

class WithdrawalAlert(Document):
    treatment_id = StringField(required=True)
    animal_id = StringField(required=True)

    safe_from = DateTimeField(required=True)

    alert_sent = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'withdrawal_alerts'
    }
