
ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"]
ALLOWED_DOC_TYPES = ["pdf", "jpg", "jpeg", "png"]

def validate_user_data(data):
    errors = {}
    if 'phone_number' not in data or not data['phone_number']:
        errors['phone_number'] = 'Phone number is required'
    return errors

def validate_farmer_data(data):
    errors = {}
    if not data.get('name'):
        errors['name'] = 'Farmer name is required'
    if not data.get('location'):
        errors['location'] = 'Location is required'
    if not data.get('contact'):
        errors['contact'] = 'Contact information is required'
    return errors if errors else None

def validate_animal_data(data):
    errors = {}
    if not data.get('name'):
        errors['name'] = 'Animal name is required'
    if not data.get('species'):
        errors['species'] = 'Species is required'
    return errors if errors else None

def validate_treatment_data(data):
    errors = {}
    if not data.get('animal_id'):
        errors['animal_id'] = 'Animal ID is required'
    if not data.get('medicine'):
        errors['medicine'] = 'Medicine is required'
    if not data.get('dosage'):
        errors['dosage'] = 'Dosage is required'
    if data.get('withdrawal_days') is None:
        errors['withdrawal_days'] = 'Withdrawal days is required'
    return errors if errors else None

def validate_file(file):
    if not file:
        return False, "No file uploaded"

    ext = file.filename.split('.')[-1].lower()

    if ext not in (ALLOWED_IMAGE_TYPES + ALLOWED_DOC_TYPES):
        return False, f"File type not allowed: {ext}"

    return True, None
