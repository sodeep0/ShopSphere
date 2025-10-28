import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { wishlists, products } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import type { Wishlist, InsertWishlist, Product } from "@shared/schema";

export class WishlistStorage extends BaseStorage {
  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  async getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getWishlist<(Wishlist & { product: Product })[]>(userId);
      if (cached) {
        this.logPerformance('getWishlist (cached)', startTime, { userId, count: cached.length });
        return cached;
      }

      const rows = await db
        .select({ wl: wishlists, product: products })
        .from(wishlists)
        .leftJoin(products, eq(wishlists.productId, products.id))
        .where(eq(wishlists.userId, userId));

      const result = rows
        .filter(r => !!r.product)
        .map(r => ({ ...r.wl, product: r.product! }));

      // Cache the result
      this.cacheService?.setWishlist(userId, result);

      this.logPerformance('getWishlist', startTime, { userId, count: result.length });
      return result;
    } catch (error) {
      this.handleError('getWishlist', error);
    }
  }

  async addToWishlist(data: InsertWishlist): Promise<Wishlist> {
    const startTime = Date.now();
    
    try {
      const [wl] = await db
        .insert(wishlists)
        .values(data)
        .onConflictDoNothing()
        .returning();

      // If conflict, fetch existing
      if (!wl) {
        const [existing] = await db
          .select()
          .from(wishlists)
          .where(and(eq(wishlists.userId, data.userId), eq(wishlists.productId, data.productId)));
        
        // Invalidate cache
        this.cacheService?.invalidateWishlist(data.userId);
        
        this.logPerformance('addToWishlist (existing)', startTime, { userId: data.userId, productId: data.productId });
        return existing as unknown as Wishlist;
      }

      // Invalidate cache
      this.cacheService?.invalidateWishlist(data.userId);
      
      this.logPerformance('addToWishlist', startTime, { userId: data.userId, productId: data.productId });
      this.logger?.business('Item added to wishlist', { userId: data.userId, productId: data.productId });
      
      return wl;
    } catch (error) {
      this.handleError('addToWishlist', error);
    }
  }

  async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

      const deleted = (result.rowCount || 0) > 0;

      // Invalidate cache
      if (deleted) {
        this.cacheService?.invalidateWishlist(userId);
        this.logger?.business('Item removed from wishlist', { userId, productId });
      }

      this.logPerformance('removeFromWishlist', startTime, { userId, productId, deleted });
      return deleted;
    } catch (error) {
      this.handleError('removeFromWishlist', error);
    }
  }
}
