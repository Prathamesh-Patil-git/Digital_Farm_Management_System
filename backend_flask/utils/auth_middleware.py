from functools import wraps
from flask import request, jsonify
import jwt, os
from jwt.api_jws import PyJWS

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        token = auth_header.replace("Bearer", "").strip()

        try:
            # --- 1. Parse header & signature manually (no claim validation) ---
            jws = PyJWS()
            decoded_payload = jws.decode_complete(
                token,
                key=SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_signature": True}
            )["payload"]

            # --- 2. Manually check expiry ---
            import time
            if "exp" in decoded_payload and time.time() > decoded_payload["exp"]:
                return jsonify({"error": "Token expired"}), 401

            # --- 3. Attach user payload ---
            request.user = decoded_payload
            return f(*args, **kwargs)

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": "Invalid token", "details": str(e)}), 401
        except Exception as e:
            return jsonify({"error": "Unexpected error", "details": str(e)}), 401

    return wrapper
