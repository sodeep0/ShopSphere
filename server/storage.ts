import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem[]> = new Map();

  constructor() {
    // Seed admin user
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      email: "admin@krishakrafts.com",
      password: "$2b$10$6vVzNzNzNzNzNzNzNzNzNu", // hashed "admin123"
      name: "Admin User",
      phone: "9841234567",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminId, admin);

    // Seed some sample products
    this.seedProducts();
  }

  private seedProducts() {
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

    sampleProducts.forEach(product => {
      const id = randomUUID();
      const fullProduct: Product = {
        ...product,
        id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.set(id, fullProduct);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProducts(filters?: { category?: string; inStock?: boolean; search?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values()).filter(p => p.isActive);
    
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    
    if (filters?.inStock) {
      products = products.filter(p => p.stock > 0);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    return products.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated: Product = {
      ...product,
      ...updateData,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updated: Product = {
      ...product,
      isActive: false,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return true;
  }

  async bulkCreateProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    const products: Product[] = [];
    
    for (const insertProduct of insertProducts) {
      const id = randomUUID();
      const product: Product = {
        ...insertProduct,
        id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.set(id, product);
      products.push(product);
    }
    
    return products;
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const product = this.products.get(productId);
    if (!product || product.stock < quantity) return false;
    
    const updated: Product = {
      ...product,
      stock: product.stock - quantity,
      updatedAt: new Date(),
    };
    this.products.set(productId, updated);
    return true;
  }

  async createOrder(orderData: OrderWithItems): Promise<Order> {
    const orderId = randomUUID();
    
    // Calculate total
    let total = 0;
    const items: OrderItem[] = [];
    
    for (const item of orderData.items) {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      
      const itemTotal = parseFloat(product.price) * item.quantity;
      total += itemTotal;
      
      const orderItem: OrderItem = {
        id: randomUUID(),
        orderId,
        productId: item.productId,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
      };
      items.push(orderItem);
      
      // Decrement stock
      await this.decrementStock(item.productId, item.quantity);
    }
    
    const order: Order = {
      id: orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      province: orderData.province,
      district: orderData.district,
      municipality: orderData.municipality,
      ward: orderData.ward,
      detailedAddress: orderData.detailedAddress,
      postalCode: orderData.postalCode,
      specialInstructions: orderData.specialInstructions,
      total: total.toFixed(2),
      status: "pending",
      createdAt: new Date(),
    };
    
    this.orders.set(orderId, order);
    this.orderItems.set(orderId, items);
    
    return order;
  }

  async getOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    return Array.from(this.orders.values()).map(order => ({
      ...order,
      items: this.orderItems.get(order.id) || []
    })).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getOrdersByCustomer(phone: string): Promise<(Order & { items: OrderItem[] })[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerPhone === phone)
      .map(order => ({
        ...order,
        items: this.orderItems.get(order.id) || []
      }))
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  async getProductStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    categories: number;
    totalValue: string;
  }> {
    const activeProducts = Array.from(this.products.values()).filter(p => p.isActive);
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

export const storage = new MemStorage();
