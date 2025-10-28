/**
 * Example: How to use Cloudinary in your routes
 * 
 * This file shows how to integrate Cloudinary uploads into your existing routes
 * Option 1: Use Cloudinary instead of local ImageProcessor
 * Option 2: Support both (local in dev, Cloudinary in production)
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { CloudinaryUploader } from "../utils/cloudinary-uploader.js";
import { ImageProcessor } from "../imageProcessor.js";

const router = Router();
const response = new ResponseHelper();

// Multer configuration
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * OPTION 1: Use Cloudinary unconditionally
 */
router.post("/upload-cloudinary", imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary with multiple sizes
    const images = await CloudinaryUploader.uploadMultipleSizes(
      req.file.buffer,
      'products'
    );

    res.json({
      success: true,
      images,
      message: 'Image uploaded to Cloudinary successfully'
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * OPTION 2: Support both local and Cloudinary based on environment
 */
router.post("/upload-image", imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate image
    const validation = ImageProcessor.validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    let images;
    let uploadInfo;

    // Choose storage method based on environment variable
    if (process.env.USE_CLOUDINARY === 'true') {
      // Use Cloudinary
      images = await CloudinaryUploader.uploadMultipleSizes(
        req.file.buffer,
        'products'
      );
      uploadInfo = {
        provider: 'cloudinary',
        note: 'Images stored in cloud'
      };
    } else {
      // Use local Sharp processing
      images = await ImageProcessor.processImage(
        req.file.buffer,
        req.file.originalname,
        { quality: 85 }
      );
      uploadInfo = {
        provider: 'local',
        note: 'Images stored locally in server/uploads/images'
      };
    }

    res.json({
      success: true,
      images,
      uploadInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * OPTION 3: Hybrid approach - try Cloudinary, fallback to local
 */
router.post("/upload-hybrid", imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const validation = ImageProcessor.validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    let images;
    let provider = 'local';

    try {
      // Try Cloudinary first if configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        images = await CloudinaryUploader.uploadMultipleSizes(
          req.file.buffer,
          'products'
        );
        provider = 'cloudinary';
      } else {
        throw new Error('Cloudinary not configured');
      }
    } catch (cloudinaryError) {
      // Fallback to local storage
      console.warn('Cloudinary unavailable, using local storage:', cloudinaryError);
      images = await ImageProcessor.processImage(
        req.file.buffer,
        req.file.originalname,
        { quality: 85 }
      );
      provider = 'local';
    }

    res.json({
      success: true,
      images,
      provider
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Example: Delete image
 */
router.delete("/delete-image/:provider/:id", async (req: Request, res: Response) => {
  try {
    const { provider, id } = req.params;

    if (provider === 'cloudinary') {
      // Delete from Cloudinary
      await CloudinaryUploader.deleteImage(id);
      res.json({ success: true, message: 'Image deleted from Cloudinary' });
    } else if (provider === 'local') {
      // Delete from local storage
      await ImageProcessor.deleteImage(id);
      res.json({ success: true, message: 'Image deleted from local storage' });
    } else {
      res.status(400).json({ error: 'Invalid provider' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;

