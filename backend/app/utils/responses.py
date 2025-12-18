from flask import jsonify
import json

def success_response(data, status_code=200):
    # If route passed a JSON string, convert back to dict
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            pass  # If not JSON, keep as is

    return jsonify({
        'status': 'success',
        'data': data
    }), status_code


def error_response(message, status_code=400):
    return jsonify({
        'status': 'error',
        'message': message
    }), status_code
