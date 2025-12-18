from mongoengine import (
    Document, StringField, IntField, BooleanField,
    DateTimeField, ListField, ReferenceField
)
import datetime
from app.models.farmers import Farmer
from app.models.vets import Vet
from app.models.animals import Animal
from app.utils.serializer import SerializerMixin


class MedicineDetail(Document, SerializerMixin):
    name = StringField(required=True)
    dosage = StringField(required=True)
    route = StringField(choices=["oral", "IM", "IV", "SC", "topical"])
    frequency = StringField()
    duration_days = IntField()
    withdrawal_period_days = IntField(required=True)

    meta = {"collection": "medicines"}


class Treatment(Document, SerializerMixin):
    farmer = ReferenceField(Farmer, required=True)
    vet = ReferenceField(Vet, required=False)
    animal = ReferenceField(Animal, required=True)

    diagnosis = StringField(required=True)
    symptoms = ListField(StringField())
    notes = StringField()

    medicines = ListField(ReferenceField(MedicineDetail))

    treatment_start_date = DateTimeField(default=datetime.datetime.utcnow)
    withdrawal_ends_on = DateTimeField()

    reminder_sent_farmer = BooleanField(default=False)
    reminder_sent_authority = BooleanField(default=False)

    prescription_path = StringField()
    report_paths = ListField(StringField())

    is_withdrawal_completed = BooleanField(default=False)
    is_flagged_violation = BooleanField(default=False)
    violation_reason = StringField()

    status = StringField(
        choices=["pending", "diagnosed", "completed"],
        default="pending"
    )

    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "treatments"}

    def save(self, *args, **kwargs):
        # auto withdrawal date
        if self.medicines:
            max_days = max(m.withdrawal_period_days for m in self.medicines)
            self.withdrawal_ends_on = (
                self.treatment_start_date +
                datetime.timedelta(days=max_days)
            )

        self.updated_at = datetime.datetime.utcnow()
        return super().save(*args, **kwargs)
