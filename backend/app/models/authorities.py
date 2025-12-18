from mongoengine import Document, StringField, DateTimeField
import datetime


class Authority(Document):
    # Basic identity
    name = StringField(required=True)

    # Username-based authentication
    username = StringField(required=True, unique=True)
    password_hash = StringField(required=True)

    # Role-based access control
    role = StringField(
        required=True,
        choices=["admin", "verifier", "dashboard_viewer"],
        default="dashboard_viewer"
    )

    # Timestamps
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "authorities"
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super(Authority, self).save(*args, **kwargs)
