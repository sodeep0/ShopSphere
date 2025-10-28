import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems, products } from "@shared/schema";
import { BaseStorage } from "./base-storage";
import { Logger } from "../utils/logger";
import { CacheService } from "../utils/cache";
import type { Order, InsertOrder, OrderItem, InsertOrderItem, OrderWithItems } from "@shared/schema";

export class OrderStorage extends BaseStorage {
  setDependencies(logger: Logger, cacheService: CacheService): void {
    super.setDependencies(logger, cacheService);
  }

  async createOrder(orderData: OrderWithItems): Promise<Order> {
    const startTime = Date.now();
    
    try {
      const result = await db.transaction(async (tx) => {
        // Calculate total
        let total = 0;
        const orderItemsData: InsertOrderItem[] = [];

        this.logger?.business('Starting transaction for order creation', { 
          itemCount: orderData.items.length,
          customerName: orderData.customerName
        });

        for (const item of orderData.items) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }
          
          // Check stock
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          const itemTotal = product.price * item.quantity;
          total += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            productName: product.name,
            productPrice: product.price.toString(),
            quantity: item.quantity,
            orderId: '', // Will be set after order creation
          });

          // Decrement stock - Use explicit calculation instead of SQL expression
          const newStock = product.stock - item.quantity;
          const updateResult = await tx
            .update(products)
            .set({
              stock: newStock,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId))
            .returning({ id: products.id, stock: products.stock });
          
          this.logger?.business('Stock updated', { 
            productId: item.productId, 
            productName: product.name,
            oldStock: product.stock,
            quantityOrdered: item.quantity,
            newStock: updateResult[0]?.stock,
            rowsAffected: updateResult.length,
            calculatedNewStock: newStock
          });

          // Verify the update worked
          if (updateResult.length === 0) {
            throw new Error(`Failed to update stock for product ${item.productId}`);
          }
          
          if (updateResult[0]?.stock !== newStock) {
            throw new Error(`Stock update mismatch for product ${item.productId}. Expected: ${newStock}, Got: ${updateResult[0]?.stock}`);
          }
        }

        // Create order
        const [order] = await tx
          .insert(orders)
          .values({
            userId: orderData.userId || null,
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

        this.logger?.business('Transaction completed successfully', { 
          orderId: order.id,
          itemsProcessed: orderItemsData.length
        });
        
        return order;
      });

      // Invalidate cache
      this.cacheService?.invalidateOrders();
      // Also invalidate product caches since stock was updated
      this.cacheService?.invalidateProductCache();

      this.logPerformance('createOrder', startTime, { orderId: result.id, customerName: result.customerName });
      this.logger?.business('Order created', { 
        orderId: result.id, 
        customerName: result.customerName,
        customerPhone: result.customerPhone,
        total: result.total,
        itemCount: orderData.items.length
      });

      return result;
    } catch (error) {
      this.handleError('createOrder', error);
    }
  }

  async getOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cached = this.cacheService?.get<Order[]>('orders:all');
      if (cached) {
        this.logPerformance('getOrders (cached)', startTime, { count: cached.length });
        return cached as (Order & { items: OrderItem[] })[];
      }

      // Optimized query using SQL aggregation instead of application-level grouping
      const ordersWithItems = await db
        .select({
          order: orders,
          items: sql<OrderItem[]>`json_agg(
            CASE 
              WHEN ${orderItems.id} IS NOT NULL 
              THEN json_build_object(
                'id', ${orderItems.id},
                'orderId', ${orderItems.orderId},
                'productId', ${orderItems.productId},
                'productName', ${orderItems.productName},
                'productPrice', ${orderItems.productPrice},
                'quantity', ${orderItems.quantity}
              )
              ELSE NULL
            END
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL)`
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .groupBy(orders.id)
        .orderBy(sql`${orders.createdAt} DESC`);

      // Transform the result
      const result = ordersWithItems.map(({ order, items }) => ({
        ...order,
        items: items || []
      }));

      // Cache the result
      this.cacheService?.set('orders:all', result, 300); // 5 minutes cache

      this.logPerformance('getOrders', startTime, { count: result.length });
      return result;
    } catch (error) {
      this.handleError('getOrders', error);
    }
  }

  async getOrdersByCustomer(phone: string): Promise<(Order & { items: OrderItem[] })[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cacheKey = `orders:customer:${phone}`;
      const cached = this.cacheService?.get<Order[]>(cacheKey);
      if (cached) {
        this.logPerformance('getOrdersByCustomer (cached)', startTime, { phone, count: cached.length });
        return cached as (Order & { items: OrderItem[] })[];
      }

      // Optimized query using SQL aggregation
      const ordersWithItems = await db
        .select({
          order: orders,
          items: sql<OrderItem[]>`json_agg(
            CASE 
              WHEN ${orderItems.id} IS NOT NULL 
              THEN json_build_object(
                'id', ${orderItems.id},
                'orderId', ${orderItems.orderId},
                'productId', ${orderItems.productId},
                'productName', ${orderItems.productName},
                'productPrice', ${orderItems.productPrice},
                'quantity', ${orderItems.quantity}
              )
              ELSE NULL
            END
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL)`
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.customerPhone, phone))
        .groupBy(orders.id)
        .orderBy(sql`${orders.createdAt} DESC`);

      // Transform the result
      const result = ordersWithItems.map(({ order, items }) => ({
        ...order,
        items: items || []
      }));

      // Cache the result
      this.cacheService?.set(cacheKey, result, 300); // 5 minutes cache

      this.logPerformance('getOrdersByCustomer', startTime, { phone, count: result.length });
      return result;
    } catch (error) {
      this.handleError('getOrdersByCustomer', error);
    }
  }

  async getOrdersByUser(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cacheKey = `orders:user:${userId}`;
      const cached = this.cacheService?.get<Order[]>(cacheKey);
      if (cached) {
        this.logPerformance('getOrdersByUser (cached)', startTime, { userId, count: cached.length });
        return cached as (Order & { items: OrderItem[] })[];
      }

      // Optimized query using SQL aggregation
      const ordersWithItems = await db
        .select({
          order: orders,
          items: sql<OrderItem[]>`json_agg(
            CASE 
              WHEN ${orderItems.id} IS NOT NULL 
              THEN json_build_object(
                'id', ${orderItems.id},
                'orderId', ${orderItems.orderId},
                'productId', ${orderItems.productId},
                'productName', ${orderItems.productName},
                'productPrice', ${orderItems.productPrice},
                'quantity', ${orderItems.quantity}
              )
              ELSE NULL
            END
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL)`
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.userId, userId))
        .groupBy(orders.id)
        .orderBy(sql`${orders.createdAt} DESC`);

      // Transform the result
      const result = ordersWithItems.map(({ order, items }) => ({
        ...order,
        items: items || []
      }));

      // Cache the result
      this.cacheService?.set(cacheKey, result, 300); // 5 minutes cache

      this.logPerformance('getOrdersByUser', startTime, { userId, count: result.length });
      return result;
    } catch (error) {
      this.handleError('getOrdersByUser', error);
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const startTime = Date.now();
    
    try {
      const [order] = await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();

      // Invalidate cache
      if (order) {
        this.cacheService?.invalidateOrders();
        this.logger?.business('Order status updated', { orderId: id, status });
      }

      this.logPerformance('updateOrderStatus', startTime, { orderId: id, status, updated: !!order });
      return order || undefined;
    } catch (error) {
      this.handleError('updateOrderStatus', error);
    }
  }
}
