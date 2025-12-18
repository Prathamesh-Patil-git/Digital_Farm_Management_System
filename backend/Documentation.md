# Project Documentation — DFMS Backend

*(Single Markdown file: `documentation.md` — contains models, routes, auth, API details, and Postman-ready test examples (raw JSON). Use the example requests directly in Postman.)*

**Project synopsis (reference):** [Project Synopsis PDF](/mnt/data/Synopsis Report.pdf). 

---

# 1. Overview

This document describes the backend models, authentication flows, REST endpoints, and test cases for the Digital Farm Management System (DFMS). The stack uses **Flask** + **MongoEngine** (MongoDB) + **Supabase Storage** (S3-like) + **JWT** for auth.
Primary actors: **Farmers**, **Veterinarians (Vets)**, **Authorities**, **Consumers**.

Contents:

* Models (MongoEngine)
* Auth flows
* Routes / APIs (detailed requests/responses)
* Postman-ready test cases (raw JSON)
* Notes on file storage (Supabase): store *paths* in DB; backend generates signed URLs.

---

# 2. Models (detailed)

> All models are MongoEngine `Document`/`EmbeddedDocument`. Timestamps use `datetime.utcnow()`.

## 2.1 Farmer

```python
class GPSLocation(EmbeddedDocument):
    lat = FloatField(required=True)
    lng = FloatField(required=True)

class AfterRegistration(EmbeddedDocument):
    maintains_record_book = BooleanField()
    medicines_in_use = BooleanField()
    follows_vet = BooleanField()
    vet_name = StringField()
    milk_supply_to = ListField(StringField(choices=["local_vendor","cooperative","private_dairy","direct"]))
    cow_count = IntField()
    goat_count = IntField()

class Farmer(Document):
    name = StringField(required=True)
    age = IntField()
    gender = StringField(choices=["male","female","other"])
    address = StringField()
    mobile = StringField(required=True, unique=True)
    mobile_verified = BooleanField(default=False)
    aadhar_number = StringField(required=True)
    photo_path = StringField()                    # Supabase path: farmers/{id}/profile.jpg
    aadhar_photo_path = StringField()             # Supabase path
    tahsildar_verification_path = StringField()
    is_verified = BooleanField(default=False)
    gps_location = EmbeddedDocumentField(GPSLocation)
    after_registration = EmbeddedDocumentField(AfterRegistration)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
```

**Notes**

* Store *storage paths* (e.g., `farmers/<farmerId>/profile.jpg`), not signed URLs.
* `mobile` used for farmer OTP auth/identity.

## 2.2 Vet

```python
class Vet(Document):
    name = StringField(required=True)
    age = IntField()
    gender = StringField(choices=["male","female","other"])
    address = StringField()
    mobile = StringField(required=True, unique=True)
    mobile_verified = BooleanField(default=False)
    qualification = StringField(required=True)
    registration_number = StringField(required=True)
    specialization = ListField(StringField())    # e.g. ["cattle","poultry"]
    profile_photo_path = StringField()
    license_certificate_path = StringField()
    degree_certificate_path = StringField()
    id_card_path = StringField()
    is_verified = BooleanField(default=False)
    verification_notes = StringField()
    gps_location = EmbeddedDocumentField(GPSLocation)
    rating = FloatField(default=0)
    review_count = IntField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
```

**Notes**

* `mobile` used for vet OTP auth/identity.
* `registration_number` required (professional verification).

## 2.3 Animal

```python
class Animal(Document):
    farmer = ReferenceField(Farmer, required=True)
    species = StringField(choices=["cow","buffalo","goat","sheep","poultry"], required=True)
    breed = StringField()
    tag_number = StringField(required=True, unique=True)
    age = FloatField()
    gender = StringField(choices=["male","female"])
    weight = FloatField()
    is_lactating = BooleanField(default=False)
    daily_milk_yield = FloatField(default=0)
    pregnancy_status = StringField(choices=["pregnant","dry","open","unknown"], default="unknown")
    profile_photo_path = StringField()
    additional_image_paths = ListField(StringField())
    assigned_vet_id = StringField()
    current_health_issues = ListField(StringField())
    is_active = BooleanField(default=True)
    treatment_ids = ListField(StringField())
    gps_location = EmbeddedDocumentField(GPSLocation)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
```

