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
  type Wishlist,
  type InsertWishlist,
} from "@shared/schema";

// Base storage interface
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getOrdersByUser(userId: string): Promise<(Order & { items: OrderItem[] })[]>;
  
  // Category management
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Product management
  getProducts(filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }): Promise<Product[]>;
  getProductsPaginated(filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }, page?: number, limit?: number): Promise<{ items: Product[]; total: number }>;
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

  // Wishlist
  getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(data: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<boolean>;

  // Analytics & Reporting
  getSalesAnalytics(params: { from?: Date; to?: Date; interval?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; orders: number; revenue: number }[];
    totals: { orders: number; revenue: number; items: number };
  }>;

  getRevenueReport(params: { from?: Date; to?: Date; groupBy?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; revenue: number }[];
    totalRevenue: number;
  }>;

  getProductPerformance(params: { from?: Date; to?: Date; limit?: number }): Promise<Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
    stock: number;
  }>>;

  getInventoryReport(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{ id: string; name: string; stock: number }>;
  }>;

  getCustomerAnalytics(params: { from?: Date; to?: Date; limit?: number }): Promise<{
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{ userId: string | null; name: string | null; phone: string; orders: number; spend: number }>;
  }>;

  // Data management
  clearAllProducts(): Promise<boolean>;
  clearAllCategories(): Promise<boolean>;
  clearAllData(): Promise<boolean>;
}

// Base storage class with common functionality
export abstract class BaseStorage {
  protected logger: any;
  protected cacheService: any;

  constructor() {
    // These will be injected by the main storage class
    this.logger = null;
    this.cacheService = null;
  }

  // Set dependencies (called by main storage class)
  setDependencies(logger: any, cacheService: any): void {
    this.logger = logger;
    this.cacheService = cacheService;
  }

  // Common error handling
  protected handleError(operation: string, error: any): never {
    if (this.logger) {
      this.logger.error(`Storage error in ${operation}`, error);
    }
    throw error;
  }

  // Common performance logging
  protected logPerformance(operation: string, startTime: number, meta?: Record<string, any>): void {
    if (this.logger) {
      const duration = Date.now() - startTime;
      this.logger.performance(operation, duration, meta);
    }
  }

  // Common cache operations
  protected getFromCache<T>(key: string): T | undefined {
    return this.cacheService?.get<T>(key);
  }

  protected setCache<T>(key: string, value: T, ttl?: number): boolean {
    return this.cacheService?.set(key, value, ttl) ?? false;
  }

  protected invalidateCache(pattern: string): number {
    return this.cacheService?.delPattern(pattern) ?? 0;
  }
}
