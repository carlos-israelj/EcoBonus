import multer from 'multer';
import logger from '../config/logger.js';

// Configure multer for memory storage (we'll process and upload to IPFS)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    logger.warn(`Rejected non-image file: ${file.mimetype}`);
    return cb(new Error('Only image files are allowed'), false);
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    logger.warn(`Rejected file too large: ${file.size} bytes`);
    return cb(new Error('File size exceeds 10MB limit'), false);
  }

  cb(null, true);
};

// Single file upload
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('photo');

// Multiple files upload (before + after)
export const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 2, // Max 2 files
  },
}).fields([
  { name: 'before', maxCount: 1 },
  { name: 'after', maxCount: 1 },
]);

// Error handler middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 2 files allowed',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Only "before" and "after" fields are allowed',
      });
    }

    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  }

  if (err) {
    logger.error('Upload error:', err);
    return res.status(400).json({
      error: 'Upload failed',
      message: err.message,
    });
  }

  next();
};

export default {
  uploadSingle,
  uploadPhotos,
  handleUploadError,
};