**Notes**

* `tag_number` unique to prevent duplicates.
* `treatment_ids` stores treatment id strings for quick history lookup.

## 2.4 MedicineDetail (Document)

```python
class MedicineDetail(Document):
    name = StringField(required=True)
    dosage = StringField(required=True)
    route = StringField(choices=["oral","IM","IV","SC","topical"])
    frequency = StringField()
    duration_days = IntField()
    withdrawal_period_days = IntField(required=True)
```

**Notes**

* Stored as separate documents referenced by `Treatment.medicines`.

## 2.5 Treatment

```python
class Treatment(Document):
    farmer = ReferenceField(Farmer, required=True)
    vet = ReferenceField(Vet)           # assigned when diagnosed
    animal = ReferenceField(Animal, required=True)
    diagnosis = StringField(required=True)
    symptoms = ListField(StringField())
    notes = StringField()
    medicines = ListField(ReferenceField(MedicineDetail))
    treatment_start_date = DateTimeField(default=datetime.utcnow)
    withdrawal_ends_on = DateTimeField()  # auto-calculated
    reminder_sent_farmer = BooleanField(default=False)
    reminder_sent_authority = BooleanField(default=False)
    prescription_path = StringField()    # Supabase path: treatments/{id}/prescription.jpg
    report_paths = ListField(StringField())
    is_withdrawal_completed = BooleanField(default=False)
    is_flagged_violation = BooleanField(default=False)
    violation_reason = StringField()
    status = StringField(choices=["pending","diagnosed","completed"], default="pending")
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        if self.medicines:
            max_days = max(m.withdrawal_period_days for m in self.medicines)
            self.withdrawal_ends_on = self.treatment_start_date + timedelta(days=max_days)
        self.updated_at = datetime.utcnow()
        return super(Treatment, self).save(*args, **kwargs)
```

**Notes**

* `status` tracks lifecycle.
* `withdrawal_ends_on` computed from medicines.

## 2.6 Authority

```python
class Authority(Document):
    name = StringField(required=True)
    username = StringField(required=True, unique=True)
    password_hash = StringField(required=True)
    role = StringField(required=True, choices=["admin","verifier","dashboard_viewer"], default="dashboard_viewer")
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
```

**Notes**

* Authorities use username+password login (hashed).
* `role` controls access to dashboard APIs.

---

# 3. Authentication Flows

## 3.1 Farmer — OTP (mobile)

* `POST /auth/register` (mobile) → send OTP (Twilio).
* `POST /auth/verify-otp-and-register` (mobile, otp_code, name, aadhar_number) → create Farmer, mark `mobile_verified=True`, return JWT.
* `POST /auth/login` (mobile) → send OTP.
* `POST /auth/verify-otp-and-login` (mobile, otp_code) → return JWT.

**JWT identity** = `str(farmer.id)` (MongoEngine ID).
**Token lifetime**: typically 24 hours (configurable).

## 3.2 Vet — OTP (mobile)

Same as Farmer, using Vet model fields (`name`, `qualification`, `registration_number`). JWT identity = vet.id.

## 3.3 Authority — username/password

* `POST /authority/register` (name, username, password, designation?, department?) → create authority (password hashed).
* `POST /authority/login` (username, password) → returns JWT.
* `GET /authority/me` (Authorization: Bearer token) → returns authority profile.

**Password hashing**: `werkzeug.security.generate_password_hash` & `check_password_hash`.

---

# 4. Routes / APIs (detailed)

For each endpoint: URL, method, auth, request JSON, sample response, notes. Use `{{BASE_URL}}` as placeholder.

> **Header requirements**
>
> * For protected endpoints: `Authorization: Bearer <JWT_TOKEN>`
> * For file upload endpoints: `Content-Type: multipart/form-data`

---

