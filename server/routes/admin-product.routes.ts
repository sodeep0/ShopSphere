import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { storage } from "../storage/index";
import { CloudinaryUploader } from "../utils/cloudinary-uploader";
import { insertProductSchema } from "@shared/schema";
import { authenticateAdmin, validateRequest } from "./middleware";
import { ResponseHelper } from "../utils/response";
import { formatValidationError, AppError } from "../utils/app-error";

const router = Router();

// Test route to verify router is mounted
router.get("/test", (req, res) => {
  res.json({ message: "Admin products router is working" });
});

// Multer config for CSV uploads
const csvUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Multer config for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  }
});

// Create product
router.post("/", authenticateAdmin, validateRequest(insertProductSchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedProduct = req.body;
    const product = await storage.createProduct(validatedProduct);
    response.created(product);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Failed to create product');
  }
});

// Upload product image
router.post("/upload-image", authenticateAdmin, imageUpload.single('image'), async (req: Request, res: Response) => {
  console.log('Upload image route hit'); // Debug log
  const response = new ResponseHelper(req, res);
  
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return response.internalError('Cloudinary credentials not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file');
    }

    if (!req.file) {
      return response.badRequest('No image file provided');
    }

    // Validate image
    const validation = CloudinaryUploader.validateImage(req.file);
    if (!validation.valid) {
      return response.badRequest(validation.error!);
    }

    // Upload to Cloudinary
    const processedImages = await CloudinaryUploader.uploadMultipleSizes(
      req.file.buffer,
      req.file.originalname,
      { quality: 85 }
    );

    // Get image info
    const imageInfo = await CloudinaryUploader.getImageInfo(req.file.buffer);

    response.success({
      success: true,
      images: processedImages,
      info: imageInfo,
      message: 'Image uploaded and processed successfully'
    });
  } catch (error: unknown) {
    (req as any).logger?.error('Image upload error', error);
    
    // Return detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    const appError = new AppError(errorMessage, 500);
    return response.error(appError);
  }
});

// Update product
router.put("/:id", authenticateAdmin, validateRequest(insertProductSchema.partial()), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedProduct = req.body;
    const product = await storage.updateProduct(req.params.id, validatedProduct);
    if (!product) {
      return response.notFound('Product', req.params.id);
    }
    response.success(product);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Failed to update product');
  }
});

// Delete product
router.delete("/:id", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    // Get product first to access image path for cleanup
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return response.notFound('Product', req.params.id);
    }

    // Delete the product (soft delete)
    const success = await storage.deleteProduct(req.params.id);
    if (!success) {
      return response.notFound('Product', req.params.id);
    }

    // Clean up associated image files if it's a Cloudinary image
    if (product.image && (
      product.image.startsWith('https://res.cloudinary.com/') || 
      product.image.startsWith('http://res.cloudinary.com/')
    )) {
      try {
        await CloudinaryUploader.deleteImage(product.image);
        (req as any).logger?.info('Cleaned up Cloudinary image for product', { productName: product.name });
      } catch (imageError) {
        (req as any).logger?.error('Error cleaning up Cloudinary image', imageError);
        // Don't fail the delete operation if image cleanup fails
      }
    }

    response.success({ message: 'Product deleted successfully' });
  } catch (error) {
    (req as any).logger?.error('Error deleting product', error);
    response.internalError('Failed to delete product');
  }
});

// CSV Import
router.post("/import-csv", authenticateAdmin, csvUpload.single('csvFile'), async (req: Request, res: Response) => {
  const response = new ResponseHelper(req, res);
  
  if (!req.file) {
    return response.badRequest('No CSV file provided');
  }

  try {
    const products: Record<string, unknown>[] = [];
    const errors: string[] = [];

    // Get categories once before processing CSV
    const categories = await storage.getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.slug, cat.id]));

    const stream = Readable.from(req.file!.buffer);
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        try {
          const categorySlug = row.category?.trim().toLowerCase().replace(/\s+/g, '-');
          
          // Validate required fields
          if (!row.name?.trim() || !row.description?.trim() || !row.price?.toString().trim() || !(row.image_url?.trim() || row.image?.trim()) || !categorySlug) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            return;
          }

          // Validate category and get categoryId
          const validCategorySlugs = Array.from(categoryMap.keys());
          if (!validCategorySlugs.includes(categorySlug)) {
            errors.push(`Invalid category "${categorySlug}" for product "${row.name?.trim()}". Valid categories: ${validCategorySlugs.join(', ')}`);
            return;
          }

          // Get categoryId from slug
          const categoryId = categoryMap.get(categorySlug);
          if (!categoryId) {
            errors.push(`Category "${categorySlug}" not found in database for product "${row.name?.trim()}"`);
            return;
          }

          const product = {
            name: row.name?.trim(),
            description: row.description?.trim(),
            price: row.price?.toString().trim(),
            image: row.image_url?.trim() || row.image?.trim(),
            stock: parseInt(row.stock) || 0,
            categoryId: categoryId,
          };

          // Validate price
          if (isNaN(parseFloat(product.price))) {
            errors.push(`Invalid price "${product.price}" for product "${product.name}"`);
            return;
          }

          products.push(product);
        } catch (error) {
          errors.push(`Error processing row: ${JSON.stringify(row)} - ${error}`);
        }
      })
      .on('end', async () => {
        try {
          if (products.length === 0) {
            return response.badRequest('No valid products to import', { 
              errors: errors.slice(0, 5) // Limit error details
            });
          }

          const createdProducts = await storage.bulkCreateProducts(products as any);
          
          response.bulkOperation('CSV Import', {
            total: products.length,
            successful: createdProducts.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined
          });
        } catch (error) {
          (req as any).logger?.error('CSV import error', error);
          response.internalError('Failed to import products');
        }
      })
      .on('error', (error) => {
        (req as any).logger?.error('CSV parsing error', error);
        response.internalError('CSV parsing failed');
      });

  } catch (error) {
    (req as any).logger?.error('CSV import error', error);
    response.internalError('CSV import failed');
  }
});

export default router;
