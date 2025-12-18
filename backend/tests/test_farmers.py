import unittest
import json
from app.app import create_app
from app.db import DB
from bson.objectid import ObjectId

class FarmerRoutesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
        # Use a test database
        cls.app.config['MONGO_DB_NAME'] = 'digital_farm_test'
        DB.initialize()
        DB.farmers.delete_many({}) # Clear collection before tests

    @classmethod
    def tearDownClass(cls):
        DB.farmers.delete_many({}) # Clear collection after tests
        DB.close()

    def get_auth_token(self):
        # Register a test user
        self.client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'testpassword',
            'role': 'farmer'
        })
        # Log in the test user to get a token
        response = self.client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'testpassword'
        })
        return json.loads(response.data)['data']['access_token']

    def test_1_create_farmer(self):
        token = self.get_auth_token()
        response = self.client.post('/api/farmers/',
                                    headers={'Authorization': f'Bearer {token}'},
                                    json={
                                        'name': 'Test Farmer',
                                        'location': 'Test Farm, Test City',
                                        'contact': '123-456-7890'
                                    })
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)['data']
        self.assertIn('_id', data)
        self.assertEqual(data['name'], 'Test Farmer')

    def test_2_get_all_farmers(self):
        token = self.get_auth_token()
        response = self.client.get('/api/farmers/', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_3_get_farmer_by_id(self):
        token = self.get_auth_token()
        # First create a farmer to get an ID
        create_response = self.client.post('/api/farmers/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'name': 'Another Farmer',
                                               'location': 'Another Farm',
                                               'contact': '098-765-4321'
                                           })
        farmer_id = json.loads(create_response.data)['data']['_id']

        response = self.client.get(f'/api/farmers/{farmer_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertEqual(data['_id'], farmer_id)
        self.assertEqual(data['name'], 'Another Farmer')

    def test_4_update_farmer(self):
        token = self.get_auth_token()
        # First create a farmer to get an ID
        create_response = self.client.post('/api/farmers/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'name': 'Farmer to Update',
                                               'location': 'Update Farm',
                                               'contact': '111-222-3333'
                                           })
        farmer_id = json.loads(create_response.data)['data']['_id']

        update_data = {'location': 'Updated Farm Location'}
        response = self.client.put(f'/api/farmers/{farmer_id}',
                                   headers={'Authorization': f'Bearer {token}'},
                                   json=update_data)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertEqual(data['location'], 'Updated Farm Location')

if __name__ == '__main__':
    unittest.main()