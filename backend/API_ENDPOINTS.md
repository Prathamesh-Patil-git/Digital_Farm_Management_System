# Backend API Endpoints Documentation

This document provides a detailed overview of the API endpoints available in the backend application, including details for testing with tools like Postman.

## 1. Core Application Endpoints (`app.py`)

### GET /
*   **Description**: The root endpoint of the application. Typically used for health checks or a simple welcome message.
*   **Flow**: A client sends a GET request to the base URL. The server responds with a simple message, often indicating that the API is running.
*   **Parameters**: None
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    {
        "message": "Welcome to the Digital Farm Management API!"
    }
    ```

## 2. Animal Management Endpoints (`animals.py`)

### POST /
*   **Description**: Creates a new animal record.
*   **Flow**: A client sends a POST request with animal data in the request body. The API validates the data, creates a new animal entry in the database, and returns the newly created animal's details.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "name": "Bessie",
        "species": "Cow",
        "breed": "Holstein",
        "date_of_birth": "2022-01-15",
        "gender": "Female",
        "farmer_id": "<ObjectId_of_Farmer>"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_New_Animal>",
        "name": "Bessie",
        "species": "Cow",
        "breed": "Holstein",
        "date_of_birth": "2022-01-15",
        "gender": "Female",
        "farmer_id": "<ObjectId_of_Farmer>"
    }
    ```

### GET /<id>
*   **Description**: Retrieves a specific animal record by its ID.
*   **Flow**: A client sends a GET request with the animal's ID in the URL. The API queries the database for the animal and returns its details if found.
*   **Parameters**:
    *   `id` (path parameter): The ObjectId of the animal.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_Animal>",
        "name": "Bessie",
        "species": "Cow",
        "breed": "Holstein",
        "date_of_birth": "2022-01-15",
        "gender": "Female",
        "farmer_id": "<ObjectId_of_Farmer>"
    }
    ```

### GET /farmer/<farmer_id>
*   **Description**: Retrieves all animal records associated with a specific farmer ID. Access is restricted: a farmer can only view their own animals, while authorities and veterinarians can view animals belonging to any farmer.
*   **Flow**: A client sends a GET request with a farmer's ID in the URL. The API first checks the authenticated user's identity and role. If the user is the farmer matching `farmer_id`, or if the user is an authority or veterinarian, the API queries the database for all animals belonging to that farmer and returns a list of animal records. Otherwise, access is denied.
*   **Parameters**:
    *   `farmer_id` (path parameter): The ObjectId of the farmer.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    [
        {
            "_id": "<ObjectId_of_Animal_1>",
            "name": "Bessie",
            "species": "Cow",
            "breed": "Holstein",
            "date_of_birth": "2022-01-15",
            "gender": "Female",
            "farmer_id": "<ObjectId_of_Farmer>"
        },
        {
            "_id": "<ObjectId_of_Animal_2>",
            "name": "Daisy",
            "species": "Cow",
            "breed": "Jersey",
            "date_of_birth": "2021-05-20",
            "gender": "Female",
            "farmer_id": "<ObjectId_of_Farmer>"
        }
    ]
    ```
*   **Error Response (403 Forbidden)**:
    ```json
    {
        "error": "Not allowed to view other farmers' animals"
    }
    ```

## 3. Consumer Endpoints (`consumer.py`)

### GET /safety/<farmer_id>
*   **Description**: Provides safety information related to a farmer's produce or practices.
*   **Flow**: A client sends a GET request with a farmer's ID. The API retrieves and returns relevant safety data or certifications associated with that farmer.
*   **Parameters**:
    *   `farmer_id` (path parameter): The ObjectId of the farmer.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    {
        "farmer_id": "<ObjectId_of_Farmer>",
        "safety_status": "Certified Organic",
        "last_inspection_date": "2023-10-26",
        "certifications": [
            "Organic_Certification_2023",
            "GAP_Certified"
        ]
    }
    ```

## 4. Authentication Endpoints (`auth.py`)

### POST /register
*   **Description**: Registers a new user in the system.
*   **Flow**: A client sends a POST request with user registration details. The API creates a new user, sends an OTP for verification, and returns a success message.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "username": "newuser",
        "password": "securepassword",
        "phone_number": "+1234567890"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "message": "OTP sent to +1234567890. Please verify to complete registration.",
        "user_id": "<ObjectId_of_New_User>"
    }
    ```

### POST /login
*   **Description**: Authenticates an existing user.
*   **Flow**: A client sends a POST request with user credentials. The API verifies the credentials, sends an OTP for verification, and returns a success message.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "username": "existinguser",
        "password": "mypassword"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "message": "OTP sent to your registered phone number. Please verify to login.",
        "user_id": "<ObjectId_of_Existing_User>"
    }
    ```

### POST /verify-otp-and-login
*   **Description**: Verifies the OTP and logs in the user, issuing an access token.
*   **Flow**: After a successful login attempt, the client sends a POST request with the provided OTP and user identifier. The API verifies the OTP, and if valid, issues a JWT access token.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "user_id": "<ObjectId_of_User>",
        "otp": "123456" 
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "message": "Login successful",
        "access_token": "<JWT_Access_Token>"
    }
    ```

