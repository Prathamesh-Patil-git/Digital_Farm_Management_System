from mongoengine import Document, StringField, BooleanField, DateTimeField, EmbeddedDocument, EmbeddedDocumentField, ReferenceField
import datetime
from .farmers import Farmer
from .animals import Animal

class Result(EmbeddedDocument):
    is_safe_milk = BooleanField()
    is_safe_meat = BooleanField()
    message = StringField()

class ConsumerCheck(Document):
    farmer_id = ReferenceField(Farmer)
    animal_id = ReferenceField(Animal)
    checked_at = DateTimeField(default=datetime.datetime.now)
    result = EmbeddedDocumentField(Result)