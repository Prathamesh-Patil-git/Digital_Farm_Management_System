from app.db import DB
from app.models.base_utils import serialize_doc
from bson.objectid import ObjectId

class Farmer:
    collection = DB.farmers

    @staticmethod
    def create(data):
        result = Farmer.collection.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def find_by_id(farmer_id):
        farmer = Farmer.collection.find_one({'_id': ObjectId(farmer_id)})
        return serialize_doc(farmer)

    @staticmethod
    def find_by_auth_id(auth_user_id):
        farmer = Farmer.collection.find_one({'auth_user_id': auth_user_id})
        return serialize_doc(farmer)

    @staticmethod
    def find_all():
        farmers = list(Farmer.collection.find({}))
        return [serialize_doc(farmer) for farmer in farmers]

    @staticmethod
    def update(farmer_id, data):
        Farmer.collection.update_one({'_id': ObjectId(farmer_id)}, {'$set': data})
        return Farmer.find_by_id(farmer_id)

    @staticmethod
    def delete(farmer_id):
        result = Farmer.collection.delete_one({'_id': ObjectId(farmer_id)})
        return result.deleted_count > 0