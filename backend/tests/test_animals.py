import unittest
import json
from app.app import create_app
from app.db import DB
from bson.objectid import ObjectId

class AnimalRoutesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
        # Use a test database
        cls.app.config['MONGO_DB_NAME'] = 'digital_farm_test'
        DB.initialize()
        DB.farmers.delete_many({}) # Clear collection before tests
        DB.animals.delete_many({}) # Clear collection before tests

    @classmethod
    def tearDownClass(cls):
        DB.farmers.delete_many({}) # Clear collection after tests
        DB.animals.delete_many({}) # Clear collection after tests
        DB.close()

    def get_auth_token_and_farmer_id(self):
        # Register a test user
        self.client.post('/api/auth/register', json={
            'username': 'animaluser',
            'password': 'animalpassword',
            'role': 'farmer'
        })
        # Log in the test user to get a token
        response = self.client.post('/api/auth/login', json={
            'username': 'animaluser',
            'password': 'animalpassword'
        })
        token = json.loads(response.data)['data']['access_token']

        # Create a farmer associated with this user
        farmer_response = self.client.post('/api/farmers/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'name': 'Animal Farmer',
                                               'location': 'Animal Farm',
                                               'contact': '111-222-3333'
                                           })
        farmer_id = json.loads(farmer_response.data)['data']['_id']
        return token, farmer_id

    def test_1_create_animal(self):
        token, farmer_id = self.get_auth_token_and_farmer_id()
        response = self.client.post('/api/animals/',
                                    headers={'Authorization': f'Bearer {token}'},
                                    json={
                                        'farmer_id': farmer_id,
                                        'name': 'Babe',
                                        'species': 'Pig',
                                        'breed': 'Yorkshire',
                                        'age': 1,
                                        'photo_url': 'http://example.com/babe.jpg'
                                    })
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)['data']
        self.assertIn('_id', data)
        self.assertEqual(data['name'], 'Babe')

    def test_2_get_animal_by_id(self):
        token, farmer_id = self.get_auth_token_and_farmer_id()
        # Create an animal first
        create_response = self.client.post('/api/animals/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'farmer_id': farmer_id,
                                               'name': 'Cow',
                                               'species': 'Cattle',
                                               'breed': 'Holstein',
                                               'age': 3
                                           })
        animal_id = json.loads(create_response.data)['data']['_id']

        response = self.client.get(f'/api/animals/{animal_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertEqual(data['_id'], animal_id)
        self.assertEqual(data['name'], 'Cow')

    def test_3_get_animals_by_farmer_id(self):
        token, farmer_id = self.get_auth_token_and_farmer_id()
        # Create multiple animals for the farmer
        self.client.post('/api/animals/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'farmer_id': farmer_id,
                             'name': 'Chicken1',
                             'species': 'Chicken',
                             'age': 0.5
                         })
        self.client.post('/api/animals/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'farmer_id': farmer_id,
                             'name': 'Chicken2',
                             'species': 'Chicken',
                             'age': 0.6
                         })

        response = self.client.get(f'/api/animals/farmer/{farmer_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 2)

if __name__ == '__main__':
    unittest.main()