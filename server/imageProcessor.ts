import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from './utils/logger';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageProcessor {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'server', 'uploads', 'images');
  private static readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly logger = new Logger();

  /**
   * Process and save uploaded image with multiple sizes
   */
  static async processImage(
    buffer: Buffer,
    filename: string,
    options: ImageProcessingOptions = {}
  ): Promise<{
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    try {
      // Ensure upload directory exists
      await this.ensureUploadDir();

      // Generate unique filename
      const timestamp = Date.now();
      const baseName = path.parse(filename).name.replace(/[^a-zA-Z0-9]/g, '_');
      const extension = 'webp'; // Convert all to webp for better compression

      // Process different sizes
      const sizes = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 800 },
        original: { width: 1200, height: 1200 }
      };

      const processedImages: Record<string, string> = {};

      for (const [sizeName, sizeConfig] of Object.entries(sizes)) {
        const outputFilename = `${baseName}_${sizeName}_${timestamp}.${extension}`;
        const outputPath = path.join(this.UPLOAD_DIR, outputFilename);

        try {
          await sharp(buffer)
            .resize(sizeConfig.width, sizeConfig.height, {
              fit: 'cover',
              position: 'center'
            })
            .webp({ 
              quality: options.quality || 85,
              effort: 6
            })
            .toFile(outputPath);

          processedImages[sizeName] = `/uploads/images/${outputFilename}`;
        } catch (sharpError) {
          this.logger.error(`Error processing ${sizeName} size`, sharpError as Error);
          throw new Error(`Failed to process ${sizeName} size: ${sharpError instanceof Error ? sharpError.message : String(sharpError)}`);
        }
      }

      return processedImages as {
        original: string;
        thumbnail: string;
        medium: string;
        large: string;
      };
    } catch (error) {
      this.logger.error('Error processing image', error as Error, {
        filename,
        bufferSize: buffer.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate image file
   */
  static validateImage(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    if (!this.ALLOWED_FORMATS.includes(fileExtension)) {
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
   * Delete image files
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      if (imagePath.startsWith('/uploads/images/')) {
        const filename = path.basename(imagePath);
        const baseName = filename.split('_')[0];
        const timestamp = filename.split('_')[2]?.split('.')[0];
        
        if (baseName && timestamp) {
          // Find all related files (different sizes)
          const files = await fs.readdir(this.UPLOAD_DIR);
          const relatedFiles = files.filter(file => 
            file.startsWith(`${baseName}_`) && file.includes(`_${timestamp}.`)
          );

          // Delete all related files
          for (const file of relatedFiles) {
            const filePath = path.join(this.UPLOAD_DIR, file);
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error deleting image', error as Error);
    }
  }

  /**
   * Get image URL for serving
   */
  static getImageUrl(imagePath: string, size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'): string {
    if (imagePath.startsWith('http')) {
      return imagePath; // External URL
    }

    if (imagePath.startsWith('/uploads/images/')) {
      // Replace size in filename
      const filename = path.basename(imagePath);
      const parts = filename.split('_');
      if (parts.length >= 3) {
        parts[1] = size;
        const newFilename = parts.join('_');
        return `/uploads/images/${newFilename}`;
      }
    }

    return imagePath;
  }

  /**
   * Ensure upload directory exists
   */
  private static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Get image info
   */
  static async getImageInfo(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
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
}
