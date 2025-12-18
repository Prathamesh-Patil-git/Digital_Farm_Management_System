from mongoengine import Document, StringField, IntField, ObjectIdField, DateTimeField, EmbeddedDocument, EmbeddedDocumentField, ListField, ReferenceField
import datetime
from .farmers import Farmer
from .vets import Vet
from .animals import Animal

class GPSLocation(EmbeddedDocument):
    lat = IntField(required=True)
    lng = IntField(required=True)

class TreatmentRequest(Document):
    farmer = ReferenceField(Farmer, required=True)
    animal = ReferenceField(Animal, required=True)
    preferred_vet = ReferenceField(Vet)
    assigned_vet = ReferenceField(Vet)
    status = StringField(choices=["pending", "assigned", "accepted", "rejected", "cancelled"], default="pending")
    symptoms = StringField()
    photos = ListField(StringField())
    gps_location = EmbeddedDocumentField(GPSLocation)
    created_at = DateTimeField(default=datetime.datetime.now)
    updated_at = DateTimeField(default=datetime.datetime.now)