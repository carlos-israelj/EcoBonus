import ExifParser from 'exif-parser';
import sharp from 'sharp';
import imghash from 'imghash';
import fs from 'fs/promises';
import logger from '../config/logger.js';

class PhotoValidationService {
  /**
   * Extract GPS coordinates from photo EXIF data
   * @param {Buffer|string} photoBuffer - Photo buffer or file path
   * @returns {Promise<{latitude: number, longitude: number, timestamp: Date}>}
   */
  async extractGPSFromPhoto(photoBuffer) {
    try {
      let buffer = photoBuffer;

      // If path provided, read file
      if (typeof photoBuffer === 'string') {
        buffer = await fs.readFile(photoBuffer);
      }

      // Parse EXIF data
      const parser = ExifParser.create(buffer);
      const result = parser.parse();

      if (!result.tags) {
        throw new Error('No EXIF data found in photo');
      }

      // Extract GPS coordinates
      const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef, DateTimeOriginal } = result.tags;

      if (!GPSLatitude || !GPSLongitude) {
        throw new Error('No GPS coordinates found in EXIF data');
      }

      // Convert to decimal degrees
      let latitude = GPSLatitude;
      let longitude = GPSLongitude;

      // Apply hemisphere references (N/S/E/W)
      if (GPSLatitudeRef === 'S') {
        latitude = -latitude;
      }
      if (GPSLongitudeRef === 'W') {
        longitude = -longitude;
      }

      // Extract timestamp
      const timestamp = DateTimeOriginal ? new Date(DateTimeOriginal * 1000) : new Date();

      logger.info(`Extracted GPS from photo: (${latitude}, ${longitude}) at ${timestamp}`);

      return {
        latitude,
        longitude,
        timestamp,
        hasGPS: true,
      };
    } catch (error) {
      logger.error('Error extracting GPS from photo:', error.message);
      return {
        latitude: null,
        longitude: null,
        timestamp: null,
        hasGPS: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }

  /**
   * Validate photo location against mission location
   * @param {Object} photoGPS - {latitude, longitude}
   * @param {Object} missionGPS - {latitude, longitude, radius_meters}
   * @returns {Object} Validation result
   */
  validatePhotoLocation(photoGPS, missionGPS) {
    if (!photoGPS.hasGPS) {
      return {
        valid: false,
        reason: 'Photo has no GPS coordinates in EXIF data',
        distance: null,
      };
    }

    const distance = this.calculateDistance(
      photoGPS.latitude,
      photoGPS.longitude,
      missionGPS.latitude,
      missionGPS.longitude
    );

    const maxDistance = missionGPS.radius_meters || 50; // Default 50m radius
    const valid = distance <= maxDistance;

    logger.info(
      `Photo location validation: ${distance}m from mission (max: ${maxDistance}m) - ${valid ? 'VALID' : 'INVALID'}`
    );

    return {
      valid,
      distance,
      maxDistance,
      reason: valid
        ? `Photo taken within ${maxDistance}m of mission location`
        : `Photo location ${distance}m away (exceeds ${maxDistance}m radius)`,
    };
  }

  /**
   * Calculate perceptual hash of image (for duplicate/manipulation detection)
   * @param {Buffer|string} photoBuffer - Photo buffer or file path
   * @returns {Promise<string>} Perceptual hash
   */
  async calculatePhotoHash(photoBuffer) {
    try {
      let buffer = photoBuffer;

      if (typeof photoBuffer === 'string') {
        buffer = await fs.readFile(photoBuffer);
      }

      // Resize image to standard size for consistent hashing
      const resized = await sharp(buffer).resize(256, 256, { fit: 'cover' }).toBuffer();

      // Calculate perceptual hash
      const hash = await imghash.hash(resized, 16); // 16-bit hash

      logger.info(`Calculated perceptual hash: ${hash}`);

      return hash;
    } catch (error) {
      logger.error('Error calculating photo hash:', error.message);
      throw error;
    }
  }

  /**
   * Compare two photo hashes to detect similarity
   * @param {string} hash1 - First hash
   * @param {string} hash2 - Second hash
   * @returns {Object} Similarity result
   */
  comparePhotoHashes(hash1, hash2) {
    // Calculate Hamming distance (number of different bits)
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    // Convert to similarity percentage
    const similarity = ((hash1.length - distance) / hash1.length) * 100;

    // Images are considered similar if > 90% match (typical for same scene)
    // Images are considered identical if > 98% match
    const isSimilar = similarity > 90;
    const isIdentical = similarity > 98;

    logger.info(
      `Photo comparison: ${similarity.toFixed(2)}% similar (identical: ${isIdentical}, similar: ${isSimilar})`
    );

    return {
      similarity: parseFloat(similarity.toFixed(2)),
      hammingDistance: distance,
      isSimilar,
      isIdentical,
      reason: isIdentical
        ? 'Photos are identical or nearly identical'
        : isSimilar
        ? 'Photos are very similar (likely same scene)'
        : 'Photos are different',
    };
  }

  /**
   * Validate before/after photos
   * @param {Buffer} beforePhoto - Before photo buffer
   * @param {Buffer} afterPhoto - After photo buffer
   * @param {Object} mission - Mission object with GPS coordinates
   * @returns {Promise<Object>} Validation result
   */
  async validateBeforeAfterPhotos(beforePhoto, afterPhoto, mission) {
    try {
      // Extract GPS from both photos
      const beforeGPS = await this.extractGPSFromPhoto(beforePhoto);
      const afterGPS = await this.extractGPSFromPhoto(afterPhoto);

      // Validate locations
      const beforeLocationValid = this.validatePhotoLocation(beforeGPS, mission);
      const afterLocationValid = this.validatePhotoLocation(afterGPS, mission);

      // Calculate photo hashes
      const beforeHash = await this.calculatePhotoHash(beforePhoto);
      const afterHash = await this.calculatePhotoHash(afterPhoto);

      // Compare photos
      const hashComparison = this.comparePhotoHashes(beforeHash, afterHash);

      // Overall validation
      const allValid =
        beforeLocationValid.valid &&
        afterLocationValid.valid &&
        !hashComparison.isIdentical; // Photos should NOT be identical

      // Calculate validation score (0-100)
      let score = 0;

      // Location validation (40 points each = 80 total)
      if (beforeLocationValid.valid) score += 40;
      if (afterLocationValid.valid) score += 40;

      // Photo difference validation (20 points)
      if (!hashComparison.isIdentical) {
        score += 20;
      } else {
        // Penalty for identical photos
        score -= 20;
      }

      // GPS metadata presence bonus (10 points each = 20 total)
      if (beforeGPS.hasGPS) score += 10;
      if (afterGPS.hasGPS) score += 10;

      score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

      const result = {
        valid: allValid,
        score,
        before: {
          gps: beforeGPS,
          locationValidation: beforeLocationValid,
          hash: beforeHash,
        },
        after: {
          gps: afterGPS,
          locationValidation: afterLocationValid,
          hash: afterHash,
        },
        comparison: hashComparison,
        issues: [],
      };

      // Collect issues
      if (!beforeLocationValid.valid) {
        result.issues.push(`Before photo: ${beforeLocationValid.reason}`);
      }
      if (!afterLocationValid.valid) {
        result.issues.push(`After photo: ${afterLocationValid.reason}`);
      }
      if (hashComparison.isIdentical) {
        result.issues.push('Before and after photos are identical');
      }
      if (!beforeGPS.hasGPS) {
        result.issues.push('Before photo missing GPS data');
      }
      if (!afterGPS.hasGPS) {
        result.issues.push('After photo missing GPS data');
      }

      logger.info(`Photo validation result: ${allValid ? 'VALID' : 'INVALID'} (score: ${score}/100)`);

      return result;
    } catch (error) {
      logger.error('Error validating before/after photos:', error);
      throw error;
    }
  }

  /**
   * Get image metadata and quality info
   * @param {Buffer} photoBuffer - Photo buffer
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(photoBuffer) {
    try {
      const metadata = await sharp(photoBuffer).metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: photoBuffer.length,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        density: metadata.density,
      };
    } catch (error) {
      logger.error('Error getting image metadata:', error);
      throw error;
    }
  }
}

export default new PhotoValidationService();
