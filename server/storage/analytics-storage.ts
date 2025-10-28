import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems, products, users } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";

export class AnalyticsStorage extends BaseStorage {
  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  async getProductStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    categories: number;
    totalValue: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getProductStats();
      if (cached) {
        this.logPerformance('getProductStats (cached)', startTime);
        return cached;
      }

      const activeProducts = await db.select().from(products).where(eq(products.isActive, true));
      
      const lowStock = activeProducts.filter(p => p.stock < 5).length;
      const categories = new Set(activeProducts.map(p => p.categoryId)).size;
      const totalValue = activeProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
      
      const result = {
        totalProducts: activeProducts.length,
        lowStock,
        categories,
        totalValue: `NPR ${(totalValue / 100000).toFixed(1)}L`
      };

      // Cache the result
      this.cacheService?.setProductStats(result);

      this.logPerformance('getProductStats', startTime, { 
        totalProducts: result.totalProducts,
        lowStock: result.lowStock,
        categories: result.categories
      });
      
      return result;
    } catch (error) {
      this.handleError('getProductStats', error);
    }
  }

  async getSalesAnalytics(params: { from?: Date; to?: Date; interval?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; orders: number; revenue: number }[];
    totals: { orders: number; revenue: number; items: number };
  }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getSalesAnalytics(params);
      if (cached) {
        this.logPerformance('getSalesAnalytics (cached)', startTime, { params });
        return cached;
      }

      const from = params.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year instead of 30 days
      const to = params.to || new Date();
      const interval = params.interval || 'day';

      const dtExpr = interval === 'month'
        ? sql`date_trunc('month', ${orders.createdAt})`
        : interval === 'week'
        ? sql`date_trunc('week', ${orders.createdAt})`
        : sql`date_trunc('day', ${orders.createdAt})`;

      const seriesRows = await db
        .select({
          periodStart: sql<string>`to_char(${dtExpr}, 'YYYY-MM-DD')`,
          ordersCount: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum((${orders.total})::numeric), 0)`
        })
        .from(orders)
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`)
        .groupBy(dtExpr)
        .orderBy(dtExpr);

      const totalsOrders = await db
        .select({
          ordersCount: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum((${orders.total})::numeric), 0)`
        })
        .from(orders)
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`);

      const totalsItems = await db
        .select({ items: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`);

      const totals = {
        orders: (totalsOrders[0]?.ordersCount as number) || 0,
        revenue: Number(totalsOrders[0]?.revenue || 0),
        items: (totalsItems[0]?.items as number) || 0,
      };

      const series = seriesRows.map(r => ({
        periodStart: r.periodStart as unknown as string,
        orders: r.ordersCount as number,
        revenue: Number(r.revenue || 0),
      }));

      const result = { series, totals };

      // Cache the result
      this.cacheService?.setSalesAnalytics(params, result);

      this.logPerformance('getSalesAnalytics', startTime, { 
        params, 
        seriesCount: series.length,
        totalOrders: totals.orders,
        totalRevenue: totals.revenue
      });

      return result;
    } catch (error) {
      this.handleError('getSalesAnalytics', error);
    }
  }

  async getRevenueReport(params: { from?: Date; to?: Date; groupBy?: 'day' | 'week' | 'month' }): Promise<{
    series: { periodStart: string; revenue: number }[];
    totalRevenue: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getRevenueReport(params);
      if (cached) {
        this.logPerformance('getRevenueReport (cached)', startTime, { params });
        return cached;
      }

      const from = params.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year instead of 30 days
      const to = params.to || new Date();
      const groupBy = params.groupBy || 'month';
      const dtExpr = groupBy === 'month'
        ? sql`date_trunc('month', ${orders.createdAt})`
        : groupBy === 'week'
        ? sql`date_trunc('week', ${orders.createdAt})`
        : sql`date_trunc('day', ${orders.createdAt})`;

      const rows = await db
        .select({
          periodStart: sql<string>`to_char(${dtExpr}, 'YYYY-MM-DD')`,
          revenue: sql<number>`coalesce(sum((${orders.total})::numeric), 0)`
        })
        .from(orders)
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`)
        .groupBy(dtExpr)
        .orderBy(dtExpr);

      const totalRows = await db
        .select({ total: sql<number>`coalesce(sum((${orders.total})::numeric), 0)` })
        .from(orders)
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`);

      const result = {
        series: rows.map(r => ({ periodStart: r.periodStart as unknown as string, revenue: Number(r.revenue || 0) })),
        totalRevenue: Number(totalRows[0]?.total || 0),
      };

      // Cache the result
      this.cacheService?.setRevenueReport(params, result);

      this.logPerformance('getRevenueReport', startTime, { 
        params, 
        seriesCount: result.series.length,
        totalRevenue: result.totalRevenue
      });

      return result;
    } catch (error) {
      this.handleError('getRevenueReport', error);
    }
  }

  async getProductPerformance(params: { from?: Date; to?: Date; limit?: number }): Promise<Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
    stock: number;
  }>> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getProductPerformance(params);
      if (cached) {
        this.logPerformance('getProductPerformance (cached)', startTime, { params });
        return cached;
      }

      const from = params.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year instead of 30 days
      const to = params.to || new Date();
      const limit = params.limit || 10;

      const rows = await db
        .select({
          productId: orderItems.productId,
          name: products.name,
          totalSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
          revenue: sql<number>`coalesce(sum(${orderItems.quantity} * (${orderItems.productPrice})::numeric), 0)`,
          stock: products.stock,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`)
        .groupBy(orderItems.productId, products.name, products.stock)
        .orderBy(sql`sum(${orderItems.quantity}) DESC`)
        .limit(limit);

      const result = rows.map(r => ({
        productId: r.productId,
        name: r.name,
        totalSold: Number(r.totalSold || 0),
        revenue: Number(r.revenue || 0),
        stock: r.stock,
      }));

      // Cache the result
      this.cacheService?.setProductPerformance(params, result);

      this.logPerformance('getProductPerformance', startTime, { 
        params, 
        count: result.length
      });

      return result;
    } catch (error) {
      this.handleError('getProductPerformance', error);
    }
  }

  async getInventoryReport(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{ id: string; name: string; stock: number }>;
  }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getInventoryReport();
      if (cached) {
        this.logPerformance('getInventoryReport (cached)', startTime);
        return cached;
      }

      const all = await db.select().from(products).where(eq(products.isActive, true));
      const lowStockItems = all.filter(p => p.stock > 0 && p.stock < 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }));
      const outOfStockCount = all.filter(p => p.stock <= 0).length;
      
      const result = {
        totalProducts: all.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount,
        lowStockItems,
      };

      // Cache the result
      this.cacheService?.setInventoryReport(result);

      this.logPerformance('getInventoryReport', startTime, { 
        totalProducts: result.totalProducts,
        lowStockCount: result.lowStockCount,
        outOfStockCount: result.outOfStockCount
      });

      return result;
    } catch (error) {
      this.handleError('getInventoryReport', error);
    }
  }

  async getCustomerAnalytics(params: { from?: Date; to?: Date; limit?: number }): Promise<{
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{ userId: string | null; name: string | null; phone: string; orders: number; spend: number }>;
  }> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.getCustomerAnalytics(params);
      if (cached) {
        this.logPerformance('getCustomerAnalytics (cached)', startTime, { params });
        return cached;
      }

      const from = params.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year instead of 90 days
      const to = params.to || new Date();
      const limit = params.limit || 10;

      const totals = await db
        .select({
          totalCustomers: sql<number>`count(distinct ${orders.customerPhone})`,
        })
        .from(orders)
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`);

      const newCustomersRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(sql`(
          select distinct o.customer_phone
          from orders o
          where o.created_at between ${from} and ${to}
            and not exists (
              select 1 from orders o2
              where o2.customer_phone = o.customer_phone
                and o2.created_at < ${from}
            )
        ) as sub` as any);

      const returningCustomersRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(sql`(
          select distinct o.customer_phone
          from orders o
          where o.created_at between ${from} and ${to}
            and exists (
              select 1 from orders o2
              where o2.customer_phone = o.customer_phone
                and o2.created_at < ${from}
            )
        ) as sub` as any);

      const topCustomers = await db
        .select({
          userId: orders.userId,
          name: sql<string | null>`max(${users.name})`,
          phone: orders.customerPhone,
          ordersCount: sql<number>`count(distinct ${orders.id})`,
          spend: sql<number>`coalesce(sum(${orderItems.quantity} * (${orderItems.productPrice})::numeric), 0)`
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .leftJoin(users, eq(users.id, orders.userId))
        .where(sql`${orders.createdAt} BETWEEN ${from} AND ${to}`)
        .groupBy(orders.userId, orders.customerPhone)
        .orderBy(sql`sum(${orderItems.quantity}) DESC`)
        .limit(limit);

      const result = {
        totalCustomers: Number(totals[0]?.totalCustomers || 0),
        newCustomers: Number(newCustomersRow[0]?.count || 0),
        returningCustomers: Number(returningCustomersRow[0]?.count || 0),
        topCustomers: topCustomers.map(tc => ({
          userId: tc.userId || null,
          name: (tc as any).name || null,
          phone: tc.phone,
          orders: Number(tc.ordersCount || 0),
          spend: Number(tc.spend || 0),
        })),
      };

      // Cache the result
      this.cacheService?.setCustomerAnalytics(params, result);

      this.logPerformance('getCustomerAnalytics', startTime, { 
        params, 
        totalCustomers: result.totalCustomers,
        newCustomers: result.newCustomers,
        returningCustomers: result.returningCustomers,
        topCustomersCount: result.topCustomers.length
      });

      return result;
    } catch (error) {
      this.handleError('getCustomerAnalytics', error);
    }
  }
}
