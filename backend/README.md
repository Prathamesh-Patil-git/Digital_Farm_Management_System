# Digital Farm Management System Backend

This is the backend for the Digital Farm Management System, built with Flask and MongoDB.

## Features

- User Authentication (Register, Login, Me) with JWT
- Farmer Management (CRUD)
- Animal Management (CRUD)
- Treatment Management (CRUD) with automatic withdrawal date calculation and alerts
- Consumer Safety Check based on withdrawal alerts

## Technologies Used

- Flask 2.x
- PyMongo (for MongoDB Atlas)
- dnspython
- Flask-JWT-Extended
- python-dotenv
- Python 3.10+

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd backend
    ```

2.  **Create a virtual environment and activate it:**

    ```bash
    python -m venv venv
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Variables:**

    Create a `.env` file in the `backend/` directory with the following content:

    ```
    MONGO_URI="your_mongodb_atlas_connection_string"
    MONGO_DB_NAME="digital_farm"
    JWT_SECRET_KEY="your_super_secret_jwt_key"
    JWT_ACCESS_TOKEN_EXPIRES=3600
    ```

    ```
- `MONGO_URI`: MongoDB connection URI.
- `MONGO_DB_NAME`: Name of the MongoDB database.
- `JWT_SECRET_KEY`: Secret key for JWT token generation.
- `JWT_ACCESS_TOKEN_EXPIRES`: Expiration time for JWT access tokens (e.g., `3600` for 1 hour).
- `TWILIO_ACCOUNT_SID`: Twilio Account SID for OTP service.
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token for OTP service.
- `TWILIO_VERIFY_SERVICE_SID`: Twilio Verify Service SID for OTP service.
```

5.  **Run the application:**

    ```bash
    python run.py
    ```

    The API will be available at `http://127.0.0.1:5000` (or `localhost:5000`).

## API Endpoints

### Authentication

- `POST /auth/register`: Initiate registration by sending OTP to a phone number.
- `POST /auth/verify-otp-and-register`: Verify OTP and complete user registration.
- `POST /auth/login`: Initiate login by sending OTP to a phone number.
- `POST /auth/verify-otp-and-login`: Verify OTP and log in the user, receiving an access token.
- `GET /auth/me`: Get current user's profile (requires authentication).

### Farmers (`/api/farmers`)

-   **`POST /api/farmers/`** (Requires JWT)
    -   **Description:** Create a new farmer entry.
    -   **Request Body:** `{"name": "string", "location": "string", "contact": "string"}`
    -   **Response:** `{"status": "success", "data": {"_id": "string", ...}}`

-   **`GET /api/farmers/`** (Requires JWT)
    -   **Description:** Get all farmers.
    -   **Response:** `{"status": "success", "data": [...]}`

-   **`GET /api/farmers/<id>`** (Requires JWT)
    -   **Description:** Get a farmer by ID.
    -   **Response:** `{"status": "success", "data": {...}}`

-   **`PUT /api/farmers/<id>`** (Requires JWT)
    -   **Description:** Update a farmer by ID.
    -   **Request Body:** `{"name": "string", ...}`
    -   **Response:** `{"status": "success", "data": {...}}`

### Animals (`/api/animals`)

-   **`POST /api/animals/`** (Requires JWT)
    -   **Description:** Create a new animal entry for the authenticated farmer.
    -   **Request Body:** `{"name": "string", "species": "string", "breed": "string", "age": "int", "photo_url": "string"}`
    -   **Response:** `{"status": "success", "data": {"_id": "string", ...}}`

-   **`GET /api/animals/<id>`** (Requires JWT)
    -   **Description:** Get an animal by ID.
    -   **Response:** `{"status": "success", "data": {...}}`

-   **`GET /api/animals/farmer/<farmer_id>`** (Requires JWT)
    -   **Description:** Get all animals belonging to a specific farmer.
    -   **Response:** `{"status": "success", "data": [...]}`

### Treatments (`/api/treatments`)

-   **`POST /api/treatments/`** (Requires JWT)
    -   **Description:** Record a new treatment for an animal. Automatically calculates `safe_from` date and creates a withdrawal alert.
    -   **Request Body:** `{"animal_id": "string", "medicine": "string", "dosage": "string", "withdrawal_days": "int", "notes": "string"}`
    -   **Response:** `{"status": "success", "data": {"_id": "string", "safe_from": "iso_date_string", ...}}`

-   **`GET /api/treatments/<id>`** (Requires JWT)
    -   **Description:** Get a treatment by ID.
    -   **Response:** `{"status": "success", "data": {...}}`

-   **`GET /api/treatments/animal/<animal_id>`** (Requires JWT)
    -   **Description:** Get all treatments for a specific animal.
    -   **Response:** `{"status": "success", "data": [...]}`

### Consumer (`/api/consumer`)

-   **`GET /api/consumer/safety/<farmer_id>`**
    -   **Description:** Check the safety status of products from a farmer based on active withdrawal alerts.
    -   **Response:** `{"status": "success", "data": {"status": "Safe"|"Under Withdrawal", "message": "string"}}`

### Authority (`/api/authority`)

-   **`GET /api/authority/analytics`** (Requires JWT)
    -   **Description:** Placeholder for authority dashboard analytics.
    -   **Response:** `{"status": "success", "data": {...}}` (Currently returns dummy data)