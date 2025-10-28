import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { categories, products } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import type { Category, InsertCategory } from "@shared/schema";

export class CategoryStorage extends BaseStorage {
  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  async getCategories(): Promise<Category[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cacheKey = 'categories:all';
      const cached = this.cacheService?.getCategories();
      if (cached) {
        this.logPerformance('getCategories (cached)', startTime, { count: cached.length });
        return cached;
      }

      const categoriesList = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(categories.name);

      // Cache the result
      this.cacheService?.setCategories(categoriesList);
      
      this.logPerformance('getCategories', startTime, { count: categoriesList.length });
      return categoriesList;
    } catch (error) {
      this.handleError('getCategories', error);
    }
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const startTime = Date.now();
    
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      this.logPerformance('getCategory', startTime, { categoryId: id, found: !!category });
      return category || undefined;
    } catch (error) {
      this.handleError('getCategory', error);
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cacheKey = `category:slug:${slug}`;
      const cached = this.cacheService?.get(cacheKey) as Category | undefined;
      if (cached) {
        this.logPerformance('getCategoryBySlug (cached)', startTime, { slug, found: true });
        return cached;
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug));

      // Cache the result
      if (category) {
        this.cacheService?.set(cacheKey, category, 3600); // 1 hour cache
      }

      this.logPerformance('getCategoryBySlug', startTime, { slug, found: !!category });
      return category || undefined;
    } catch (error) {
      this.handleError('getCategoryBySlug', error);
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const startTime = Date.now();
    
    try {
      const [category] = await db
        .insert(categories)
        .values(insertCategory)
        .returning();

      // Invalidate cache
      this.cacheService?.invalidateCategory(category.id);
      
      this.logPerformance('createCategory', startTime, { categoryId: category.id, name: category.name });
      this.logger?.business('Category created', { categoryId: category.id, name: category.name, slug: category.slug });
      
      return category;
    } catch (error) {
      this.handleError('createCategory', error);
    }
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const startTime = Date.now();
    
    try {
      const [category] = await db
        .update(categories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();

      // Invalidate cache
      if (category) {
        this.cacheService?.invalidateCategory(id);
        this.logger?.business('Category updated', { categoryId: id, fields: Object.keys(updates) });
      }

      this.logPerformance('updateCategory', startTime, { categoryId: id, updated: !!category });
      return category || undefined;
    } catch (error) {
      this.handleError('updateCategory', error);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Check if any products use this category
      const [productsUsingCategory] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, id));
        
      if (productsUsingCategory.count > 0) {
        this.logPerformance('deleteCategory', startTime, { categoryId: id, blocked: true, reason: 'has_products' });
        return false; // Cannot delete category that has products
      }

      const result = await db.delete(categories).where(eq(categories.id, id));
      const deleted = (result.rowCount ?? 0) > 0;

      // Invalidate cache
      if (deleted) {
        this.cacheService?.invalidateCategory(id);
        this.logger?.business('Category deleted', { categoryId: id });
      }

      this.logPerformance('deleteCategory', startTime, { categoryId: id, deleted });
      return deleted;
    } catch (error) {
      this.handleError('deleteCategory', error);
    }
  }

  async clearAllCategories(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      await db.delete(categories);
      
      // Invalidate all category cache
      this.cacheService?.invalidateCache('category:.*');
      this.cacheService?.invalidateCache('categories:.*');
      
      this.logPerformance('clearAllCategories', startTime);
      this.logger?.info('All categories cleared successfully');
      return true;
    } catch (error) {
      this.logger?.error('Error clearing categories', error);
      return false;
    }
  }
}
