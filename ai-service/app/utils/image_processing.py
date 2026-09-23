import base64
import logging
from io import BytesIO
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime

logger = logging.getLogger(__name__)


def decode_image(base64_string):
    """
    Decode base64 string to PIL Image

    Args:
        base64_string: Base64 encoded image string

    Returns:
        PIL.Image: Decoded image
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        # Decode base64
        image_data = base64.b64decode(base64_string)

        # Open as PIL Image
        image = Image.open(BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        return image

    except Exception as e:
        logger.error(f'Error decoding image: {str(e)}')
        raise ValueError(f'Failed to decode image: {str(e)}')


def preprocess_image(image, max_size=4096):
    """
    Preprocess image for model input

    Args:
        image: PIL Image
        max_size: Maximum dimension size

    Returns:
        PIL.Image: Preprocessed image
    """
    # Resize if too large
    width, height = image.size
    if max(width, height) > max_size:
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))

        image = image.resize((new_width, new_height), Image.LANCZOS)

    return image


def extract_exif_data(image):
    """
    Extract EXIF metadata from image

    Args:
        image: PIL Image

    Returns:
        dict: EXIF data including GPS coordinates and timestamp
    """
    try:
        exif_data = {}

        # Get EXIF data
        exif = image._getexif()

        if not exif:
            return exif_data

        # Parse standard EXIF tags
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)

            if tag == 'GPSInfo':
                gps_data = {}
                for gps_tag_id in value:
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_data[gps_tag] = value[gps_tag_id]

                # Convert GPS coordinates
                exif_data['gps'] = parse_gps_data(gps_data)

            elif tag == 'DateTime' or tag == 'DateTimeOriginal':
                try:
                    # Parse datetime string
                    dt = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S')
                    exif_data['datetime'] = dt.isoformat()
                except:
                    pass

            elif tag in ['Make', 'Model', 'Software']:
                exif_data[tag.lower()] = str(value)

        return exif_data

    except Exception as e:
        logger.warning(f'Error extracting EXIF data: {str(e)}')
        return {}


def parse_gps_data(gps_data):
    """
    Parse GPS data from EXIF to decimal coordinates

    Args:
        gps_data: GPS EXIF data dictionary

    Returns:
        dict: Parsed GPS coordinates
    """
    try:
        lat_dms = gps_data.get('GPSLatitude')
        lat_ref = gps_data.get('GPSLatitudeRef')
        lon_dms = gps_data.get('GPSLongitude')
        lon_ref = gps_data.get('GPSLongitudeRef')

        if not all([lat_dms, lat_ref, lon_dms, lon_ref]):
            return None

        # Convert DMS to decimal
        latitude = convert_to_decimal(lat_dms, lat_ref)
        longitude = convert_to_decimal(lon_dms, lon_ref)

        altitude = gps_data.get('GPSAltitude')
        if altitude:
            altitude = float(altitude)

        return {
            'latitude': latitude,
            'longitude': longitude,
            'altitude': altitude,
        }

    except Exception as e:
        logger.warning(f'Error parsing GPS data: {str(e)}')
        return None


def convert_to_decimal(dms, ref):
    """
    Convert GPS coordinates from DMS (degrees, minutes, seconds) to decimal

    Args:
        dms: Tuple of (degrees, minutes, seconds)
        ref: Reference ('N', 'S', 'E', 'W')

    Returns:
        float: Decimal coordinate
    """
    degrees = float(dms[0])
    minutes = float(dms[1])
    seconds = float(dms[2])

    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)

    if ref in ['S', 'W']:
        decimal = -decimal

    return decimal


def encode_image(image, format='JPEG', quality=85):
    """
    Encode PIL Image to base64 string

    Args:
        image: PIL Image
        format: Output format (JPEG, PNG)
        quality: JPEG quality (1-100)

    Returns:
        str: Base64 encoded image
    """
    buffer = BytesIO()
    image.save(buffer, format=format, quality=quality)
    buffer.seek(0)

    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f'data:image/{format.lower()};base64,{encoded}'