## 4.1 Auth — Farmer

### 4.1.1 Request OTP (Register)

* **URL:** `POST {{BASE_URL}}/auth/register`
* **Auth:** None
* **Body (JSON):**

```json
{ "mobile": "9876543210" }
```

* **Success (200):**

```json
{ "success": true, "data": { "message": "OTP sent successfully", "sid": "XXX" } }
```

* **Notes:** Returns OTP service SID.

### 4.1.2 Verify OTP & Register

* **URL:** `POST {{BASE_URL}}/auth/verify-otp-and-register`
* **Auth:** None
* **Body:**

```json
{
  "mobile": "9876543210",
  "otp_code": "123456",
  "name": "Ram",
  "aadhar_number": "1234-5678-9012"
}
```

* **Success (201):**

```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "access_token": "<JWT_TOKEN>"
  }
}
```

### 4.1.3 Request OTP (Login)

* **URL:** `POST {{BASE_URL}}/auth/login`
* **Body:**

```json
{ "mobile": "9876543210" }
```

### 4.1.4 Verify OTP & Login

* **URL:** `POST {{BASE_URL}}/auth/verify-otp-and-login`
* **Body:**

```json
{ "mobile": "9876543210", "otp_code": "123456" }
```

* **Success (200):**

```json
{ "success": true, "data": { "message": "Login successful", "access_token": "<JWT>" } }
```

---

## 4.2 Auth — Vet

Endpoints mirror Farmer auth, replace `/auth/...` with `/vet-auth/...` or the vet blueprint path used in your code. Request bodies include `qualification` & `registration_number` for register flow.

---

## 4.3 Auth — Authority (username/password)

### 4.3.1 Register (Admin creates Authority)

* **URL:** `POST {{BASE_URL}}/authority/register`
* **Body:**

```json
{
  "name": "Food Safety Officer",
  "username": "fso_admin",
  "password": "StrongPass123",
  "designation": "Inspector",
  "department": "Food Safety"
}
```

* **Success (201):**

```json
{ "success": true, "data": { "message": "Authority registered successfully" } }
```

### 4.3.2 Login

* **URL:** `POST {{BASE_URL}}/authority/login`
* **Body:**

```json
{ "username": "fso_admin", "password": "StrongPass123" }
```

* **Success (200):**

```json
{ "success": true, "data": { "message": "Login successful", "access_token": "<JWT>" } }
```

### 4.3.3 Get Profile

* **URL:** `GET {{BASE_URL}}/authority/me`
* **Headers:** `Authorization: Bearer <JWT>`
* **Success (200):** Authority profile (without password hash).

---

## 4.4 Farmer Routes

### 4.4.1 Get Logged-in Farmer

* **GET** `GET {{BASE_URL}}/farmers/me`
* **Auth:** Bearer JWT
* **Returns:** full farmer data (paths stored for files).

### 4.4.2 Update Profile (Farmer)

* **PUT** `PUT {{BASE_URL}}/farmers/me`
* **Auth:** Bearer JWT
* **Body (partial allowed):**

```json
{ "name": "New Name", "address": "Village X", "gps_location": {"lat":18.52,"lng":73.85} }
```

* **Success:** updated farmer document.

> Note: File uploads (profile photos, aadhar scans) use the Upload endpoints (below). After uploading, update farmer via `profile_photo_path` etc.

---

## 4.5 Vet Routes (CRUD)

* `GET /vets/me` — get logged-in vet
* `PUT /vets/me` — update vet profile
* `GET /vets/` — list vets (admin/dashboard)
* Implementation analogous to Farmer.

---

## 4.6 Animal Routes

### 4.6.1 Create Animal

* **URL:** `POST {{BASE_URL}}/animals/`
* **Auth:** Farmer JWT
* **Body:**

```json
{
  "species": "cow",
  "breed": "Jersey",
  "tag_number": "TAG-0001",
  "gender": "female",
  "age": 3.5,
  "is_lactating": true,
  "daily_milk_yield": 6.2,
  "profile_photo_path": "animals/<id>/profile.jpg"
}
```

