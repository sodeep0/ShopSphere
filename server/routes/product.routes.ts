import { Router } from "express";
import { storage } from "../storage/index";
import { ResponseHelper } from "../utils/response";
import { db } from "../db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all products with filters
router.get("/", async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { category, inStock, search, sortBy } = req.query;
    
    const filters: Record<string, string | boolean> = {};
    if (category && typeof category === 'string') {
      filters.category = category;
    }
    if (inStock === 'true') {
      filters.inStock = true;
    }
    if (search && typeof search === 'string') {
      filters.search = search;
    }
    if (sortBy && typeof sortBy === 'string') {
      filters.sortBy = sortBy;
    }
    
    // Support pagination: page & limit
    const page = req.query.page ? parseInt(String(req.query.page)) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;

    if (page || limit) {
      const result = await storage.getProductsPaginated(filters, page || 1, limit || 12);
      return response.paginated(result.items, {
        page: page || 1,
        limit: limit || 12,
        total: result.total
      });
    }

    const products = await storage.getProducts(filters);
    response.success(products);
  } catch (error) {
    response.internalError('Failed to fetch products');
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return response.notFound('Product', req.params.id);
    }
    response.success(product);
  } catch (error) {
    response.internalError('Failed to fetch product');
  }
});

// Debug endpoint to check stock levels
router.get("/debug/stock/:id", async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return response.notFound('Product', req.params.id);
    }
    
    // Also get raw database data
    const rawProduct = await db.select().from(products).where(eq(products.id, req.params.id));
    
    response.success({
      cached: product,
      raw: rawProduct[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    response.internalError('Failed to fetch product debug info');
  }
});

export default router;
