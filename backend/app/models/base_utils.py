from bson.objectid import ObjectId
from datetime import datetime

def serialize_doc(doc):
    if not doc:
        return None
    doc['_id'] = str(doc['_id']) # Convert ObjectId to string
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat() # Convert datetime to ISO format string
    return doc

def deserialize_doc(doc):
    if not doc:
        return None
    if '_id' in doc and isinstance(doc['_id'], str):
        doc['_id'] = ObjectId(doc['_id'])
    for key, value in doc.items():
        if isinstance(value, str):
            try:
                # Attempt to convert ISO format string back to datetime
                doc[key] = datetime.fromisoformat(value)
            except ValueError:
                pass # Not an ISO format datetime string
    return doc