* **Success (201):** Animal document.

### 4.6.2 Get My Animals

* **URL:** `GET {{BASE_URL}}/animals/mine`
* **Auth:** Farmer JWT
* **Success:** list of animal documents.

### 4.6.3 Get/Update a Single Animal

* **URL:** `GET/PUT {{BASE_URL}}/animals/<animal_id>`
* **Auth:** Farmer JWT (owner) or authority/vet depending on RBAC
* **PUT body:** allowed fields: species, breed, age, weight, milk_yield, profile_photo_path, additional_image_paths.

---

## 4.7 Uploads (Supabase storage via backend)

### 4.7.1 Upload Generic File (Farmers / Vets / Animals / Treatments)

* **URL:** `POST {{BASE_URL}}/uploads/farmer` (or `/uploads/vet`, `/uploads/animal/<animal_id>`, `/uploads/treatment/<treatment_id>`)
* **Auth:** Bearer JWT
* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (binary)
* **Success (200):**

```json
{
  "success": true,
  "data": { "path": "farmers/<id>/<uuid>.jpg", "url": "<SIGNED_URL>" }
}
```

* **Notes:** Backend uses Supabase service role key to upload, returns *signed URL* valid for some time (e.g., 1 year).

**Postman file upload example**

* Method: POST
* URL: `{{BASE_URL}}/uploads/farmer`
* Authorization: Bearer token
* Body: form-data → key `file` type: File → choose file

---

## 4.8 Treatment Routes

### 4.8.1 Create Treatment Request (Farmer)

* **URL:** `POST {{BASE_URL}}/treatments/request`
* **Auth:** Farmer JWT
* **Body:**

```json
{
  "animal_id": "<animal_id>",
  "symptoms": ["reduced appetite","swelling"],
  "diagnosis": "Suspected mastitis",
  "notes": "Farmer observations"
}
```

* **Success (201):**

```json
{ "success": true, "data": { /* treatment doc */ } }
```

* **Status:** `pending` (vet not yet assigned).

### 4.8.2 Get Treatment

* **URL:** `GET {{BASE_URL}}/treatments/<treatment_id>`
* **Auth:** JWT (farmer/vet/authority)
* **RBAC:** Farmer only their own; Vet assigned or pending; Authority full access.

### 4.8.3 Vet Diagnose Treatment

* **URL:** `PUT {{BASE_URL}}/treatments/<treatment_id>/diagnose`
* **Auth:** Vet JWT
* **Body:**

```json
{
  "medicines": [
    {
      "name": "Oxytetracycline",
      "dosage": "10 ml",
      "route": "IM",
      "frequency": "1/day",
      "duration_days": 3,
      "withdrawal_period_days": 7
    }
  ],
  "notes": "Started IM injection"
}
```

* **Success (200):** Updated treatment with `withdrawal_ends_on` auto-calculated.

### 4.8.4 Get Treatments by Animal

* **URL:** `GET {{BASE_URL}}/treatments/animal/<animal_id>`
* **Auth:** Farmer (owner), Vet (assigned/pending), Authority
* **Query behavior:** Vet sees assigned or pending treatments.

---

## 4.9 Authority Dashboard APIs

(Requires Authority JWT with role `admin` / `verifier` / `dashboard_viewer`)

### 4.9.1 Overview

* **GET** `GET {{BASE_URL}}/authority/dashboard/overview`
* **Returns:** counts: farmers, vets, animals, treatments, pending_verifications.

### 4.9.2 List Farmers / Vets / Animals

* `GET /authority/dashboard/farmers`
* `GET /authority/dashboard/vets`
* `GET /authority/dashboard/animals`

### 4.9.3 List Treatments with Filters

* **GET** `/authority/dashboard/treatments?status=diagnosed&farmer_id=...&vet_id=...`

### 4.9.4 Pending Verifications & Verify Farmer

* `GET /authority/dashboard/pending-verifications`
* `PUT /authority/dashboard/verify-farmer/<farmer_id>`

### 4.9.5 Violations & Statistics

