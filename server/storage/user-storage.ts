import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { users, orders, orderItems } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import type { User, InsertUser } from "@shared/schema";

export class UserStorage extends BaseStorage {
  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  async getUser(id: string): Promise<User | undefined> {
    const startTime = Date.now();
    
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      this.logPerformance('getUser', startTime, { userId: id, found: !!user });
      return user || undefined;
    } catch (error) {
      this.handleError('getUser', error);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const startTime = Date.now();
    
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      this.logPerformance('getUserByEmail', startTime, { email, found: !!user });
      return user || undefined;
    } catch (error) {
      this.handleError('getUserByEmail', error);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const startTime = Date.now();
    
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          role: insertUser.role || 'customer',
        })
        .returning();
      
      this.logPerformance('createUser', startTime, { userId: user.id, email: user.email });
      this.logger?.business('User created', { userId: user.id, email: user.email, role: user.role });
      
      return user;
    } catch (error) {
      this.handleError('createUser', error);
    }
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const startTime = Date.now();
    
    try {
      const [user] = await db
        .update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      this.logPerformance('updateUser', startTime, { userId: id, updated: !!user });
      
      if (user) {
        this.logger?.business('User updated', { userId: id, fields: Object.keys(updateData) });
      }
      
      return user || undefined;
    } catch (error) {
      this.handleError('updateUser', error);
    }
  }

  async getOrdersByUser(userId: string): Promise<(typeof orders.$inferSelect & { items: typeof orderItems.$inferSelect[] })[]> {
    const startTime = Date.now();
    
    try {
      const ordersWithItems = await db
        .select({
          order: orders,
          item: orderItems,
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.userId, userId))
        .orderBy(sql`${orders.createdAt} DESC`);

      // Group items by order
      const orderMap = new Map<string, typeof orders.$inferSelect & { items: typeof orderItems.$inferSelect[] }>();

      ordersWithItems.forEach(({ order, item }) => {
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, { ...order, items: [] });
        }
        if (item) {
          orderMap.get(order.id)!.items.push(item);
        }
      });

      const result = Array.from(orderMap.values());
      this.logPerformance('getOrdersByUser', startTime, { userId, orderCount: result.length });
      
      return result;
    } catch (error) {
      this.handleError('getOrdersByUser', error);
    }
  }
}
