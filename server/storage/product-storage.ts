import { eq, and, like, sql } from "drizzle-orm";
import { db } from "../db";
import { products, categories } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import type { Product, InsertProduct } from "@shared/schema";

export class ProductStorage extends BaseStorage {
  private categorySlugCache = new Map<string, string>(); // slug -> id mapping

  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  // Optimized category lookup with caching
  private async resolveCategorySlug(slug: string): Promise<string | null> {
    // Check local cache first
    if (this.categorySlugCache.has(slug)) {
      return this.categorySlugCache.get(slug)!;
    }

    // Check Redis cache
    const cached = this.cacheService?.getCategoryBySlug(slug);
    if (cached) {
      this.categorySlugCache.set(slug, cached.id);
      return cached.id;
    }

    // Query database
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug));

    if (category) {
      this.categorySlugCache.set(slug, category.id);
      return category.id;
    }

    return null;
  }

  async getProducts(filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }): Promise<Product[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      if (filters) {
        const cached = this.cacheService?.getProducts(filters);
        if (cached) {
          this.logPerformance('getProducts (cached)', startTime, { filters, count: cached.length });
          return cached;
        }
      }

      const conditions = [eq(products.isActive, true)];
      
      // Optimized category filtering
      if (filters?.category) {
        const categoryId = await this.resolveCategorySlug(filters.category);
        if (categoryId) {
          conditions.push(eq(products.categoryId, categoryId));
        } else {
          // Category not found, return empty result
          this.logPerformance('getProducts', startTime, { filters, count: 0, reason: 'category_not_found' });
          return [];
        }
      }
      
      if (filters?.inStock) {
        conditions.push(sql`${products.stock} > 0`);
      }
      
      if (filters?.search) {
        conditions.push(
          sql`(${products.name} ILIKE ${'%' + filters.search + '%'} OR ${products.description} ILIKE ${'%' + filters.search + '%'})`
        );
      }

      // Determine sorting
      let orderBy = sql`${products.createdAt} DESC`; // Default sort
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low-high':
            orderBy = sql`${products.price}::numeric ASC`;
            break;
          case 'price-high-low':
            orderBy = sql`${products.price}::numeric DESC`;
            break;
          case 'newest':
            orderBy = sql`${products.createdAt} DESC`;
            break;
          case 'oldest':
            orderBy = sql`${products.createdAt} ASC`;
            break;
          default:
            orderBy = sql`${products.createdAt} DESC`;
        }
      }
      
      const result = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(orderBy);

      // Cache the result
      if (filters) {
        this.cacheService?.setProducts(filters, result);
      }

      this.logPerformance('getProducts', startTime, { filters, count: result.length });
      return result;
    } catch (error) {
      this.handleError('getProducts', error);
    }
  }

  async getProductsPaginated(
    filters?: { category?: string; inStock?: boolean; search?: string; sortBy?: string }, 
    page: number = 1, 
    limit: number = 12
  ): Promise<{ items: Product[]; total: number }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      if (filters) {
        const cached = this.cacheService?.getProductsPaginated(filters, page, limit);
        if (cached) {
          this.logPerformance('getProductsPaginated (cached)', startTime, { filters, page, limit, count: cached.items.length });
          return cached;
        }
      }

      const conditions = [eq(products.isActive, true)];
      
      // Optimized category filtering
      if (filters?.category) {
        const categoryId = await this.resolveCategorySlug(filters.category);
        if (categoryId) {
          conditions.push(eq(products.categoryId, categoryId));
        } else {
          // Category not found, return empty result
          this.logPerformance('getProductsPaginated', startTime, { filters, page, limit, count: 0, reason: 'category_not_found' });
          return { items: [], total: 0 };
        }
      }
      
      if (filters?.inStock) {
        conditions.push(sql`${products.stock} > 0`);
      }
      
      if (filters?.search) {
        conditions.push(
          sql`(${products.name} ILIKE ${'%' + filters.search + '%'} OR ${products.description} ILIKE ${'%' + filters.search + '%'})`
        );
      }

      // Determine sorting
      let orderBy = sql`${products.createdAt} DESC`;
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low-high':
            orderBy = sql`${products.price}::numeric ASC`;
            break;
          case 'price-high-low':
            orderBy = sql`${products.price}::numeric DESC`;
            break;
          case 'newest':
            orderBy = sql`${products.createdAt} DESC`;
            break;
          case 'oldest':
            orderBy = sql`${products.createdAt} ASC`;
            break;
          default:
            orderBy = sql`${products.createdAt} DESC`;
        }
      }
      
      // Get total count
      const totalRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));
      const total = Number((totalRows[0] as any).count || 0);

      // Ensure sane pagination values
      const safeLimit = Math.max(1, Math.min(100, limit || 12));
      const safePage = Math.max(1, page || 1);
      const offset = (safePage - 1) * safeLimit;

      const rows = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(safeLimit)
        .offset(offset);

      const result = { items: rows, total };

      // Cache the result
      if (filters) {
        this.cacheService?.setProductsPaginated(filters, page, limit, result);
      }

      this.logPerformance('getProductsPaginated', startTime, { filters, page, limit, count: rows.length, total });
      return result;
    } catch (error) {
      this.handleError('getProductsPaginated', error);
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getProduct(id);
      if (cached) {
        this.logPerformance('getProduct (cached)', startTime, { productId: id });
        return cached;
      }

      const [product] = await db.select().from(products).where(eq(products.id, id));
      
      // Cache the result
      if (product) {
        this.cacheService?.setProduct(id, product);
      }

      this.logPerformance('getProduct', startTime, { productId: id, found: !!product });
      return product || undefined;
    } catch (error) {
      this.handleError('getProduct', error);
    }
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const startTime = Date.now();
    
    try {
      const [product] = await db
        .insert(products)
        .values({
          ...insertProduct,
          stock: insertProduct.stock || 0,
          price: insertProduct.price,
        })
        .returning();

      // Invalidate cache
      this.cacheService?.invalidateProduct(product.id);
      
      this.logPerformance('createProduct', startTime, { productId: product.id, name: product.name });
      this.logger?.business('Product created', { productId: product.id, name: product.name, categoryId: product.categoryId });
      
      return product;
    } catch (error) {
      this.handleError('createProduct', error);
    }
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const startTime = Date.now();
    
    try {
      const updateValues: any = {
        ...updateData,
        updatedAt: new Date(),
      };
      
      const [product] = await db
        .update(products)
        .set(updateValues)
        .where(eq(products.id, id))
        .returning();

      // Invalidate cache
      if (product) {
        this.cacheService?.invalidateProduct(id);
        this.logger?.business('Product updated', { productId: id, fields: Object.keys(updateData) });
      }

      this.logPerformance('updateProduct', startTime, { productId: id, updated: !!product });
      return product || undefined;
    } catch (error) {
      this.handleError('updateProduct', error);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, id));

      const deleted = (result.rowCount || 0) > 0;

      // Invalidate cache
      if (deleted) {
        this.cacheService?.invalidateProduct(id);
        this.logger?.business('Product deleted', { productId: id });
      }

      this.logPerformance('deleteProduct', startTime, { productId: id, deleted });
      return deleted;
    } catch (error) {
      this.handleError('deleteProduct', error);
    }
  }

  async bulkCreateProducts(productsData: InsertProduct[]): Promise<Product[]> {
    const startTime = Date.now();
    
    try {
      const result = await db
        .insert(products)
        .values(productsData.map(p => ({
          ...p,
          stock: p.stock || 0,
        })))
        .returning();

      // Invalidate cache
      this.cacheService?.invalidateCache('products:.*');
      this.cacheService?.invalidateCache('stats:.*');

      this.logPerformance('bulkCreateProducts', startTime, { count: result.length });
      this.logger?.business('Products bulk created', { count: result.length });
      
      return result;
    } catch (error) {
      this.handleError('bulkCreateProducts', error);
    }
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
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

      const updated = (result.rowCount || 0) > 0;

      // Invalidate cache
      if (updated) {
        this.cacheService?.invalidateProduct(productId);
        this.cacheService?.invalidateCache('stats:.*');
      }

      this.logPerformance('decrementStock', startTime, { productId, quantity, updated });
      return updated;
    } catch (error) {
      this.handleError('decrementStock', error);
    }
  }

  async clearAllProducts(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      await db.delete(products);
      
      // Invalidate all product cache
      this.cacheService?.invalidateCache('product:.*');
      this.cacheService?.invalidateCache('products:.*');
      this.cacheService?.invalidateCache('stats:.*');
      
      this.logPerformance('clearAllProducts', startTime);
      this.logger?.info('All products cleared successfully');
      return true;
    } catch (error) {
      this.logger?.error('Error clearing products', error);
      return false;
    }
  }
}