* `GET /authority/dashboard/violations`
* `GET /authority/dashboard/stats/medicine-usage`
* `GET /authority/dashboard/stats/daily-treatments`

---

## 4.10 Consumer API

### 4.10.1 Check Safety

* **GET** `GET {{BASE_URL}}/consumer/safety/<farmer_id>`
* **Auth:** None
* **Response (Safe):**

```json
{ "success": true, "data": { "status": "Safe", "message": "Milk and meat from this farmer are safe for consumption." } }
```

* **Response (Under Withdrawal):**

```json
{ "success": true, "data": { "status": "Under Withdrawal", "message": "Milk or meat from this farmer is currently NOT SAFE." } }
```

**Logic:** Check any `Treatment` where `withdrawal_ends_on > now` for any animal of the farmer.

---

# 5. Postman-ready Test Cases (raw JSON examples)

> Use these as request bodies in Postman. For endpoints requiring JWT, first generate token from login/register endpoints and paste into Authorization header as `Bearer <token>`.

---

## 5.1 Farmer Signup & Login Flow (Postman steps)

### 5.1.1 Request OTP (Register)

* **POST** `{{BASE_URL}}/auth/register`
* **Body JSON**

```json
{ "mobile": "9998887776" }
```

### 5.1.2 Verify OTP & Register

* **POST** `{{BASE_URL}}/auth/verify-otp-and-register`
* **Body JSON**

```json
{
  "mobile": "9998887776",
  "otp_code": "123456",
  "name": "Ram Rajurkar",
  "aadhar_number": "1111-2222-3333"
}
```

* **Copy** `access_token` from response for subsequent calls.

### 5.1.3 Login (request OTP) / Verify login

* Same as register OTP/login sequence.

---

## 5.2 Authority Username/Password Flow

### 5.2.1 Register Authority

* **POST** `{{BASE_URL}}/authority/register`
* **Body**

```json
{
  "name": "Officer One",
  "username": "officer1",
  "password": "Pass@1234",
  "designation": "Inspector",
  "department": "Food Safety"
}
```

### 5.2.2 Login Authority

* **POST** `{{BASE_URL}}/authority/login`
* **Body**

```json
{ "username": "officer1", "password": "Pass@1234" }
```

* **Copy** access_token.

---

## 5.3 Vet Flow

### 5.3.1 Request OTP (Register)

```json
{ "mobile": "8887776665" }
```

### 5.3.2 Verify OTP & Register

```json
{
  "mobile": "8887776665",
  "otp_code": "123456",
  "name": "Dr. V",
  "qualification": "BVSc",
  "registration_number": "REG-001"
}
```

---

## 5.4 Create Animal (Farmer)

* **POST** `{{BASE_URL}}/animals/`
* **Headers:** `Authorization: Bearer <FARMER_JWT>`
* **Body:**

```json
{
  "species": "cow",
  "breed": "Jersey",
  "tag_number": "TAG-0001",
  "gender": "female",
  "age": 3.2,
  "is_lactating": true,
  "daily_milk_yield": 6.5,
  "profile_photo_path": "animals/TAG-0001/profile.jpg"
}
```

---

## 5.5 Upload a File (Farmers)

* **POST** `{{BASE_URL}}/uploads/farmer`
* **Headers:** `Authorization: Bearer <FARMER_JWT>`
* **Body:** form-data → `file: <select file>`
* **Expected response:**

```json
{ "success": true, "data": { "path": "farmers/<id>/<uuid>.jpg", "url": "<SIGNED_URL>" } }
```

After upload, update farmer with:

* `PUT {{BASE_URL}}/farmers/me` body:

```json
{ "photo_path": "farmers/<id>/<uuid>.jpg" }
```

---

## 5.6 Create Treatment Request (Farmer)

* **POST** `{{BASE_URL}}/treatments/request`
* **Headers:** `Authorization: Bearer <FARMER_JWT>`
* **Body:**

