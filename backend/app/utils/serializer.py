from bson import ObjectId
from datetime import datetime

class SerializerMixin:
    def to_json(self):
        mongo_dict = self.to_mongo().to_dict()
        cleaned = self._clean(mongo_dict)

        # Rename _id → id
        if "_id" in cleaned:
            cleaned["id"] = cleaned.pop("_id")

        return cleaned

    def _clean(self, value):
        # ObjectId → string
        if isinstance(value, ObjectId):
            return str(value)

        # datetime → ISO string
        if isinstance(value, datetime):
            return value.isoformat()

        # EmbeddedDocument
        if hasattr(value, "to_mongo"):
            return {
                k: self._clean(v)
                for k, v in value.to_mongo().to_dict().items()
            }

        # List
        if isinstance(value, list):
            return [self._clean(v) for v in value]

        # Dict
        if isinstance(value, dict):
            return {k: self._clean(v) for k, v in value.items()}

        return value
