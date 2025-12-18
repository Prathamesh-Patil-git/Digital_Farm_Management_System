from mongoengine import Document, StringField, BooleanField, DateTimeField, EmbeddedDocument, EmbeddedDocumentField, ListField, ObjectIdField
import datetime

class DocumentItem(EmbeddedDocument):
    name = StringField()
    url = StringField()
    verified = BooleanField(default=False)
    verified_by = ObjectIdField()
    verified_at = DateTimeField()

class AuthorityVerification(Document):
    entity_type = StringField(choices=["farmer", "vet", "animal"])
    entity_id = ObjectIdField()
    documents = ListField(EmbeddedDocumentField(DocumentItem))
    final_status = StringField(choices=["verified", "rejected", "pending"], default="pending")
    remarks = StringField()
    created_at = DateTimeField(default=datetime.datetime.now)
    updated_at = DateTimeField(default=datetime.datetime.now)