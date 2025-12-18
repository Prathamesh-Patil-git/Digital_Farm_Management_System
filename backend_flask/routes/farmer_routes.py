from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.auth_middleware import require_auth

farmer_bp = Blueprint("farmer", __name__)

@farmer_bp.route("/animals", methods=["POST"])
@require_auth
def add_animal():
    payload = request.get_json()
    auth_user_id = request.user.get("sub")  # Supabase user id
    # find local user id by auth_user_id
    res = supabase.table("users").select("id").eq("auth_user_id", auth_user_id).single().execute()
    if res.error or not res.data:
        return jsonify({"error":"User not found"}), 404
    farmer_id = res.data["id"]
    insert = supabase.table("animals").insert({
      "farmer_id": farmer_id,
      "name": payload["name"],
      "species": payload["species"],
      "photo_url": payload.get("photo_url")
    }).execute()
    return jsonify(insert.data), 201
