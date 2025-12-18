from mongoengine import (
    Document, StringField, IntField, BooleanField,
    DateTimeField, EmbeddedDocument, EmbeddedDocumentField,
    FloatField, ListField
)
import datetime
from app.utils.serializer import SerializerMixin


class GPSLocation(EmbeddedDocument):
    lat = FloatField(required=True)
    lng = FloatField(required=True)


class Vet(Document, SerializerMixin):
    # Basic info
    name = StringField(required=True)
    age = IntField()
    gender = StringField(choices=["male", "female", "other"])
    address = StringField()

    # Contact
    mobile = StringField(required=True, unique=True)
    mobile_verified = BooleanField(default=False)

    # Professional details
    qualification = StringField(required=True)
    registration_number = StringField(required=True)
    specialization = ListField(StringField())

    # Supabase Storage paths (only file paths)
    profile_photo_path = StringField()               
    license_certificate_path = StringField()
    degree_certificate_path = StringField()
    id_card_path = StringField()

    # Verification flags
    is_verified = BooleanField(default=False)
    verification_notes = StringField()

    # Location
    gps_location = EmbeddedDocumentField(GPSLocation)

    # Activity
    rating = FloatField(default=0)
    review_count = IntField(default=0)

    # Timestamps
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "vets"}

    def to_json(self):
        print("🔥 CUSTOM Vet.to_json() IS RUNNING")
        return SerializerMixin.to_json(self)


    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super(Vet, self).save(*args, **kwargs)
