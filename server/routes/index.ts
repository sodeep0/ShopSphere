import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "../storage/index";
import { responseHelperMiddleware, ResponseHelper } from "../utils/response";
import { createErrorHandler } from "../utils/app-error";
import { createRequestLogger } from "../utils/logger";
import { corsMiddleware, securityHeaders, requestId } from "./middleware";

// Import route modules
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import wishlistRoutes from "./wishlist.routes";
import adminProductRoutes from "./admin-product.routes";
import adminOrderRoutes from "./admin-order.routes";
import adminCategoryRoutes from "./admin-category.routes";
import adminAnalyticsRoutes from "./admin-analytics.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply global middleware
  app.use(securityHeaders);
  app.use(requestId);
  app.use(corsMiddleware);
  app.use(responseHelperMiddleware);
  app.use(createRequestLogger() as any);
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Serve uploaded images with proper content types
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
    }
  }));
  
  // Public Routes
  
  // Category Routes
  app.get("/api/categories", async (req, res) => {
    const response = new ResponseHelper(req, res);
    try {
      const categories = await storage.getCategories();
      response.success(categories);
    } catch (error) {
      response.internalError('Failed to fetch categories');
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    const response = new ResponseHelper(req, res);
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return response.notFound('Category', req.params.id);
      }
      response.success(category);
    } catch (error) {
      response.internalError('Failed to fetch category');
    }
  });

  // Mount route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  
  // Admin routes
  app.use("/api/admin/products", adminProductRoutes);
  app.use("/api/admin/orders", adminOrderRoutes);
  app.use("/api/admin/categories", adminCategoryRoutes);
  app.use("/api/admin", adminAnalyticsRoutes);

  // Error handling middleware (must be last)
  app.use(createErrorHandler());

  const httpServer = createServer(app);
  return httpServer;
}
