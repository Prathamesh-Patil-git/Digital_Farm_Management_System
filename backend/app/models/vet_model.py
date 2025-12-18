from app.db import DB
from app.models.base_utils import serialize_doc
from bson.objectid import ObjectId

class Vet:
    collection = DB.vets

    @staticmethod
    def create(data):
        result = Vet.collection.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def find_by_id(vet_id):
        vet = Vet.collection.find_one({'_id': ObjectId(vet_id)})
        return serialize_doc(vet)

    @staticmethod
    def find_by_auth_id(auth_user_id):
        vet = Vet.collection.find_one({'auth_user_id': auth_user_id})
        return serialize_doc(vet)

    @staticmethod
    def find_all():
        vets = list(Vet.collection.find({}))
        return [serialize_doc(vet) for vet in vets]

    @staticmethod
    def update(vet_id, data):
        Vet.collection.update_one({'_id': ObjectId(vet_id)}, {'$set': data})
        return Vet.find_by_id(vet_id)

    @staticmethod
    def delete(vet_id):
        result = Vet.collection.delete_one({'_id': ObjectId(vet_id)})
        return result.deleted_count > 0