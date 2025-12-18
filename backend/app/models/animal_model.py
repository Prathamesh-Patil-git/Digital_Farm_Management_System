from app.db import DB
from app.models.base_utils import serialize_doc
from bson.objectid import ObjectId

class Animal:
    collection = DB.animals

    @staticmethod
    def create(data):
        result = Animal.collection.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def find_by_id(animal_id):
        animal = Animal.collection.find_one({'_id': ObjectId(animal_id)})
        return serialize_doc(animal)

    @staticmethod
    def find_by_farmer_id(farmer_id):
        animals = list(Animal.collection.find({'farmer_id': farmer_id}))
        return [serialize_doc(animal) for animal in animals]

    @staticmethod
    def update(animal_id, data):
        Animal.collection.update_one({'_id': ObjectId(animal_id)}, {'$set': data})
        return Animal.find_by_id(animal_id)

    @staticmethod
    def delete(animal_id):
        result = Animal.collection.delete_one({'_id': ObjectId(animal_id)})
        return result.deleted_count > 0