import unittest
import json
from app.app import create_app
from app.db import DB
from bson.objectid import ObjectId
from datetime import datetime, timedelta

class TreatmentRoutesTest(unittest.TestCase):
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
        DB.vets.delete_many({}) # Clear collection before tests
        DB.treatments.delete_many({}) # Clear collection before tests
        DB.withdrawal_alerts.delete_many({}) # Clear collection before tests

    @classmethod
    def tearDownClass(cls):
        DB.farmers.delete_many({}) # Clear collection after tests
        DB.animals.delete_many({}) # Clear collection after tests
        DB.vets.delete_many({}) # Clear collection after tests
        DB.treatments.delete_many({}) # Clear collection after tests
        DB.withdrawal_alerts.delete_many({}) # Clear collection after tests
        DB.close()

    def get_auth_token_and_vet_id(self):
        # Register a test vet user
        self.client.post('/api/auth/register', json={
            'username': 'testvet',
            'password': 'testpassword',
            'role': 'vet'
        })
        # Log in the test vet user to get a token
        response = self.client.post('/api/auth/login', json={
            'username': 'testvet',
            'password': 'testpassword'
        })
        token = json.loads(response.data)['data']['access_token']

        # Create a vet associated with this user
        vet_response = DB.vets.insert_one({
            'auth_user_id': json.loads(self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'}).data)['data']['_id'],
            'name': 'Dr. Dolittle',
            'contact': 'vet@example.com'
        })
        vet_id = str(vet_response.inserted_id)
        return token, vet_id

    def get_farmer_and_animal_id(self, token):
        # Create a farmer
        farmer_response = self.client.post('/api/farmers/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'name': 'Treatment Farmer',
                                               'location': 'Treatment Farm',
                                               'contact': '444-555-6666'
                                           })
        farmer_id = json.loads(farmer_response.data)['data']['_id']

        # Create an animal for the farmer
        animal_response = self.client.post('/api/animals/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'farmer_id': farmer_id,
                                               'name': 'Sheep',
                                               'species': 'Ovine',
                                               'breed': 'Merino',
                                               'age': 2
                                           })
        animal_id = json.loads(animal_response.data)['data']['_id']
        return farmer_id, animal_id

    def test_1_create_treatment(self):
        token, vet_id = self.get_auth_token_and_vet_id()
        farmer_id, animal_id = self.get_farmer_and_animal_id(token)

        response = self.client.post('/api/treatments/',
                                    headers={'Authorization': f'Bearer {token}'},
                                    json={
                                        'animal_id': animal_id,
                                        'medicine': 'Antibiotic X',
                                        'dosage': '10ml',
                                        'withdrawal_days': 7,
                                        'notes': 'Fever'
                                    })
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)['data']
        self.assertIn('_id', data)
        self.assertEqual(data['medicine'], 'Antibiotic X')
        self.assertIn('safe_from', data)
        self.assertIn('treatment_date', data)

        # Verify withdrawal alert was created
        alert = DB.withdrawal_alerts.find_one({'treatment_id': data['_id']})
        self.assertIsNotNone(alert)
        self.assertEqual(alert['animal_id'], animal_id)

    def test_2_get_treatment_by_id(self):
        token, vet_id = self.get_auth_token_and_vet_id()
        farmer_id, animal_id = self.get_farmer_and_animal_id(token)

        create_response = self.client.post('/api/treatments/',
                                           headers={'Authorization': f'Bearer {token}'},
                                           json={
                                               'animal_id': animal_id,
                                               'medicine': 'Vaccine Y',
                                               'dosage': '2ml',
                                               'withdrawal_days': 0,
                                               'notes': 'Vaccination'
                                           })
        treatment_id = json.loads(create_response.data)['data']['_id']

        response = self.client.get(f'/api/treatments/{treatment_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertEqual(data['_id'], treatment_id)
        self.assertEqual(data['medicine'], 'Vaccine Y')

    def test_3_get_treatments_by_animal_id(self):
        token, vet_id = self.get_auth_token_and_vet_id()
        farmer_id, animal_id = self.get_farmer_and_animal_id(token)

        self.client.post('/api/treatments/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'animal_id': animal_id,
                             'medicine': 'Dewormer',
                             'dosage': '5ml',
                             'withdrawal_days': 3,
                             'notes': 'Deworming'
                         })
        self.client.post('/api/treatments/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'animal_id': animal_id,
                             'medicine': 'Vitamin Shot',
                             'dosage': '1ml',
                             'withdrawal_days': 0,
                             'notes': 'Supplement'
                         })

        response = self.client.get(f'/api/treatments/animal/{animal_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)['data']
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 2)

    def test_4_consumer_safety_check_safe(self):
        token, vet_id = self.get_auth_token_and_vet_id()
        farmer_id, animal_id = self.get_farmer_and_animal_id(token)

        # Create a treatment with 0 withdrawal days (should be safe immediately)
        self.client.post('/api/treatments/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'animal_id': animal_id,
                             'medicine': 'Safe Med',
                             'dosage': '1ml',
                             'withdrawal_days': 0,
                             'notes': 'Safe'
                         })
        response = self.client.get(f'/api/consumer/safety/{farmer_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['data']['status'], 'Safe')

    def test_5_consumer_safety_check_unsafe(self):
        token, vet_id = self.get_auth_token_and_vet_id()
        farmer_id, animal_id = self.get_farmer_and_animal_id(token)

        # Create a treatment with 7 withdrawal days (should be unsafe)
        self.client.post('/api/treatments/',
                         headers={'Authorization': f'Bearer {token}'},
                         json={
                             'animal_id': animal_id,
                             'medicine': 'Unsafe Med',
                             'dosage': '10ml',
                             'withdrawal_days': 7,
                             'notes': 'Unsafe'
                         })
        response = self.client.get(f'/api/consumer/safety/{farmer_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['data']['status'], 'Under Withdrawal')

if __name__ == '__main__':
    unittest.main()