```json
{
  "animal_id": "<animal_id>",
  "symptoms": ["reduced_milk", "swollen-udder"],
  "diagnosis": "Suspected mastitis",
  "notes": "Farmer observed fever and reduced appetite"
}
```

---

## 5.7 Vet Diagnose Treatment

* **PUT** `{{BASE_URL}}/treatments/<treatment_id>/diagnose`
* **Headers:** `Authorization: Bearer <VET_JWT>`
* **Body:**

```json
{
  "medicines": [
    {
      "name": "Oxytetracycline",
      "dosage": "10 ml",
      "route": "IM",
      "frequency": "1/day",
      "duration_days": 3,
      "withdrawal_period_days": 7
    }
  ],
  "notes": "Administered IM, advised rest"
}
```

**Expected behavior**

* `withdrawal_ends_on` auto-calculated: `treatment_start_date + 7 days`
* Treatment `status` becomes `diagnosed`.

---

## 5.8 Consumer Safety Check

* **GET** `{{BASE_URL}}/consumer/safety/<farmer_id>`
* **No auth required**
* **Response** either Safe / Under Withdrawal.

---

# 6. Postman Usage Tips

* Create environment variables:

  * `BASE_URL = http://localhost:5000`
  * `FARMER_JWT`, `VET_JWT`, `AUTH_JWT` (set after login)
* For protected endpoints, set header:

  * `Authorization: Bearer {{FARMER_JWT}}`
* For multipart uploads, use `form-data` and choose file for key `file`.
* For date fields in responses, expect ISO-8601 strings; when comparing in Postman tests, parse as needed.

---

# 7. Implementation Notes & Best Practices

* **Do not store signed URLs** in DB — store *paths*, then issue signed URLs on read.
* **Supabase service key** must always remain on server side (do not expose to frontend).
* **OTP security**: limit attempts, expiry window, rate-limit per phone number.
* **Password security**: use salted hashing (`werkzeug.security`).
* **RBAC**: implement decorators to verify roles for admin-only/authority-only endpoints.
* **Cron jobs**:

  * Send withdrawal reminders (when withdrawal_ends_on - 1 day).
  * Mark treatments complete when `withdrawal_ends_on` passes.
* **Validation**: validate file types & sizes before upload to Supabase.
* **Logging**: log critical actions (verifications, diagnoses, violations).
* **Testing**: add unit tests for withdrawal calc and RBAC checks.

---

# 8. Example Postman Test Sequence (minimal, copy/paste)

1. Request Farmer OTP
   POST `/auth/register`
   Body: `{ "mobile": "9998887776" }`

2. Verify Farmer OTP & Register
   POST `/auth/verify-otp-and-register`
   Body:

```json
{ "mobile": "9998887776", "otp_code": "123456", "name": "Ram", "aadhar_number": "111122223333" }
```

3. Create Animal (use FARMER_JWT)
   POST `/animals/` with Authorization header
   Body:

```json
{
  "species": "cow",
  "breed": "Jersey",
  "tag_number": "TAG-0001",
  "gender": "female"
}
```

4. Create Treatment Request (Farmer)
   POST `/treatments/request` with Authorization FARMER_JWT
   Body:

```json
{ "animal_id": "<animal_id>", "symptoms": ["reduced_milk"], "diagnosis": "Suspected mastitis" }
```

5. Vet registers & logs in; diagnose treatment (VET_JWT)
   PUT `/treatments/<treatment_id>/diagnose`
   Body: (medicine example from 5.7)

6. Consumer checks safety
   GET `/consumer/safety/<farmer_id>`

---

# 9. Quick Reference — Common Response Format

All endpoints use the response helpers:

* **Success**

```json
{ "success": true, "data": ... }
```

* **Error**

```json
{ "success": false, "message": "Description" }
```

---

# 10. Files & Appendix

* Project synopsis (local): `/mnt/data/Synopsis Report.pdf`. 

---

If you want, I can now:

* Generate a single `documentation.md` file and place it in the project workspace (ready to copy/paste).
* Or export an **importable Postman collection JSON** with all above requests pre-filled (I can generate that next).

Which would you like next?
