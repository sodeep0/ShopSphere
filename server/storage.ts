// Legacy wrapper for backward compatibility
// This file maintains the old storage.ts interface while delegating to the new modular structure

import { storage } from "./storage/index";

// Re-export everything from the new storage system
export { storage };
export * from "./storage/index";
export * from "./storage/base-storage";
export * from "./storage/user-storage";
export * from "./storage/category-storage";
export * from "./storage/product-storage";
export * from "./storage/order-storage";
export * from "./storage/analytics-storage";
export * from "./storage/wishlist-storage";

// Default export for backward compatibility
export default storage;
