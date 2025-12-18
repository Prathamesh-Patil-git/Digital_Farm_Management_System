from mongoengine import EmbeddedDocument, ReferenceField, StringField, IntField
from app.models.authorized_medicine import AuthorizedMedicine


class PrescribedMedicine(EmbeddedDocument):
    """
    Embedded medicine used inside Treatment.
    References an AuthorizedMedicine but stores
    a snapshot of important fields for audit safety.
    """

    medicine = ReferenceField(AuthorizedMedicine, required=True)

    # Snapshot fields (copied at prescription time)
    dosage = StringField()
    frequency = StringField()
    duration_days = IntField()
    withdrawal_period_days = IntField()
