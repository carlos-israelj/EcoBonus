import os
import logging
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger(__name__)


def require_api_key(f):
    """
    Decorator to require API key authentication

    Expects header: X-API-Key
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        expected_key = os.getenv('API_KEY')

        if not expected_key:
            logger.warning('API_KEY not configured in environment')
            return jsonify({'error': 'Server configuration error'}), 500

        if not api_key:
            return jsonify({'error': 'Missing API key'}), 401

        if api_key != expected_key:
            logger.warning(f'Invalid API key attempt from {request.remote_addr}')
            return jsonify({'error': 'Invalid API key'}), 403

        return f(*args, **kwargs)

    return decorated_function
