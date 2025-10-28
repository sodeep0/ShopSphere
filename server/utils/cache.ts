import NodeCache from 'node-cache';
import { cache } from '../config/index';
import { Logger } from './logger';

const logger = new Logger();

// Cache instance
const cacheInstance = new NodeCache({
  stdTTL: cache.defaultTtl,
  maxKeys: cache.maxKeys,
  useClones: false, // Better performance for objects
  deleteOnExpire: true,
});

// Cache key generators
export const CacheKeys = {
  // Categories
  categories: () => 'categories:all',
  category: (id: string) => `category:${id}`,
  categoryBySlug: (slug: string) => `category:slug:${slug}`,

  // Products
  products: (filters: Record<string, any>) => {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `products:${filterStr}`;
  },
  product: (id: string) => `product:${id}`,
  productsPaginated: (filters: Record<string, any>, page: number, limit: number) => {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `products:paginated:${filterStr}:page:${page}:limit:${limit}`;
  },

  // Orders
  orders: () => 'orders:all',
  ordersByUser: (userId: string) => `orders:user:${userId}`,
  ordersByCustomer: (phone: string) => `orders:customer:${phone}`,

  // Stats and Analytics
  productStats: () => 'stats:products',
  salesAnalytics: (params: Record<string, any>) => {
    const paramStr = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `analytics:sales:${paramStr}`;
  },
  revenueReport: (params: Record<string, any>) => {
    const paramStr = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `analytics:revenue:${paramStr}`;
  },
  productPerformance: (params: Record<string, any>) => {
    const paramStr = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `analytics:products:${paramStr}`;
  },
  inventoryReport: () => 'analytics:inventory',
  customerAnalytics: (params: Record<string, any>) => {
    const paramStr = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `analytics:customers:${paramStr}`;
  },

  // Wishlist
  wishlist: (userId: string) => `wishlist:${userId}`,
};

