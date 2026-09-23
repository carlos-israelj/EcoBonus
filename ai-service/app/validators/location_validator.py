import logging
from datetime import datetime
from app.utils.image_processing import decode_image, extract_exif_data

logger = logging.getLogger(__name__)


class LocationValidator:
    """
    Validate location authenticity from image metadata and analysis
    """

    def __init__(self):
        self.max_distance_meters = 1000  # Max acceptable distance between GPS and EXIF

    def validate(self, images, claimed_location):
        """
        Validate location authenticity

        Args:
            images: List of base64 encoded images
            claimed_location: dict with latitude and longitude

        Returns:
            dict: Validation results with authenticity score
        """
        try:
            exif_locations = []
            timestamps = []
            has_gps_data = False

            # Extract EXIF data from each image
            for idx, image_b64 in enumerate(images):
                img = decode_image(image_b64)
                exif_data = extract_exif_data(img)

                if exif_data.get('gps'):
                    has_gps_data = True
                    exif_locations.append({
                        'image_index': idx,
                        'latitude': exif_data['gps']['latitude'],
                        'longitude': exif_data['gps']['longitude'],
                        'altitude': exif_data['gps'].get('altitude'),
                    })

                if exif_data.get('datetime'):
                    timestamps.append(exif_data['datetime'])

            # Calculate authenticity score
            authenticity_score = self._calculate_authenticity(
                claimed_location,
                exif_locations,
                has_gps_data,
                timestamps
            )

            # Check consistency
            location_consistent = self._check_location_consistency(
                claimed_location,
                exif_locations
            )

            timestamp_consistent = self._check_timestamp_consistency(timestamps)

            return {
                'has_gps_data': has_gps_data,
                'exif_locations': exif_locations,
                'location_consistent': location_consistent,
                'timestamp_consistent': timestamp_consistent,
                'authenticity_score': round(authenticity_score, 3),
                'validated_at': datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f'Location validation error: {str(e)}', exc_info=True)
            # Return neutral score on error
            return {
                'has_gps_data': False,
                'exif_locations': [],
                'location_consistent': True,
                'timestamp_consistent': True,
                'authenticity_score': 0.5,
                'validated_at': datetime.utcnow().isoformat(),
                'error': str(e),
            }

    def _calculate_authenticity(self, claimed_location, exif_locations, has_gps, timestamps):
        """Calculate overall authenticity score"""
        score = 0.5  # Base score

        # Bonus for having GPS data in EXIF
        if has_gps:
            score += 0.2

            # Check distance between claimed and EXIF locations
            if exif_locations:
                avg_distance = self._average_distance(
                    claimed_location,
                    exif_locations
                )

                if avg_distance < 100:  # Within 100m
                    score += 0.2
                elif avg_distance < 500:  # Within 500m
                    score += 0.1
                elif avg_distance > self.max_distance_meters:
                    score -= 0.3  # Penalty for large discrepancy

        # Bonus for recent timestamps
        if timestamps:
            recent = self._check_timestamps_recent(timestamps)
            if recent:
                score += 0.1

        return max(0.0, min(1.0, score))

    def _check_location_consistency(self, claimed_location, exif_locations):
        """Check if EXIF locations are consistent with claimed location"""
        if not exif_locations:
            return True  # No EXIF data to contradict

        for exif_loc in exif_locations:
            distance = self._calculate_distance(
                claimed_location['latitude'],
                claimed_location['longitude'],
                exif_loc['latitude'],
                exif_loc['longitude']
            )

            if distance > self.max_distance_meters:
                return False

        return True

    def _check_timestamp_consistency(self, timestamps):
        """Check if timestamps are recent and consistent"""
        if not timestamps:
            return True

        # All timestamps should be within last 24 hours
        now = datetime.utcnow()
        for ts in timestamps:
            try:
                ts_dt = datetime.fromisoformat(ts)
                hours_diff = (now - ts_dt).total_seconds() / 3600

                if hours_diff > 24:
                    return False
            except:
                continue

        return True

    def _check_timestamps_recent(self, timestamps):
        """Check if timestamps are recent (within 24 hours)"""
        if not timestamps:
            return False

        now = datetime.utcnow()
        for ts in timestamps:
            try:
                ts_dt = datetime.fromisoformat(ts)
                hours_diff = (now - ts_dt).total_seconds() / 3600

                if hours_diff <= 24:
                    return True
            except:
                continue

        return False

    def _average_distance(self, claimed_location, exif_locations):
        """Calculate average distance between claimed and EXIF locations"""
        if not exif_locations:
            return 0

        distances = [
            self._calculate_distance(
                claimed_location['latitude'],
                claimed_location['longitude'],
                exif_loc['latitude'],
                exif_loc['longitude']
            )
            for exif_loc in exif_locations
        ]

        return sum(distances) / len(distances)

    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate distance between two GPS coordinates in meters
        Using Haversine formula
        """
        from math import radians, sin, cos, sqrt, atan2

        R = 6371000  # Earth radius in meters

        φ1 = radians(lat1)
        φ2 = radians(lat2)
        Δφ = radians(lat2 - lat1)
        Δλ = radians(lon2 - lon1)

        a = sin(Δφ/2) * sin(Δφ/2) + cos(φ1) * cos(φ2) * sin(Δλ/2) * sin(Δλ/2)
        c = 2 * atan2(sqrt(a), sqrt(1-a))

        return R * c