### POST /verify-otp-and-register
*   **Description**: Verifies the OTP and completes the user registration, issuing an access token.
*   **Flow**: After a successful registration attempt, the client sends a POST request with the provided OTP and user identifier. The API verifies the OTP, completes the registration, and issues a JWT access token.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "user_id": "<ObjectId_of_User>",
        "otp": "123456"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "message": "Registration successful",
        "access_token": "<JWT_Access_Token>"
    }
    ```

### GET /me
*   **Description**: Retrieves the profile of the currently authenticated user.
*   **Flow**: A client sends a GET request with a valid JWT access token in the authorization header. The API uses the token to identify the user and returns their profile information.
*   **Parameters**: None
*   **Request Body (JSON)**: None
*   **Headers**:
    *   `Authorization`: `Bearer <JWT_Access_Token>`
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_User>",
        "username": "authenticateduser",
        "phone_number": "+1234567890",
        "roles": ["farmer"]
    }
    ```

## 5. Treatment Management Endpoints (`treatments.py`)

### POST /
*   **Description**: Creates a new treatment record for an animal.
*   **Flow**: A client sends a POST request with treatment details. The API validates the data, creates a new treatment entry, and returns its details.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "animal_id": "<ObjectId_of_Animal>",
        "treatment_type": "Vaccination",
        "date": "2023-11-01",
        "notes": "Annual rabies vaccination"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_New_Treatment>",
        "animal_id": "<ObjectId_of_Animal>",
        "treatment_type": "Vaccination",
        "date": "2023-11-01",
        "notes": "Annual rabies vaccination"
    }
    ```

### GET /<id>
*   **Description**: Retrieves a specific treatment record by its ID.
*   **Flow**: A client sends a GET request with the treatment's ID. The API queries the database for the treatment and returns its details.
*   **Parameters**:
    *   `id` (path parameter): The ObjectId of the treatment.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_Treatment>",
        "animal_id": "<ObjectId_of_Animal>",
        "treatment_type": "Vaccination",
        "date": "2023-11-01",
        "notes": "Annual rabies vaccination"
    }
    ```

### GET /animal/<animal_id>
*   **Description**: Retrieves all treatment records for a specific animal.
*   **Flow**: A client sends a GET request with an animal's ID. The API queries the database for all treatments associated with that animal and returns a list of treatment records.
*   **Parameters**:
    *   `animal_id` (path parameter): The ObjectId of the animal.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    [
        {
            "_id": "<ObjectId_of_Treatment_1>",
            "animal_id": "<ObjectId_of_Animal>",
            "treatment_type": "Vaccination",
            "date": "2023-11-01",
            "notes": "Annual rabies vaccination"
        },
        {
            "_id": "<ObjectId_of_Treatment_2>",
            "animal_id": "<ObjectId_of_Animal>",
            "treatment_type": "Medication",
            "date": "2023-10-15",
            "notes": "Antibiotics for infection"
        }
    ]
    ```

## 6. Farmer Management Endpoints (`farmers.py`)

### POST /
*   **Description**: Creates a new farmer record.
*   **Flow**: A client sends a POST request with farmer details. The API validates the data, creates a new farmer entry, and returns the newly created farmer's details.
*   **Parameters**: None
*   **Request Body (JSON)**:
    ```json
    {
        "name": "John Doe",
        "contact_number": "+1987654321",
        "location": "Farmville"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_New_Farmer>",
        "name": "John Doe",
        "contact_number": "+1987654321",
        "location": "Farmville"
    }
    ```

### GET /
*   **Description**: Retrieves a list of all farmer records.
*   **Flow**: A client sends a GET request. The API queries the database for all farmers and returns a list of their records.
*   **Parameters**: None
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    [
        {
            "_id": "<ObjectId_of_Farmer_1>",
            "name": "John Doe",
            "contact_number": "+1987654321",
            "location": "Farmville"
        },
        {
            "_id": "<ObjectId_of_Farmer_2>",
            "name": "Jane Smith",
            "contact_number": "+1122334455",
            "location": "Green Acres"
        }
    ]
    ```

### GET /<id>
*   **Description**: Retrieves a specific farmer record by its ID.
*   **Flow**: A client sends a GET request with the farmer's ID. The API queries the database for the farmer and returns their details.
*   **Parameters**:
    *   `id` (path parameter): The ObjectId of the farmer.
*   **Request Body (JSON)**: None
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_Farmer>",
        "name": "John Doe",
        "contact_number": "+1987654321",
        "location": "Farmville"
    }
    ```

### PUT /<id>
*   **Description**: Updates an existing farmer record by its ID.
*   **Flow**: A client sends a PUT request with the farmer's ID in the URL and updated farmer data in the request body. The API validates the data, updates the farmer's entry in the database, and returns the updated details.
*   **Parameters**:
    *   `id` (path parameter): The ObjectId of the farmer.
*   **Request Body (JSON)**:
    ```json
    {
        "name": "Johnathan Doe",
        "contact_number": "+1999888777",
        "location": "New Farmville"
    }
    ```
*   **Example Response (JSON)**:
    ```json
    {
        "_id": "<ObjectId_of_Farmer>",
        "name": "Johnathan Doe",
        "contact_number": "+1999888777",
        "location": "New Farmville"
    }
    ```