// Cache wrapper class
export class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = cacheInstance;
    
    // Log cache events
    this.cache.on('set', (key, value) => {
      logger.debug('Cache set', { key, valueType: typeof value });
    });

    this.cache.on('del', (key) => {
      logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Cache expired', { key, valueType: typeof value });
    });
  }

  // Generic cache methods
  get<T>(key: string): T | undefined {
    if (!cache.enabled) return undefined;
    
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      logger.debug('Cache hit', { key });
    } else {
      logger.debug('Cache miss', { key });
    }
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (!cache.enabled) return false;
    
    const success = this.cache.set(key, value, ttl || cache.defaultTtl);
    logger.debug('Cache set result', { key, success, ttl });
    return success;
  }

  del(key: string): number {
    if (!cache.enabled) return 0;
    
    const deleted = this.cache.del(key);
    logger.debug('Cache delete result', { key, deleted });
    return deleted;
  }

  // Batch operations
  mget<T>(keys: string[]): Record<string, T> {
    if (!cache.enabled) return {};
    
    const values = this.cache.mget(keys);
    logger.debug('Cache mget', { keys, hits: Object.keys(values).length });
    return values as Record<string, T>;
  }

  mset<T>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    if (!cache.enabled) return false;
    
    const success = this.cache.mset(keyValuePairs);
    logger.debug('Cache mset', { count: keyValuePairs.length, success });
    return success;
  }

  // Pattern-based deletion
  delPattern(pattern: string): number {
    if (!cache.enabled) return 0;
    
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    const matchingKeys = keys.filter(key => regex.test(key));
    
    if (matchingKeys.length > 0) {
      const deleted = this.cache.del(matchingKeys);
      logger.debug('Cache pattern delete', { pattern, deleted });
      return deleted;
    }
    
    return 0;
  }

  // Cache statistics
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }

  // Flush all cache
  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  // Specific cache methods with appropriate TTLs
  getCategories<T>(): T | undefined {
    return this.get<T>(CacheKeys.categories());
  }

  setCategories<T>(value: T): boolean {
    return this.set(CacheKeys.categories(), value, cache.categoriesTtl);
  }

  getProduct<T>(id: string): T | undefined {
    return this.get<T>(CacheKeys.product(id));
  }

  setProduct<T>(id: string, value: T): boolean {
    return this.set(CacheKeys.product(id), value, cache.productsTtl);
  }

  getProducts<T>(filters: Record<string, any>): T | undefined {
    return this.get<T>(CacheKeys.products(filters));
  }

  setProducts<T>(filters: Record<string, any>, value: T): boolean {
    return this.set(CacheKeys.products(filters), value, cache.productsTtl);
  }

  getProductsPaginated<T>(filters: Record<string, any>, page: number, limit: number): T | undefined {
    return this.get<T>(CacheKeys.productsPaginated(filters, page, limit));
  }

  setProductsPaginated<T>(filters: Record<string, any>, page: number, limit: number, value: T): boolean {
    return this.set(CacheKeys.productsPaginated(filters, page, limit), value, cache.productsTtl);
  }

  getProductStats<T>(): T | undefined {
    return this.get<T>(CacheKeys.productStats());
  }

  setProductStats<T>(value: T): boolean {
    return this.set(CacheKeys.productStats(), value, cache.statsTtl);
  }

  getSalesAnalytics<T>(params: Record<string, any>): T | undefined {
    return this.get<T>(CacheKeys.salesAnalytics(params));
  }

  setSalesAnalytics<T>(params: Record<string, any>, value: T): boolean {
    return this.set(CacheKeys.salesAnalytics(params), value, cache.analyticsTtl);
  }

  getRevenueReport<T>(params: Record<string, any>): T | undefined {
    return this.get<T>(CacheKeys.revenueReport(params));
  }

  setRevenueReport<T>(params: Record<string, any>, value: T): boolean {
    return this.set(CacheKeys.revenueReport(params), value, cache.analyticsTtl);
  }

  getProductPerformance<T>(params: Record<string, any>): T | undefined {
    return this.get<T>(CacheKeys.productPerformance(params));
  }

  setProductPerformance<T>(params: Record<string, any>, value: T): boolean {
    return this.set(CacheKeys.productPerformance(params), value, cache.analyticsTtl);
  }

  getInventoryReport<T>(): T | undefined {
    return this.get<T>(CacheKeys.inventoryReport());
  }

  setInventoryReport<T>(value: T): boolean {
    return this.set(CacheKeys.inventoryReport(), value, cache.analyticsTtl);
  }

  getCustomerAnalytics<T>(params: Record<string, any>): T | undefined {
    return this.get<T>(CacheKeys.customerAnalytics(params));
  }

  setCustomerAnalytics<T>(params: Record<string, any>, value: T): boolean {
    return this.set(CacheKeys.customerAnalytics(params), value, cache.analyticsTtl);
  }

  getWishlist<T>(userId: string): T | undefined {
    return this.get<T>(CacheKeys.wishlist(userId));
  }

  setWishlist<T>(userId: string, value: T): boolean {
    return this.set(CacheKeys.wishlist(userId), value, cache.defaultTtl);
  }

  // Cache invalidation methods
  invalidateProduct(id: string): void {
    this.del(CacheKeys.product(id));
    this.delPattern('products:.*'); // Invalidate all product lists
    this.delPattern('stats:.*'); // Invalidate stats
    this.delPattern('analytics:.*'); // Invalidate analytics
    logger.info('Product cache invalidated', { productId: id });
  }

  invalidateCategory(id: string): void {
    this.del(CacheKeys.category(id));
    this.del(CacheKeys.categories());
    this.delPattern('products:.*'); // Invalidate all product lists
    logger.info('Category cache invalidated', { categoryId: id });
  }

  invalidateOrders(): void {
    this.delPattern('orders:.*');
    this.delPattern('analytics:.*'); // Invalidate analytics
    logger.info('Orders cache invalidated');
  }

  invalidateProductCache(): void {
    this.delPattern('products:.*'); // Invalidate all product lists and individual products
    this.delPattern('stats:.*'); // Invalidate stats
    this.delPattern('analytics:.*'); // Invalidate analytics
    logger.info('Product cache invalidated');
  }

  invalidateWishlist(userId: string): void {
    this.del(CacheKeys.wishlist(userId));
    logger.info('Wishlist cache invalidated', { userId });
  }

  invalidateAll(): void {
    this.flush();
    logger.info('All cache invalidated');
  }

  // Additional methods that are being called
  flushAll(): void {
    this.flush();
  }

  invalidateCache(pattern: string): number {
    return this.delPattern(pattern);
  }

  getCategoryBySlug<T>(slug: string): T | undefined {
    return this.get<T>(CacheKeys.categoryBySlug(slug));
  }

  setCategoryBySlug<T>(slug: string, value: T): boolean {
    return this.set(CacheKeys.categoryBySlug(slug), value, cache.categoriesTtl);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
