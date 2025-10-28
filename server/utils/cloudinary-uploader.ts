import cloudinary from '../config/cloudinary.js';
import { Logger } from './logger.js';
import path from 'path';
import sharp from 'sharp';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
}

export interface CloudinaryImages {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
}

export class CloudinaryUploader {
  private static readonly logger = new Logger();

  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'products',
    transformation?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: transformation ? [
            {
              width: transformation.width,
              height: transformation.height,
              quality: transformation.quality || 'auto',
              fetch_format: transformation.format || 'auto',
              crop: 'fill',
              gravity: 'auto'
            }
          ] : undefined,
        },
        (error: any, result: any) => {
          if (error) {
            this.logger.error('Cloudinary upload error', error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      ).end(buffer);
    });
  }

  /**
   * Upload multiple image sizes (matches ImageProcessor.processImage interface)
   */
  static async uploadMultipleSizes(
    buffer: Buffer,
    filename: string,
    options: { quality?: number } = {}
  ): Promise<CloudinaryImages> {
    try {
      const timestamp = Date.now();
      const baseName = path.parse(filename).name.replace(/[^a-zA-Z0-9]/g, '_');
      const folder = `Krisha Krafts/${timestamp}_${baseName}`;

      const quality = options.quality || 85;

      // Upload all sizes in parallel for better performance
      const [thumbnail, medium, large, original] = await Promise.all([
        this.uploadImage(buffer, folder, {
          width: 150,
          height: 150,
          quality,
          format: 'auto'
        }),
        this.uploadImage(buffer, folder, {
          width: 400,
          height: 400,
          quality,
          format: 'auto'
        }),
        this.uploadImage(buffer, folder, {
          width: 800,
          height: 800,
          quality,
          format: 'auto'
        }),
        this.uploadImage(buffer, folder, {
          width: 1200,
          height: 1200,
          quality,
          format: 'auto'
        })
      ]);

      return {
        original: original.secure_url,
        thumbnail: thumbnail.secure_url,
        medium: medium.secure_url,
        large: large.secure_url,
      };
    } catch (error) {
      this.logger.error('Cloudinary multi-size upload error', error as Error);
      throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * Accepts either Cloudinary URL or public_id
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      let publicId: string;

      // Extract public_id from Cloudinary URL
      if (imagePath.startsWith('https://res.cloudinary.com/') || imagePath.startsWith('http://res.cloudinary.com/')) {
        // Parse public_id from URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567/products/timestamp_filename.jpg
        const urlParts = imagePath.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        
        if (uploadIndex >= 0 && urlParts.length > uploadIndex + 2) {
          // Get path after 'upload' (skip version if present)
          const pathAfterUpload = urlParts.slice(uploadIndex + 1);
          const versionIndex = pathAfterUpload.findIndex(part => part.startsWith('v'));
          const resourcePath = versionIndex >= 0 
            ? pathAfterUpload.slice(versionIndex + 1).join('/')
            : pathAfterUpload.slice(1).join('/');
          
          publicId = resourcePath.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        } else {
          throw new Error('Invalid Cloudinary URL format');
        }
      } else {
        // Assume it's already a public_id
        publicId = imagePath;
      }

      // Delete all versions of the image
      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
          if (error) {
            this.logger.error('Cloudinary delete error', error);
            reject(new Error(`Cloudinary delete failed: ${error.message}`));
          } else {
            this.logger.info('Cloudinary image deleted', { publicId, result });
            resolve();
          }
        });
      });

    } catch (error) {
      this.logger.error('Error deleting Cloudinary image', error as Error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete multiple images by public_id pattern
   */
  static async deleteImagesByPattern(pattern: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.api.delete_resources_by_prefix(pattern, (error: any, result: any) => {
        if (error) {
          this.logger.error('Cloudinary batch delete error', error);
          reject(new Error(`Cloudinary batch delete failed: ${error.message}`));
        } else {
          this.logger.info('Cloudinary images deleted', { pattern, count: result.deleted });
          resolve();
        }
      });
    });
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): string {
    return cloudinary.url(publicId, {
      transformation: [{
        width: options.width,
        height: options.height,
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
        crop: 'fill',
        gravity: 'auto'
      }],
      secure: true
    });
  }

  /**
   * Validate image file (matches ImageProcessor.validateImage interface)
   */
  static validateImage(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed' };
    }

    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid MIME type' };
    }

    return { valid: true };
  }

  /**
   * Get image info from buffer (matches ImageProcessor.getImageInfo interface)
   * Uses Sharp for efficient local metadata extraction
   */
  static async getImageInfo(buffer: Buffer): Promise<ImageInfo> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length
      };
    } catch (error) {
      this.logger.error('Error getting image info', error as Error);
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate image buffer
   */
  static validateImageBuffer(buffer: Buffer): { valid: boolean; error?: string } {
    // Check buffer size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check minimum size (should be at least 1KB)
    if (buffer.length < 1024) {
      return { valid: false, error: 'File too small to be a valid image' };
    }

    return { valid: true };
  }
}

