import { pgTable, foreignKey, varchar, text, numeric, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const orders = pgTable("orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	customerName: text("customer_name").notNull(),
	customerPhone: text("customer_phone").notNull(),
	customerEmail: text("customer_email"),
	district: text().notNull(),
	road: text().notNull(),
	additionalLandmark: text("additional_landmark"),
	specialInstructions: text("special_instructions"),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
]);

export const orderItems = pgTable("order_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	productId: varchar("product_id").notNull(),
	productName: text("product_name").notNull(),
	productPrice: numeric("product_price", { precision: 10, scale:  2 }).notNull(),
	quantity: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	image: text().notNull(),
	stock: integer().default(0).notNull(),
	categoryId: varchar("category_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	phone: text(),
	role: text().default('customer').notNull(),
	district: text(),
	road: text(),
	additionalLandmark: text("additional_landmark"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const categories = pgTable("categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	icon: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const wishlists = pgTable("wishlists", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	productId: varchar("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlists_product_id_products_id_fk"
		}),
	unique("wishlists_user_id_product_id_unique").on(table.userId, table.productId),
]);
