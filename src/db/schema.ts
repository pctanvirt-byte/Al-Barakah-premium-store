import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users Table ---
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 32 }),
  role: varchar('role', { length: 32 }).default('customer').notNull(), // 'customer', 'admin', 'super_admin'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Categories Table ---
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull().unique(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// --- Products Table ---
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }),
  stockCount: integer('stock_count').default(0).notNull(),
  inStock: boolean('in_stock').default(true).notNull(),
  badge: varchar('badge', { length: 32 }), // 'BESTSELLER', 'HOT', 'SALE', 'NEW'
  image: text('image').notNull(),
  images: jsonb('images').$type<string[]>().default([]).notNull(),
  colors: jsonb('colors').$type<{ name: string; hex: string }[]>().default([]).notNull(),
  sizes: jsonb('sizes').$type<string[]>().default([]).notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('5.00').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// --- Coupons Table ---
export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  usageLimit: integer('usage_limit'),
  timesUsed: integer('times_used').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Orders Table ---
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingCode: varchar('tracking_code', { length: 64 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  cityDistrict: varchar('city_district', { length: 128 }).notNull(),
  subtotalAmount: numeric('subtotal_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 8 }).default('BDT').notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // 'COD', 'BKASH', 'NAGAD', 'CARD'
  paymentStatus: varchar('payment_status', { length: 32 }).default('UNPAID').notNull(), // 'UNPAID', 'PAID', 'REFUNDED'
  orderStatus: varchar('order_status', { length: 32 }).default('PENDING').notNull(), // 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  couponCode: varchar('coupon_code', { length: 64 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Order Items Table ---
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'restrict' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
  productImageSnapshot: text('product_image_snapshot').notNull(),
  unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  selectedColor: varchar('selected_color', { length: 64 }),
  selectedSize: varchar('selected_size', { length: 64 }),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

// --- Wishlist Items Table ---
export const wishlistItems = pgTable('wishlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Audit Logs Table ---
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 128 }).notNull(),
  entity: varchar('entity', { length: 64 }).notNull(),
  entityId: varchar('entity_id', { length: 64 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Drizzle Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  wishlistItems: many(wishlistItems),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));
