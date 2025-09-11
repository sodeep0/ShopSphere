import { 
  type User, 
  type InsertUser, 
  type Category,
  type InsertCategory,
  type Product, 
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
  users,
  categories,
  products,
  orders,
  orderItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category management
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Product management
  getProducts(filters?: { category?: string; inStock?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  decrementStock(productId: string, quantity: number): Promise<boolean>;
  
  // Order management
  createOrder(orderData: OrderWithItems): Promise<Order>;
  getOrders(): Promise<(Order & { items: OrderItem[] })[]>;
  getOrdersByCustomer(phone: string): Promise<(Order & { items: OrderItem[] })[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Stats
  getProductStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    categories: number;
    totalValue: string;
  }>;
}

// Referenced from blueprint:javascript_database
export class DatabaseStorage implements IStorage {
  
  constructor() {
    // Initialize with admin user and sample data
    this.initializeData();
  }

  private async initializeData() {
    // Check if admin user exists
    const existingAdmin = await this.getUserByEmail("admin@krishakrafts.com");
    
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@krishakrafts.com",
        password: hashedPassword,
        name: "Admin User",
        phone: "9841234567",
        role: "admin",
      }).onConflictDoNothing();

      // Seed categories and sample products
      await this.seedCategories();
      await this.seedProducts();
    }
  }

  private async seedCategories() {
    const sampleCategories: InsertCategory[] = [
      {
        name: "Felt Crafts",
        slug: "felt-crafts",
        description: "Beautiful handmade felt products crafted by skilled artisans",
        icon: "🧶"
      },
      {
        name: "Statues",
        slug: "statues", 
        description: "Traditional Buddhist and Hindu statues for meditation and decoration",
        icon: "🏛️"
      },
      {
        name: "Prayer Wheels",
        slug: "prayer-wheels",
        description: "Authentic Tibetan prayer wheels with traditional mantras",
        icon: "☸️"
      },
      {
        name: "Handlooms",
        slug: "handlooms",
        description: "Traditional handwoven textiles and fabrics",
        icon: "🧵"
      }
    ];

    await db.insert(categories).values(sampleCategories).onConflictDoNothing();
  }

  private async seedProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Felt Ball Coasters Set",
        description: "Beautiful handmade felt ball coasters crafted by skilled artisans in Nepal. Perfect for protecting your furniture while adding color.",
        price: "850.00",
        image: "https://images.unsplash.com/photo-1582582494896-86c8b1c8f1b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        stock: 12,
        category: "felt-crafts",
        artisan: "Kamala Devi"
      },
      {
        name: "Tibetan Prayer Wheel",
        description: "Authentic Tibetan prayer wheel with traditional mantras. Handcrafted with brass and wood by Buddhist artisans.",
        price: "2500.00",
        image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        stock: 5,
        category: "prayer-wheels",
        artisan: "Tenzin Norbu"
      },
      {
        name: "Buddha Meditation Statue",
        description: "Serene Buddha statue carved from pure brass. Perfect for meditation spaces and bringing peace to your home.",
        price: "4500.00",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        stock: 3,
        category: "statues",
        artisan: "Rajesh Shakya"
      },
      {
        name: "Handwoven Scarf",
        description: "Beautiful handwoven scarf with traditional patterns. Made from pure wool by skilled weavers in the mountains.",
        price: "1200.00",
        image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        stock: 0,
        category: "handlooms",
        artisan: "Sunita Tamang"
      }
    ];

    await db.insert(products).values(sampleProducts).onConflictDoNothing();
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || 'customer',
      })
      .returning();
    return user;
  }

  // Category management methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // Check if any products use this category
    const [productsUsingCategory] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.category, id));
      
    if (productsUsingCategory.count > 0) {
      return false; // Cannot delete category that has products
    }

    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getProducts(filters?: { category?: string; inStock?: boolean; search?: string }): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));
    
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters?.inStock) {
      conditions.push(sql`${products.stock} > 0`);
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${products.name} ILIKE ${'%' + filters.search + '%'} OR ${products.description} ILIKE ${'%' + filters.search + '%'})`
      );
    }

    const result = await db.select().from(products).where(and(...conditions));
    return result;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...insertProduct,
        stock: insertProduct.stock || 0,
        artisan: insertProduct.artisan || null,
      })
      .returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async bulkCreateProducts(productsData: InsertProduct[]): Promise<Product[]> {
    const result = await db
      .insert(products)
      .values(productsData.map(p => ({
        ...p,
        stock: p.stock || 0,
        artisan: p.artisan || null,
      })))
      .returning();
    return result;
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const result = await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, productId),
        sql`${products.stock} >= ${quantity}`
      ));
    return (result.rowCount || 0) > 0;
  }

  async createOrder(orderData: OrderWithItems): Promise<Order> {
    const result = await db.transaction(async (tx) => {
      // Calculate total
      let total = 0;
      const orderItemsData: InsertOrderItem[] = [];

      for (const item of orderData.items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        
        // Check stock
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        const itemTotal = parseFloat(product.price) * item.quantity;
        total += itemTotal;

        orderItemsData.push({
          productId: item.productId,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
          orderId: '', // Will be set after order creation
        });

        // Decrement stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail || null,
          district: orderData.district,
          road: orderData.road,
          additionalLandmark: orderData.additionalLandmark || null,
          specialInstructions: orderData.specialInstructions || null,
          total: total.toFixed(2),
          status: "pending",
        })
        .returning();

      // Create order items
      await tx
        .insert(orderItems)
        .values(orderItemsData.map(item => ({ ...item, orderId: order.id })));

      console.log(`Order created: ${order.id} for ${order.customerName}`);
      
      return order;
    });

    return result;
  }

  async getOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    const ordersWithItems = await db
      .select({
        order: orders,
        item: orderItems,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .orderBy(sql`${orders.createdAt} DESC`);

    // Group items by order
    const orderMap = new Map<string, Order & { items: OrderItem[] }>();

    ordersWithItems.forEach(({ order, item }) => {
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, { ...order, items: [] });
      }
      if (item) {
        orderMap.get(order.id)!.items.push(item);
      }
    });

    return Array.from(orderMap.values());
  }

  async getOrdersByCustomer(phone: string): Promise<(Order & { items: OrderItem[] })[]> {
    const ordersWithItems = await db
      .select({
        order: orders,
        item: orderItems,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.customerPhone, phone))
      .orderBy(sql`${orders.createdAt} DESC`);

    // Group items by order
    const orderMap = new Map<string, Order & { items: OrderItem[] }>();

    ordersWithItems.forEach(({ order, item }) => {
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, { ...order, items: [] });
      }
      if (item) {
        orderMap.get(order.id)!.items.push(item);
      }
    });

    return Array.from(orderMap.values());
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getProductStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    categories: number;
    totalValue: string;
  }> {
    const activeProducts = await db.select().from(products).where(eq(products.isActive, true));
    
    const lowStock = activeProducts.filter(p => p.stock < 5).length;
    const categories = new Set(activeProducts.map(p => p.category)).size;
    const totalValue = activeProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    
    return {
      totalProducts: activeProducts.length,
      lowStock,
      categories,
      totalValue: `NPR ${(totalValue / 100000).toFixed(1)}L`
    };
  }
}

export const storage = new DatabaseStorage();