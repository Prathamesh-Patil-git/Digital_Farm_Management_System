from mongoengine import (
    Document, StringField, IntField, BooleanField,
    DateTimeField, EmbeddedDocument, EmbeddedDocumentField,
    ListField, FloatField
)
import datetime
from app.utils.serializer import SerializerMixin



class GPSLocation(EmbeddedDocument):
    lat = FloatField(required=True)
    lng = FloatField(required=True)


class AfterRegistration(EmbeddedDocument):
    maintains_record_book = BooleanField()
    medicines_in_use = BooleanField()
    follows_vet = BooleanField()
    vet_name = StringField()
    milk_supply_to = ListField(StringField(
        choices=["local_vendor", "cooperative", "private_dairy", "direct"]
    ))
    cow_count = IntField()
    goat_count = IntField()


class Farmer(Document, SerializerMixin):

    # Basic info
    name = StringField(required=True)
    age = IntField()
    gender = StringField(choices=["male", "female", "other"])
    address = StringField()

    # Contact
    mobile = StringField(required=True, unique=True)
    mobile_verified = BooleanField(default=False)

    # Identity
    aadhar_number = StringField(required=True)

    # Storage paths
    photo_path = StringField()
    aadhar_photo_path = StringField()
    tahsildar_verification_path = StringField()

    # Verification
    is_verified = BooleanField(default=False)

    # Location
    gps_location = EmbeddedDocumentField(GPSLocation)

    # Extra registration details
    after_registration = EmbeddedDocumentField(AfterRegistration)

    # Timestamps
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "farmers"}

    # 🔥 ADD THIS EXACTLY HERE
    def to_json(self):
        print("🔥 FARMER MIXIN to_json OVERRIDDEN IS RUNNING")
        return SerializerMixin.to_json(self)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super(Farmer, self).save(*args, **kwargs)
