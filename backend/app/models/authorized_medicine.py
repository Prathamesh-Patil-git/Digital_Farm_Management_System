from mongoengine import Document, StringField, IntField

class AuthorizedMedicine(Document):
    name = StringField(required=True, unique=True)
    dosage = StringField(required=True)
    route = StringField()
    frequency = StringField()
    duration_days = IntField(default=1)
    withdrawal_period_days = IntField(required=True)

    meta = {
        "collection": "authorized_medicines"
    }
