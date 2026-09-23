# EcoBonus AI Validation Service

AI-powered validation service for waste collection claims using computer vision and image analysis.

## Features

- **Waste Detection**: Object detection using DETR (DEtection TRansformer) model
- **Category Classification**: Classify waste into 7 categories (plastic, glass, paper, metal, organic, electronic, mixed)
- **Weight Estimation**: Estimate waste weight based on detected objects
- **Location Validation**: Verify location authenticity using EXIF GPS data
- **Fraud Detection**: Cross-reference claimed data with AI analysis

## Tech Stack

- **Framework**: Flask (Python 3.10+)
- **ML Models**: PyTorch, Transformers (Hugging Face)
- **Computer Vision**: PIL, OpenCV, DETR
- **Image Processing**: EXIF data extraction, GPS parsing

## Architecture

### Validators

1. **WasteValidator**: Detects and classifies waste objects
   - Uses DETR object detection model
   - Maps detected objects to waste categories
   - Estimates weight based on object count
   - Calculates confidence scores

2. **LocationValidator**: Verifies location authenticity
   - Extracts GPS coordinates from image EXIF
   - Compares with claimed location
   - Checks timestamp consistency
   - Calculates authenticity score

### Validation Flow

```
1. Receive claim with images + metadata
2. Extract EXIF data (GPS, timestamp)
3. Run object detection on images
4. Classify waste category
5. Estimate weight
6. Calculate validation scores
7. Return approval decision + analysis
```

## Setup

### 1. Install Dependencies

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
- Set `API_KEY` for authentication
- Configure `MODEL_PATH` if using custom trained model
- Set `USE_GPU=true` if CUDA available

### 3. Download Models

```bash
# DETR model will auto-download on first run
# Or manually download:
python -c "from transformers import AutoModelForObjectDetection; AutoModelForObjectDetection.from_pretrained('facebook/detr-resnet-50')"
```

### 4. Run Service

```bash
# Development
python app/main.py

# Production with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app.main:app
```

Service runs on `http://localhost:5000`

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "EcoBonus AI Validation",
  "version": "1.0.0",
  "model_loaded": true
}
```

### Validate Claim
```bash
POST /api/validate/claim
Headers: X-API-Key: your_api_key
Content-Type: application/json

{
  "claim_id": 123,
  "images": ["base64_image1", "base64_image2"],
  "location": {
    "latitude": -12.046374,
    "longitude": -77.042793
  },
  "claimed_category": "plastic",
  "claimed_weight_kg": 5
}
```

Response:
```json
{
  "claim_id": 123,
  "approved": true,
  "validation_score": 0.872,
  "waste_analysis": {
    "detected_category": "plastic",
    "claimed_category": "plastic",
    "category_match": true,
    "estimated_weight_kg": 4.8,
    "claimed_weight_kg": 5,
    "weight_match": true,
    "total_objects_detected": 12,
    "confidence": 0.865,
    "detections": [...]
  },
  "location_analysis": {
    "has_gps_data": true,
    "location_consistent": true,
    "timestamp_consistent": true,
    "authenticity_score": 0.9
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Classify Waste
```bash
POST /api/classify/waste
Headers: X-API-Key: your_api_key

{
  "image": "base64_image"
}
```

### Estimate Weight
```bash
POST /api/estimate/weight
Headers: X-API-Key: your_api_key

{
  "image": "base64_image",
  "category": "plastic"
}
```

## Validation Scoring

### Overall Validation Score
- **Waste Detection**: 60% weight
- **Location Authenticity**: 25% weight
- **Consistency Checks**: 15% weight

### Approval Threshold
- Default: 0.75 (75% confidence)
- Configurable via `CONFIDENCE_THRESHOLD` env var

### Fraud Detection Signals

**Positive**:
- GPS data in EXIF matches claimed location (< 100m)
- Recent timestamps (< 24 hours)
- Multiple waste objects detected
- Category matches claim

**Negative**:
- No GPS data in EXIF
- Location mismatch (> 1km)
- Old timestamps (> 24 hours)
- Few or no objects detected
- Category mismatch with claim

## Model Training (Future)

To improve accuracy, train custom model on waste images:

1. Collect dataset of labeled waste images
2. Fine-tune DETR on waste detection task
3. Save model to `models/waste_classifier`
4. Update `MODEL_PATH` in .env

## Integration with Backend

Backend API calls this service during claim validation:

```python
import requests

response = requests.post(
    'http://localhost:5000/api/validate/claim',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'claim_id': claim_id,
        'images': images_base64,
        'location': {'latitude': lat, 'longitude': lon},
        'claimed_category': category,
        'claimed_weight_kg': weight,
    }
)

result = response.json()
if result['approved']:
    # Approve claim on blockchain
    pass
```

## Performance

- **Inference Time**: ~500ms per image on CPU, ~100ms on GPU
- **Memory**: ~2GB RAM for model
- **Throughput**: ~10 requests/second on single worker

## Security

- API key authentication required
- Rate limiting recommended (30 requests/minute)
- Input validation on image size and format
- No persistent storage of images

## Next Steps

- [ ] Collect and annotate waste image dataset
- [ ] Fine-tune DETR model for waste detection
- [ ] Add rate limiting middleware
- [ ] Implement caching for repeated validations
- [ ] Add comprehensive test suite
- [ ] Deploy with Docker

## License

MIT
