import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from app.validators.waste_validator import WasteValidator
from app.validators.location_validator import LocationValidator
from app.utils.auth import require_api_key
from app.utils.logger import setup_logger

load_dotenv()

app = Flask(__name__)
CORS(app)

# Setup logging
logger = setup_logger(__name__)

# Initialize validators
waste_validator = WasteValidator()
location_validator = LocationValidator()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'EcoBonus AI Validation',
        'version': '1.0.0',
        'model_loaded': waste_validator.is_loaded(),
    })


@app.route('/api/validate/claim', methods=['POST'])
@require_api_key
def validate_claim():
    """
    Validate a waste collection claim

    Request body:
    {
        "claim_id": 123,
        "images": ["base64_image1", "base64_image2"],
        "location": {"latitude": -12.046374, "longitude": -77.042793},
        "claimed_category": "plastic",
        "claimed_weight_kg": 5
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Missing request body'}), 400

        claim_id = data.get('claim_id')
        images = data.get('images', [])
        location = data.get('location')
        claimed_category = data.get('claimed_category')
        claimed_weight_kg = data.get('claimed_weight_kg')

        # Validate required fields
        if not claim_id or not images or not location:
            return jsonify({
                'error': 'Missing required fields: claim_id, images, location'
            }), 400

        if len(images) < int(os.getenv('MIN_EVIDENCE_PHOTOS', 2)):
            return jsonify({
                'error': f'Minimum {os.getenv("MIN_EVIDENCE_PHOTOS", 2)} images required'
            }), 400

        logger.info(f'Validating claim {claim_id}')

        # Validate location authenticity
        location_result = location_validator.validate(images, location)

        # Validate waste detection and classification
        waste_result = waste_validator.validate(
            images,
            claimed_category,
            claimed_weight_kg
        )

        # Calculate overall validation score
        overall_score = calculate_validation_score(location_result, waste_result)
        approved = overall_score >= float(os.getenv('CONFIDENCE_THRESHOLD', 0.75))

        response = {
            'claim_id': claim_id,
            'approved': approved,
            'validation_score': round(overall_score, 3),
            'waste_analysis': waste_result,
            'location_analysis': location_result,
            'timestamp': waste_result['timestamp'],
        }

        logger.info(f'Claim {claim_id} validated: {approved} (score: {overall_score})')

        return jsonify(response), 200

    except Exception as e:
        logger.error(f'Error validating claim: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Validation failed',
            'message': str(e)
        }), 500


@app.route('/api/classify/waste', methods=['POST'])
@require_api_key
def classify_waste():
    """
    Classify waste category from image

    Request body:
    {
        "image": "base64_image"
    }
    """
    try:
        data = request.get_json()
        image = data.get('image')

        if not image:
            return jsonify({'error': 'Missing image'}), 400

        result = waste_validator.classify_single_image(image)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f'Error classifying waste: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Classification failed',
            'message': str(e)
        }), 500


@app.route('/api/estimate/weight', methods=['POST'])
@require_api_key
def estimate_weight():
    """
    Estimate waste weight from image

    Request body:
    {
        "image": "base64_image",
        "category": "plastic"
    }
    """
    try:
        data = request.get_json()
        image = data.get('image')
        category = data.get('category')

        if not image or not category:
            return jsonify({'error': 'Missing image or category'}), 400

        result = waste_validator.estimate_weight(image, category)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f'Error estimating weight: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Weight estimation failed',
            'message': str(e)
        }), 500


def calculate_validation_score(location_result, waste_result):
    """
    Calculate overall validation score from location and waste analysis

    Weights:
    - Waste detection: 60%
    - Location authenticity: 25%
    - Consistency checks: 15%
    """
    waste_score = waste_result.get('confidence', 0) * 0.6
    location_score = location_result.get('authenticity_score', 0) * 0.25
    consistency_score = waste_result.get('consistency_score', 0.8) * 0.15

    return waste_score + location_score + consistency_score


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {str(error)}')
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_ENV') == 'development'

    logger.info(f'Starting AI Validation Service on {host}:{port}')
    app.run(host=host, port=port, debug=debug)
