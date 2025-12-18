from app.db import DB
from app.models.base_utils import serialize_doc
from bson.objectid import ObjectId

class Treatment:
    collection = DB.treatments

    @staticmethod
    def create(data):
        result = Treatment.collection.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def find_by_id(treatment_id):
        treatment = Treatment.collection.find_one({'_id': ObjectId(treatment_id)})
        return serialize_doc(treatment)

    @staticmethod
    def find_by_animal_id(animal_id):
        treatments = list(Treatment.collection.find({'animal_id': animal_id}))
        return [serialize_doc(treatment) for treatment in treatments]

    @staticmethod
    def update(treatment_id, data):
        Treatment.collection.update_one({'_id': ObjectId(treatment_id)}, {'$set': data})
        return Treatment.find_by_id(treatment_id)

    @staticmethod
    def delete(treatment_id):
        result = Treatment.collection.delete_one({'_id': ObjectId(treatment_id)})
        return result.deleted_count > 0