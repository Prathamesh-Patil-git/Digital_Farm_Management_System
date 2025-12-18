from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
from utils.supabase_client import supabase
import jwt, os

load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# ==============================================================
# Helper: Auth Middleware
# ==============================================================
def require_auth(f):
    from functools import wraps

    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Authorization header missing"}), 401
        token = token.replace("Bearer ", "")
        try:
            decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
            request.user = decoded
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401
        return f(*args, **kwargs)

    return wrapper


# ==============================================================
# Root / Health Check
# ==============================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Digital Farm API",
        "version": "1.0.0",
        "status": "running"
    }), 200

@app.route("/api/auth/debug", methods=["GET"])
@require_auth
def debug_auth():
    return jsonify(request.user)

# ==============================================================
# FARMER ROUTES
# ==============================================================
@app.route("/api/farmers/animals", methods=["POST"])
@require_auth
def create_animal():
    """Add a new animal for a farmer"""
    data = request.get_json()
    auth_user_id = request.user.get("sub")

    # Find farmer internal ID
    farmer = supabase.table("users").select("id").eq("auth_user_id", auth_user_id).single().execute()
    if not farmer.data:
        return jsonify({"error": "Farmer not found"}), 404

    new_animal = {
        "farmer_id": farmer.data["id"],
        "name": data.get("name"),
        "species": data.get("species"),
        "breed": data.get("breed"),
        "age": data.get("age"),
        "photo_url": data.get("photo_url")
    }

    res = supabase.table("animals").insert(new_animal).execute()
    return jsonify({"message": "Animal created successfully", "animal": res.data[0]}), 201


@app.route("/api/farmers/animals", methods=["GET"])
@require_auth
def list_animals():
    """List all animals for the logged-in farmer"""
    auth_user_id = request.user.get("sub")
    farmer = supabase.table("users").select("id").eq("auth_user_id", auth_user_id).single().execute()
    if not farmer.data:
        return jsonify({"error": "Farmer not found"}), 404

    animals = supabase.table("animals").select("*").eq("farmer_id", farmer.data["id"]).execute()
    return jsonify({"animals": animals.data}), 200


@app.route("/api/farmers/treatments", methods=["POST"])
@require_auth
def create_treatment():
    """Record new treatment for an animal"""
    data = request.get_json()
    auth_user_id = request.user.get("sub")

    user = supabase.table("users").select("id, role").eq("auth_user_id", auth_user_id).single().execute()
    if not user.data:
        return jsonify({"error": "User not found"}), 404

    vet_id = user.data["id"] if user.data["role"] == "vet" else None

    treatment_data = {
        "animal_id": data.get("animal_id"),
        "vet_id": vet_id,
        "medicine": data.get("medicine"),
        "dosage": data.get("dosage"),
        "withdrawal_days": data.get("withdrawal_days"),
        "notes": data.get("notes")
    }

    treatment = supabase.table("treatments").insert(treatment_data).execute()
    treatment_record = treatment.data[0]

    # Auto-create withdrawal alert
    due_date = datetime.now() + timedelta(days=int(data.get("withdrawal_days", 0)))
    supabase.table("alerts").insert({
        "treatment_id": treatment_record["id"],
        "due_date": due_date.strftime("%Y-%m-%d")
    }).execute()

    return jsonify({"message": "Treatment recorded", "treatment": treatment_record}), 201


# ==============================================================
# VET ROUTES
# ==============================================================
@app.route("/api/vets/treatments", methods=["GET"])
@require_auth
def vet_treatments():
    """List all treatments prescribed by vet"""
    auth_user_id = request.user.get("sub")
    vet = supabase.table("users").select("id").eq("auth_user_id", auth_user_id).single().execute()
    if not vet.data:
        return jsonify({"error": "Vet not found"}), 404

    treatments = supabase.table("treatments").select("*").eq("vet_id", vet.data["id"]).execute()
    return jsonify({"treatments": treatments.data}), 200


# ==============================================================
# CONSUMER ROUTES
# ==============================================================
@app.route("/api/consumers/check_safety/<farmer_id>", methods=["GET"])
def check_safety(farmer_id):
    """Check if a farmer's products are safe (withdrawal period ended)"""
    treatments = supabase.table("treatments")\
        .select("*, animals(farmer_id)")\
        .eq("animals.farmer_id", farmer_id)\
        .order("treatment_date", desc=True)\
        .limit(1)\
        .execute()

    if not treatments.data:
        return jsonify({"status": "Safe", "message": "No recent treatments"}), 200

    latest = treatments.data[0]
    treat_date = datetime.strptime(str(latest["treatment_date"]), "%Y-%m-%d")
    withdraw_end = treat_date + timedelta(days=latest["withdrawal_days"])

    if datetime.now() < withdraw_end:
        return jsonify({"status": "Under Withdrawal"}), 200
    else:
        return jsonify({"status": "Safe"}), 200


# ==============================================================
# AUTHORITY ROUTES
# ==============================================================
@app.route("/api/authority/analytics", methods=["GET"])
@require_auth
def authority_dashboard():
    """Provide analytics for authorities"""
    total_animals = len(supabase.table("animals").select("*").execute().data)
    total_treatments = len(supabase.table("treatments").select("*").execute().data)
    active_alerts = len(supabase.table("alerts").select("*").eq("sent", False).execute().data)

    return jsonify({
        "summary": {
            "total_animals": total_animals,
            "total_treatments": total_treatments,
            "active_alerts": active_alerts
        }
    }), 200


# ==============================================================
# 404 & ERROR HANDLERS
# ==============================================================
@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


# ==============================================================
# Run the App
# ==============================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
