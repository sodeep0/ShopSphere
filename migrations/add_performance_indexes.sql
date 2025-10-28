-- Performance optimization indexes for ShopSphere
-- Run this migration to improve query performance

-- Products table indexes
-- Composite index for category filtering with active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active 
ON products(category_id, is_active) 
WHERE is_active = true;

-- Index for active products ordered by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created 
ON products(is_active, created_at DESC) 
WHERE is_active = true;

-- Index for product search (name and description)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('english', name || ' ' || description))
WHERE is_active = true;

-- Index for stock filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock 
ON products(stock) 
WHERE is_active = true AND stock > 0;

-- Orders table indexes
-- Index for orders by creation date (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Index for customer phone lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_phone 
ON orders(customer_phone);

-- Index for user-specific orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id 
ON orders(user_id) 
WHERE user_id IS NOT NULL;

-- Index for order status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics 
ON orders(created_at, status, total);

-- Order items table indexes
-- Index for order items by order (for order details)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Index for product performance analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_analytics 
ON order_items(product_id, quantity);

-- Wishlist table indexes
-- Composite index for user wishlist queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_user_product 
ON wishlists(user_id, product_id);

-- Index for product popularity (reverse lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_product_id 
ON wishlists(product_id);

-- Categories table indexes
-- Index for active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active 
ON categories(is_active) 
WHERE is_active = true;

-- Index for category slug lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories(slug) 
WHERE is_active = true;

-- Users table indexes
-- Index for email lookups (authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for user role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- Additional composite indexes for common query patterns
-- Products by category and price range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_price 
ON products(category_id, price) 
WHERE is_active = true;

-- Orders by date range and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_date_status 
ON orders(created_at, status);

-- Analytics: Orders with items for revenue calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_revenue_analytics 
ON orders(created_at, total, status) 
WHERE status IN ('confirmed', 'delivered');

-- Comments for documentation
COMMENT ON INDEX idx_products_category_active IS 'Optimizes category filtering with active status check';
COMMENT ON INDEX idx_products_active_created IS 'Optimizes product listing by creation date';
COMMENT ON INDEX idx_products_search IS 'Enables full-text search on product names and descriptions';
COMMENT ON INDEX idx_orders_created_at IS 'Optimizes order listing by creation date';
COMMENT ON INDEX idx_orders_customer_phone IS 'Optimizes customer order lookups';
COMMENT ON INDEX idx_wishlists_user_product IS 'Optimizes user wishlist queries';
COMMENT ON INDEX idx_categories_slug IS 'Optimizes category slug lookups';
