import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "@shared/schema";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import { UserStorage } from "./user-storage";
import { CategoryStorage } from "./category-storage";
import { ProductStorage } from "./product-storage";
import { OrderStorage } from "./order-storage";
import { AnalyticsStorage } from "./analytics-storage";
import { WishlistStorage } from "./wishlist-storage";
import { IStorage } from "./base-storage";
import type { 
  User, 
  InsertUser, 
  Category,
  InsertCategory,
  Product, 
  InsertProduct,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  OrderWithItems,
  Wishlist,
  InsertWishlist,
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private userStorage: UserStorage;
  private categoryStorage: CategoryStorage;
  private productStorage: ProductStorage;
  private orderStorage: OrderStorage;
  private analyticsStorage: AnalyticsStorage;
  private wishlistStorage: WishlistStorage;
  private logger: Logger;
  private cacheService: CacheService;

  constructor() {
    // Initialize logger and cache service
    this.logger = new Logger();
    this.cacheService = new CacheService();

    // Initialize storage modules
    this.userStorage = new UserStorage();
    this.categoryStorage = new CategoryStorage();
    this.productStorage = new ProductStorage();
    this.orderStorage = new OrderStorage();
    this.analyticsStorage = new AnalyticsStorage();
    this.wishlistStorage = new WishlistStorage();

    // Set dependencies for all modules
    this.setDependencies();

    // Initialize with admin user and sample data
    this.initializeData();
  }

  private setDependencies(): void {
    // Set logger and cache service for all storage modules
    this.userStorage.setDependencies(this.logger, this.cacheService);
    this.categoryStorage.setDependencies(this.logger, this.cacheService);
    this.productStorage.setDependencies(this.logger, this.cacheService);
    this.orderStorage.setDependencies(this.logger, this.cacheService);
    this.analyticsStorage.setDependencies(this.logger, this.cacheService);
    this.wishlistStorage.setDependencies(this.logger, this.cacheService);
  }

  private async initializeData() {
    try {
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
        
        this.logger.info('Admin user initialized');
      }
    } catch (error) {
      this.logger.error('Error initializing admin user', error);
    }
  }

  // User management - delegate to UserStorage
  async getUser(id: string): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    return this.userStorage.updateUser(id, user);
  }

  async getOrdersByUser(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    return this.userStorage.getOrdersByUser(userId);
  }

  // Category management - delegate to CategoryStorage
  async getCategories(): Promise<Category[]> {
    return this.categoryStorage.getCategories();
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categoryStorage.getCategory(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return this.categoryStorage.createCategory(category);
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    return this.categoryStorage.updateCategory(id, category);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categoryStorage.deleteCategory(id);
  }

  // Product management - delegate to ProductStorage
  async getProducts(filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }): Promise<Product[]> {
    return this.productStorage.getProducts(filters);
  }

  async getProductsPaginated(filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }, page?: number, limit?: number): Promise<{ items: Product[]; total: number }> {
    return this.productStorage.getProductsPaginated(filters, page, limit);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.productStorage.getProduct(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.productStorage.createProduct(product);
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.productStorage.updateProduct(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productStorage.deleteProduct(id);
  }

  async bulkCreateProducts(products: InsertProduct[]): Promise<Product[]> {
    return this.productStorage.bulkCreateProducts(products);
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    return this.productStorage.decrementStock(productId, quantity);
  }

  // Order management - delegate to OrderStorage
  async createOrder(orderData: OrderWithItems): Promise<Order> {
    return this.orderStorage.createOrder(orderData);
  }

  async getOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    return this.orderStorage.getOrders();
  }

  async getOrdersByCustomer(phone: string): Promise<(Order & { items: OrderItem[] })[]> {
    return this.orderStorage.getOrdersByCustomer(phone);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.orderStorage.updateOrderStatus(id, status);
  }

  // Stats - delegate to AnalyticsStorage
  async getProductStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    categories: number;
    totalValue: string;
  }> {
    return this.analyticsStorage.getProductStats();
  }

  // Wishlist - delegate to WishlistStorage
  async getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return this.wishlistStorage.getWishlist(userId);
  }

  async addToWishlist(data: InsertWishlist): Promise<Wishlist> {
    return this.wishlistStorage.addToWishlist(data);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    return this.wishlistStorage.removeFromWishlist(userId, productId);
  }

  // Analytics & Reporting - delegate to AnalyticsStorage
  async getSalesAnalytics(params: { from?: Date; to?: Date; interval?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; orders: number; revenue: number }[];
    totals: { orders: number; revenue: number; items: number };
  }> {
    return this.analyticsStorage.getSalesAnalytics(params);
  }

  async getRevenueReport(params: { from?: Date; to?: Date; groupBy?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; revenue: number }[];
    totalRevenue: number;
  }> {
    return this.analyticsStorage.getRevenueReport(params);
  }

  async getProductPerformance(params: { from?: Date; to?: Date; limit?: number }): Promise<Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
    stock: number;
  }>> {
    return this.analyticsStorage.getProductPerformance(params);
  }

  async getInventoryReport(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{ id: string; name: string; stock: number }>;
  }> {
    return this.analyticsStorage.getInventoryReport();
  }

  async getCustomerAnalytics(params: { from?: Date; to?: Date; limit?: number }): Promise<{
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{ userId: string | null; name: string | null; phone: string; orders: number; spend: number }>;
  }> {
    return this.analyticsStorage.getCustomerAnalytics(params);
  }

  // Data management methods
  async clearAllProducts(): Promise<boolean> {
    return this.productStorage.clearAllProducts();
  }

  async clearAllCategories(): Promise<boolean> {
    return this.categoryStorage.clearAllCategories();
  }

  async clearAllData(): Promise<boolean> {
    try {
      // Clear products first (due to foreign key constraint)
      await this.clearAllProducts();
      // Then clear categories
      await this.clearAllCategories();
      
      this.logger.info('All categories and products cleared successfully');
      return true;
    } catch (error) {
      this.logger.error('Error clearing all data', error);
      return false;
    }
  }

  // Cache management methods
  getCacheStats() {
    return this.cacheService.getStats();
  }

  flushCache(): void {
    this.cacheService.flushAll();
  }

  invalidateCache(pattern: string): number {
    return this.cacheService.delPattern(pattern);
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
