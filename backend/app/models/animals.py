from mongoengine import (
    Document, StringField, IntField, FloatField, BooleanField,
    DateTimeField, EmbeddedDocument, EmbeddedDocumentField,
    ListField, ReferenceField
)
import datetime
from app.utils.serializer import SerializerMixin
from app.models.farmers import Farmer


class GPSLocation(EmbeddedDocument):
    lat = FloatField(required=True)
    lng = FloatField(required=True)


class Animal(Document, SerializerMixin):
    farmer = ReferenceField(Farmer, required=True)

    species = StringField(choices=["cow", "buffalo", "goat", "sheep", "poultry"], required=True)
    breed = StringField()
    tag_number = StringField(required=True, unique=True)

    age = FloatField()
    gender = StringField(choices=["male", "female"])
    weight = FloatField()

    is_lactating = BooleanField(default=False)
    daily_milk_yield = FloatField(default=0)
    pregnancy_status = StringField(
        choices=["pregnant", "dry", "open", "unknown"],
        default="unknown"
    )

    profile_photo_path = StringField()
    additional_image_paths = ListField(StringField())

    assigned_vet_id = StringField()

    current_health_issues = ListField(StringField())
    is_active = BooleanField(default=True)

    treatment_ids = ListField(StringField())

    gps_location = EmbeddedDocumentField(GPSLocation)

    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "animals"}
    # Optional but helps debugging
    def to_json(self):
        print("🔥 Animal.to_json() running")
        return super().to_json()

    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super().save(*args, **kwargs)

