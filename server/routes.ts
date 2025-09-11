import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { 
  loginSchema, 
  insertProductSchema, 
  insertCategorySchema,
  orderWithItemsSchema,
  categoryFilterSchema 
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "krisha-krafts-secret-key";

// Multer config for CSV uploads
const upload = multer({ 
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

// Auth middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Public Routes
  
  // Get all products with filters
  app.get("/api/products", async (req, res) => {
    try {
      const { category, inStock, search } = req.query;
      
      const filters: any = {};
      if (category && typeof category === 'string') {
        const validCategory = categoryFilterSchema.safeParse(category);
        if (validCategory.success) {
          filters.category = validCategory.data;
        }
      }
      if (inStock === 'true') {
        filters.inStock = true;
      }
      if (search && typeof search === 'string') {
        filters.search = search;
      }
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });

  // Category Routes
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Get single category
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  });

  // Place order (COD)
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = orderWithItemsSchema.parse(req.body);
      const order = await storage.createOrder(validatedOrder);
      
      // In production, send email notification here
      console.log(`Order created: ${order.id} for ${order.customerName}`);
      
      res.status(201).json(order);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || 'Failed to create order' });
      }
    }
  });

  // Get orders by customer phone
  app.get("/api/orders/customer/:phone", async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.params.phone);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Admin Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // In production, use proper bcrypt comparison
      // For demo, accept "admin123" as password
      if (password !== 'admin123') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid login data' });
      } else {
        res.status(500).json({ message: 'Login failed' });
      }
    }
  });

  // Protected Admin Routes
  
  // Create product
  app.post("/api/admin/products", authenticateAdmin, async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create product' });
      }
    }
  });

  // Update product
  app.put("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedProduct);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update product' });
      }
    }
  });

  // Delete product
  app.delete("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // CSV Import
  app.post("/api/admin/products/import-csv", authenticateAdmin, upload.single('csvFile'), async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file provided' });
    }

    try {
      const products: any[] = [];
      const errors: string[] = [];

      const stream = Readable.from(req.file!.buffer);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          try {
            const product = {
              name: row.name?.trim(),
              description: row.description?.trim(),
              price: row.price?.toString().trim(),
              image: row.image_url?.trim() || row.image?.trim(),
              stock: parseInt(row.stock) || 0,
              category: row.category?.trim().toLowerCase().replace(/\s+/g, '-'),
              artisan: row.artisan?.trim(),
            };

            // Validate required fields
            if (!product.name || !product.description || !product.price || !product.image || !product.category) {
              errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
              return;
            }

            // Validate category
            const validCategories = ['felt-crafts', 'statues', 'prayer-wheels', 'handlooms'];
            if (!validCategories.includes(product.category)) {
              errors.push(`Invalid category "${product.category}" for product "${product.name}"`);
              return;
            }

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
              return res.status(400).json({ 
                message: 'No valid products to import',
                errors 
              });
            }

            const createdProducts = await storage.bulkCreateProducts(products);
            
            res.json({
              success: true,
              imported: createdProducts.length,
              errors: errors.length > 0 ? errors : undefined,
              message: `Successfully imported ${createdProducts.length} products${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
            });
          } catch (error) {
            res.status(500).json({ message: 'Failed to import products', error: error });
          }
        })
        .on('error', (error) => {
          res.status(500).json({ message: 'CSV parsing failed', error: error.message });
        });

    } catch (error) {
      res.status(500).json({ message: 'CSV import failed', error });
    }
  });

  // Get all orders (admin)
  app.get("/api/admin/orders", authenticateAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Update order status
  app.put("/api/admin/orders/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Get admin stats
  app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getProductStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Admin Category Routes
  
  // Create category
  app.post("/api/admin/categories", authenticateAdmin, async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedCategory);
      res.status(201).json(category);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || 'Failed to create category' });
      }
    }
  });

  // Update category
  app.put("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedCategory);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || 'Failed to update category' });
      }
    }
  });

  // Delete category
  app.delete("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(400).json({ 
          message: 'Cannot delete category that has products. Move products to another category first.' 
        });
      }
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
