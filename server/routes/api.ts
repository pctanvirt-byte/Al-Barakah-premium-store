import express from 'express';
import crypto from 'crypto';
import { db, isDatabaseConfigured } from '../../src/db/index.ts';
import { products, categories, orders, orderItems, coupons, wishlistItems, users, auditLogs } from '../../src/db/schema.ts';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { requireAuth, optionalAuth, requireAdmin, AuthRequest } from '../../src/middleware/auth.ts';
import { INITIAL_PRODUCTS } from '../../src/data/products.ts';
import { INITIAL_CATEGORIES } from '../../src/data/categories.ts';
import { sendAdminOtpEmail, sendOrderNotificationEmail } from '../services/mailer.ts';

export const apiRouter = express.Router();

// Privacy & PII Data Masking Helpers
function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 7) return '***';
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function maskEmailAddress(email?: string | null): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

function maskDeliveryAddress(address?: string | null, city?: string | null): string {
  const cityStr = city || 'Dhaka';
  if (!address) return cityStr;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return `***, ${parts[parts.length - 1]} (${cityStr})`;
  }
  return `***, ${cityStr}`;
}

// ==========================================
// In-Memory Fallback Store (Used when PostgreSQL is not configured or as resilient fallback)
// ==========================================
interface MemoryCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  badge?: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface MemoryProduct {
  id: string;
  categoryId?: string | null;
  categoryName?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stockCount: number;
  inStock: boolean;
  badge?: string | null;
  image: string;
  images?: string[];
  colors?: Array<{ name: string; hex: string } | string>;
  sizes?: string[];
  features?: string[];
  tags?: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  deletedAt?: string | null;
}

interface MemoryCoupon {
  code: string;
  discountPercent: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  usageLimit?: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt?: string | null;
}

interface MemoryOrder {
  id: string;
  trackingCode: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  cityDistrict: string;
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  couponCode?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id?: string;
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    totalPrice: number;
  }>;
}

const memoryStore = {
  categories: INITIAL_CATEGORIES.map((c, idx) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    badge: c.badge || null,
    displayOrder: idx,
    isActive: c.enabled,
  })) as MemoryCategory[],

  products: INITIAL_PRODUCTS.map((p) => ({
    id: p.id,
    categoryId: p.category,
    categoryName: p.category,
    name: p.name,
    slug: p.id,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    stockCount: p.stockCount || 15,
    inStock: p.inStock,
    badge: p.badge || null,
    image: p.image,
    images: p.images || [p.image],
    colors: p.colors || [],
    sizes: p.sizes || [],
    features: p.features || [],
    tags: p.tags || [],
    rating: p.rating,
    reviewCount: p.reviewCount,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  })) as MemoryProduct[],

  coupons: [
    { code: 'WELCOME10', discountPercent: 10, maxDiscountAmount: 50, minOrderAmount: 20, timesUsed: 12, isActive: true },
    { code: 'BARAKAH20', discountPercent: 20, maxDiscountAmount: 100, minOrderAmount: 40, timesUsed: 8, isActive: true },
    { code: 'RAMADAN30', discountPercent: 30, maxDiscountAmount: 150, minOrderAmount: 50, timesUsed: 3, isActive: true },
    { code: 'SUNNAH15', discountPercent: 15, maxDiscountAmount: 40, minOrderAmount: 15, timesUsed: 5, isActive: true },
  ] as MemoryCoupon[],

  orders: [] as MemoryOrder[],
  wishlists: new Map<string, Set<string>>(),
};

// ==========================================
// 1. PRODUCTS & CATEGORIES API
// ==========================================

// GET /api/categories - List all active categories
apiRouter.get('/categories', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const allCategories = await db.select()
        .from(categories)
        .where(and(eq(categories.isActive, true), isNull(categories.deletedAt)))
        .orderBy(categories.displayOrder);
      return res.json(allCategories);
    } catch (error) {
      console.warn('DB query failed, using memory store for categories');
    }
  }

  const activeCategories = memoryStore.categories
    .filter(c => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  res.json(activeCategories);
});

// GET /api/products - List products with live search & filters
apiRouter.get('/products', async (req, res) => {
  const { category, search, inStockOnly, minPrice, maxPrice, sort } = req.query;

  let productList: MemoryProduct[] = [];

  if (isDatabaseConfigured) {
    try {
      const dbProducts = await db.select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        stockCount: products.stockCount,
        inStock: products.inStock,
        badge: products.badge,
        image: products.image,
        images: products.images,
        colors: products.colors,
        sizes: products.sizes,
        features: products.features,
        tags: products.tags,
        rating: products.rating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(isNull(products.deletedAt));

      productList = dbProducts.map(p => ({
        ...p,
        categoryName: p.categoryName || undefined,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        rating: Number(p.rating),
        createdAt: new Date(p.createdAt).toISOString(),
      }));
    } catch (e) {
      console.warn('DB query failed, using memory store for products');
      productList = memoryStore.products.filter(p => !p.deletedAt);
    }
  } else {
    productList = memoryStore.products.filter(p => !p.deletedAt);
  }

  let filtered = [...productList];

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.categoryName === category || p.categoryId === category);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.description.toLowerCase().includes(s) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(s)))
    );
  }

  if (inStockOnly === 'true') {
    filtered = filtered.filter(p => p.inStock && p.stockCount > 0);
  }

  if (minPrice) {
    filtered = filtered.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= Number(maxPrice));
  }

  if (sort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Optional pagination query parameters support (?page=1&limit=24)
  const pageParam = req.query.page ? parseInt(String(req.query.page), 10) : null;
  const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : null;

  if (pageParam && limitParam && pageParam > 0 && limitParam > 0) {
    const startIndex = (pageParam - 1) * limitParam;
    const paginatedItems = filtered.slice(startIndex, startIndex + limitParam);
    return res.json({
      items: paginatedItems,
      total: filtered.length,
      page: pageParam,
      limit: limitParam,
      totalPages: Math.ceil(filtered.length / limitParam),
    });
  }

  res.json(filtered);
});

// GET /api/products/:id - Single product details
apiRouter.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  if (isDatabaseConfigured) {
    try {
      const [product] = await db.select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        stockCount: products.stockCount,
        inStock: products.inStock,
        badge: products.badge,
        image: products.image,
        images: products.images,
        colors: products.colors,
        sizes: products.sizes,
        features: products.features,
        tags: products.tags,
        rating: products.rating,
        reviewCount: products.reviewCount,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);

      if (product) {
        return res.json({
          ...product,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          rating: Number(product.rating),
        });
      }
    } catch (error) {
      // Fallback
    }
  }

  const memProduct = memoryStore.products.find(p => p.id === id && !p.deletedAt);
  if (!memProduct) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(memProduct);
});

// ==========================================
// 2. COUPONS API
// ==========================================

// POST /api/coupons/validate - Validate promo code server-side
apiRouter.post('/coupons/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Promo code is required' });
  }

  const cleanCode = code.toUpperCase().trim();

  if (isDatabaseConfigured) {
    try {
      const [coupon] = await db.select()
        .from(coupons)
        .where(and(eq(coupons.code, cleanCode), eq(coupons.isActive, true)))
        .limit(1);

      if (coupon) {
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res.status(400).json({ error: 'This coupon has expired' });
        }
        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
          return res.status(400).json({ error: 'Coupon usage limit has been reached' });
        }
        const minAmount = Number(coupon.minOrderAmount || 0);
        if (subtotal !== undefined && Number(subtotal) < minAmount) {
          return res.status(400).json({ 
            error: `Minimum order amount for this coupon is $${minAmount.toFixed(2)}` 
          });
        }
        return res.json({
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
          minOrderAmount: minAmount,
        });
      }
    } catch (e) {
      // Fallback
    }
  }

  const memCoupon = memoryStore.coupons.find(c => c.code === cleanCode && c.isActive);
  if (!memCoupon) {
    return res.status(404).json({ error: 'Invalid or inactive promo coupon code' });
  }

  const minAmount = Number(memCoupon.minOrderAmount || 0);
  if (subtotal !== undefined && Number(subtotal) < minAmount) {
    return res.status(400).json({ 
      error: `Minimum order amount for this coupon is $${minAmount.toFixed(2)}` 
    });
  }

  res.json({
    code: memCoupon.code,
    discountPercent: memCoupon.discountPercent,
    maxDiscountAmount: memCoupon.maxDiscountAmount || null,
    minOrderAmount: minAmount,
  });
});

// ==========================================
// 3. ORDERS & CHECKOUT API
// ==========================================

// POST /api/orders - Create authentic order (Persisted in PostgreSQL Cloud SQL)
apiRouter.post('/orders', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      cityDistrict,
      items,
      couponCode,
      paymentMethod = 'COD',
      currency = 'BDT',
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order fields (name, phone, delivery address or items)' });
    }

    let calculatedSubtotal = 0;
    const verifiedItems: Array<{
      productId: string;
      name: string;
      image: string;
      unitPrice: number;
      quantity: number;
      selectedColor?: string;
      selectedSize?: string;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const prod = memoryStore.products.find(p => p.id === item.productId);
      const unitPrice = prod ? prod.price : Number(item.price || item.unitPrice || 0);
      const quantity = Math.max(1, Number(item.quantity || 1));
      const itemTotal = unitPrice * quantity;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        productId: item.productId || (prod ? prod.id : 'p_general'),
        name: prod?.name || item.name || 'Al Barakah Premium Product',
        image: prod?.image || item.image || '',
        unitPrice,
        quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        totalPrice: itemTotal,
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const cleanCoupon = couponCode.toUpperCase().trim();
      const coupon = memoryStore.coupons.find(c => c.code === cleanCoupon && c.isActive);
      if (coupon) {
        discountAmount = (calculatedSubtotal * coupon.discountPercent) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
        coupon.timesUsed += 1;
      }
    }

    // Bangladesh delivery configuration & Free shipping threshold calculation
    const freeShippingThreshold = 2000; // Free delivery for orders over ৳2000
    const isDhaka = !cityDistrict || cityDistrict.toLowerCase().includes('dhaka') || cityDistrict.toLowerCase().includes('ঢাকা');
    const standardDeliveryRate = isDhaka ? 80 : 160;
    
    const deliveryFee = calculatedSubtotal >= freeShippingThreshold ? 0 : (currency === 'BDT' ? standardDeliveryRate : 5.00);
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + deliveryFee);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomInt(1000, 10000);
    const trackingCode = `ABP-${dateStr}-${randomSuffix}`;
    const cleanEmail = (customerEmail && customerEmail.trim()) || `${customerPhone.replace(/[^0-9]/g, '')}@guest.albarakah.com`;

    let createdOrderRecord: any = null;

    // Direct Insertion into Cloud SQL PostgreSQL using Drizzle ORM
    try {
      const [insertedOrder] = await db.insert(orders).values({
        trackingCode,
        userId: req.dbUser ? req.dbUser.id : undefined,
        customerName: customerName.trim(),
        customerEmail: cleanEmail,
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        cityDistrict: cityDistrict || 'Dhaka',
        subtotalAmount: calculatedSubtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        currency,
        paymentMethod: (paymentMethod || 'COD').toUpperCase(),
        paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
        orderStatus: 'PENDING',
        couponCode: couponCode || null,
        notes: notes || null,
      }).returning();

      if (insertedOrder) {
        for (const itm of verifiedItems) {
          await db.insert(orderItems).values({
            orderId: insertedOrder.id,
            productId: undefined,
            productNameSnapshot: itm.name,
            productImageSnapshot: itm.image || '',
            unitPriceSnapshot: itm.unitPrice.toFixed(2),
            quantity: itm.quantity,
            selectedColor: itm.selectedColor || null,
            selectedSize: itm.selectedSize || null,
            totalPrice: itm.totalPrice.toFixed(2),
          });
        }
        createdOrderRecord = insertedOrder;
      }
    } catch (dbErr) {
      console.warn('PostgreSQL direct insert fallback:', dbErr);
    }

    const memoryOrderId = createdOrderRecord ? createdOrderRecord.id : `ord_${Date.now()}_${randomSuffix}`;
    const newOrder: MemoryOrder = {
      id: memoryOrderId,
      trackingCode,
      userId: req.dbUser ? req.dbUser.id : null,
      customerName: customerName.trim(),
      customerEmail: cleanEmail,
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      cityDistrict: cityDistrict || 'Dhaka',
      subtotalAmount: calculatedSubtotal,
      discountAmount,
      deliveryFee,
      totalAmount,
      currency,
      paymentMethod: (paymentMethod || 'COD').toUpperCase(),
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
      orderStatus: 'PENDING',
      couponCode: couponCode || null,
      notes: notes || null,
      createdAt: createdOrderRecord?.createdAt ? createdOrderRecord.createdAt.toISOString() : new Date().toISOString(),
      items: verifiedItems,
    };

    memoryStore.orders.unshift(newOrder);

    // Automatically trigger Order Notification Email in the background
    try {
      sendOrderNotificationEmail({
        id: newOrder.id,
        trackingCode: newOrder.trackingCode,
        customerName: newOrder.customerName,
        customerEmail: newOrder.customerEmail,
        customerPhone: newOrder.customerPhone,
        deliveryAddress: newOrder.deliveryAddress,
        cityDistrict: newOrder.cityDistrict,
        subtotalAmount: newOrder.subtotalAmount,
        discountAmount: newOrder.discountAmount,
        deliveryFee: newOrder.deliveryFee,
        totalAmount: newOrder.totalAmount,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        items: newOrder.items.map((it) => ({
          name: it.name,
          image: it.image,
          quantity: it.quantity,
          price: it.unitPrice,
          selectedColor: it.selectedColor,
          selectedSize: it.selectedSize,
        })),
        notes: newOrder.notes || undefined,
        createdAt: newOrder.createdAt,
      }).catch((mailErr) => {
        console.warn('[ORDER NOTIFICATION] Async mailer warning:', mailErr);
      });
    } catch (triggerErr) {
      console.warn('[ORDER NOTIFICATION] Failed to invoke mailer:', triggerErr);
    }

    res.status(201).json({
      success: true,
      order: {
        id: newOrder.id,
        trackingCode: newOrder.trackingCode,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        totalAmount: newOrder.totalAmount,
        currency: newOrder.currency,
        orderStatus: newOrder.orderStatus,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        createdAt: newOrder.createdAt,
        items: newOrder.items,
      },
    });
  } catch (error) {
    console.error('Failed to create order:', error);
    res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

// GET /api/orders/track/:code - Public tracking lookup (PostgreSQL + memory sync with PII masking)
apiRouter.get('/orders/track/:code', async (req, res) => {
  const { code } = req.params;
  const cleanCode = code.trim().toLowerCase();

  try {
    const [dbOrder] = await db.select().from(orders).where(eq(orders.trackingCode, code.trim())).limit(1);
    if (dbOrder) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, dbOrder.id));
      return res.json({
        id: dbOrder.id,
        trackingCode: dbOrder.trackingCode,
        customerName: dbOrder.customerName,
        customerEmail: maskEmailAddress(dbOrder.customerEmail),
        customerPhone: maskPhoneNumber(dbOrder.customerPhone),
        deliveryAddress: maskDeliveryAddress(dbOrder.deliveryAddress, dbOrder.cityDistrict),
        cityDistrict: dbOrder.cityDistrict,
        subtotalAmount: Number(dbOrder.subtotalAmount),
        discountAmount: Number(dbOrder.discountAmount),
        deliveryFee: Number(dbOrder.deliveryFee),
        totalAmount: Number(dbOrder.totalAmount),
        currency: dbOrder.currency,
        paymentMethod: dbOrder.paymentMethod,
        paymentStatus: dbOrder.paymentStatus,
        orderStatus: dbOrder.orderStatus,
        couponCode: dbOrder.couponCode,
        notes: dbOrder.notes,
        createdAt: dbOrder.createdAt.toISOString(),
        items: items.map(it => ({
          productId: it.productId,
          name: it.productNameSnapshot,
          image: it.productImageSnapshot,
          unitPrice: Number(it.unitPriceSnapshot),
          quantity: it.quantity,
          selectedColor: it.selectedColor,
          selectedSize: it.selectedSize,
          totalPrice: Number(it.totalPrice),
        })),
      });
    }
  } catch (err) {
    console.warn('DB lookup for tracking:', err);
  }

  const order = memoryStore.orders.find(o => 
    o.trackingCode.toLowerCase() === cleanCode || 
    o.id.toLowerCase() === cleanCode ||
    o.customerPhone.replace(/[^0-9]/g, '').includes(cleanCode.replace(/[^0-9]/g, ''))
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found with this tracking code' });
  }

  res.json({
    ...order,
    customerEmail: maskEmailAddress(order.customerEmail),
    customerPhone: maskPhoneNumber(order.customerPhone),
    deliveryAddress: maskDeliveryAddress(order.deliveryAddress, order.cityDistrict),
  });
});

// GET /api/orders/my-orders - User authenticated order history
apiRouter.get('/orders/my-orders', requireAuth, async (req: AuthRequest, res) => {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = req.dbUser.email.toLowerCase();
  const userOrders = memoryStore.orders.filter(
    o => (o.userId && o.userId === req.dbUser?.id) || o.customerEmail.toLowerCase() === userEmail
  );

  res.json(userOrders);
});

// ==========================================
// 4. WISHLIST API
// ==========================================

// GET /api/wishlist - Get saved wishlist for user
apiRouter.get('/wishlist', requireAuth, async (req: AuthRequest, res) => {
  if (!req.dbUser) return res.status(401).json({ error: 'Unauthorized' });

  const userWishlist = memoryStore.wishlists.get(req.dbUser.id) || new Set<string>();
  const items = memoryStore.products.filter(p => userWishlist.has(p.id) && !p.deletedAt);

  res.json(items);
});

// POST /api/wishlist/:productId - Toggle/Add to wishlist
apiRouter.post('/wishlist/:productId', requireAuth, async (req: AuthRequest, res) => {
  if (!req.dbUser) return res.status(401).json({ error: 'Unauthorized' });
  const { productId } = req.params;

  if (!memoryStore.wishlists.has(req.dbUser.id)) {
    memoryStore.wishlists.set(req.dbUser.id, new Set<string>());
  }
  const userWishlist = memoryStore.wishlists.get(req.dbUser.id)!;

  if (userWishlist.has(productId)) {
    userWishlist.delete(productId);
    return res.json({ added: false, message: 'Removed from wishlist' });
  } else {
    userWishlist.add(productId);
    return res.json({ added: true, message: 'Added to wishlist' });
  }
});

// ==========================================
// 5. USER AUTH PROFILE API
// ==========================================

// GET /api/auth/me - Current user profile
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  if (req.dbUser) {
    const emailLower = req.dbUser.email.toLowerCase().trim();
    if (emailLower === 'pctanvirt@gmail.com' || emailLower === 'albarakahpremium10@gmail.com') {
      req.dbUser.role = 'super_admin';
    }
  }
  res.json({
    user: req.dbUser,
  });
});

// ==========================================
// 6. ADMIN API (Requires role: admin / super_admin)
// ==========================================

// GET /api/admin/metrics
apiRouter.get('/admin/metrics', requireAuth, requireAdmin, async (req, res) => {
  const totalOrders = memoryStore.orders.length;
  const totalRevenue = memoryStore.orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalProducts = memoryStore.products.filter(p => !p.deletedAt).length;
  const totalCustomers = new Set(memoryStore.orders.map(o => o.customerEmail)).size || 1;

  res.json({
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    recentOrders: memoryStore.orders.slice(0, 5),
  });
});

// GET /api/admin/orders - All orders for administration (PostgreSQL + memory sync)
apiRouter.get('/admin/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const dbOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    if (dbOrders.length > 0) {
      const ordersWithItems = await Promise.all(
        dbOrders.map(async (o) => {
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
          return {
            id: o.id,
            trackingCode: o.trackingCode,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            deliveryAddress: o.deliveryAddress,
            cityDistrict: o.cityDistrict,
            subtotalAmount: Number(o.subtotalAmount),
            discountAmount: Number(o.discountAmount),
            deliveryFee: Number(o.deliveryFee),
            totalAmount: Number(o.totalAmount),
            currency: o.currency,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            couponCode: o.couponCode,
            notes: o.notes,
            createdAt: o.createdAt.toISOString(),
            items: items.map(it => ({
              productId: it.productId || 'p1',
              name: it.productNameSnapshot,
              image: it.productImageSnapshot,
              unitPrice: Number(it.unitPriceSnapshot),
              quantity: it.quantity,
              selectedColor: it.selectedColor,
              selectedSize: it.selectedSize,
              totalPrice: Number(it.totalPrice),
            })),
          };
        })
      );
      return res.json(ordersWithItems);
    }
  } catch (err) {
    console.warn('Could not fetch orders from DB, returning memoryStore:', err);
  }

  res.json(memoryStore.orders);
});

// PATCH /api/admin/orders/:id/status - Update order fulfillment status
apiRouter.patch('/admin/orders/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  try {
    await db.update(orders)
      .set({
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  } catch (err) {
    console.warn('DB update order status fallback:', err);
  }

  const order = memoryStore.orders.find(o => o.id === id || o.trackingCode === id);
  if (order) {
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    return res.json(order);
  }

  res.json({ success: true, id, orderStatus, paymentStatus });
});

// POST /api/admin/products - Add product
apiRouter.post('/admin/products', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      categoryId,
      description,
      price,
      originalPrice,
      stockCount,
      badge,
      image,
      images,
      colors,
      sizes,
      features,
      tags,
    } = req.body;

    const newProd: MemoryProduct = {
      id: `prod_${Date.now()}`,
      categoryId: categoryId || null,
      categoryName: categoryId || 'Sunnah Items',
      name,
      slug: `prod_${Date.now()}`,
      description: description || '',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stockCount: Number(stockCount || 0),
      inStock: Number(stockCount || 0) > 0,
      badge: badge || null,
      image,
      images: images || [image],
      colors: colors || [],
      sizes: sizes || [],
      features: features || [],
      tags: tags || [],
      rating: 5.0,
      reviewCount: 1,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    memoryStore.products.unshift(newProd);
    res.status(201).json(newProd);
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// DELETE /api/admin/products/:id - Soft delete product
apiRouter.delete('/admin/products/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const prod = memoryStore.products.find(p => p.id === id);
  if (prod) {
    prod.deletedAt = new Date().toISOString();
    prod.inStock = false;
  }
  res.json({ success: true, message: 'Product archived successfully' });
});

// ==========================================
// Admin OTP Authentication System
// ==========================================
interface OtpEntry {
  email: string;
  code: string;
  expiresAt: number;
}

const activeOtps = new Map<string, OtpEntry>();
const otpRateLimiter = new Map<string, number>();

const AUTHORIZED_SUPER_ADMINS = [
  'pctanvirt@gmail.com',
  'albarakahpremium10@gmail.com',
];

// POST /api/admin/send-otp - Generate & Send OTP to Super Admin Gmail
apiRouter.post('/admin/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdmin = AUTHORIZED_SUPER_ADMINS.includes(cleanEmail);

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized email address' });
    }

    // Rate Limiting: 30 seconds cooldown
    const lastRequest = otpRateLimiter.get(cleanEmail) || 0;
    const now = Date.now();
    if (now - lastRequest < 30 * 1000) {
      const waitSeconds = Math.ceil((30 * 1000 - (now - lastRequest)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting a new OTP.` });
    }
    otpRateLimiter.set(cleanEmail, now);

    // Generate secure 6-digit OTP code using crypto (valid for 2 minutes)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 120 * 1000; // 2 minutes validity

    activeOtps.set(cleanEmail, {
      email: cleanEmail,
      code: otpCode,
      expiresAt,
    });

    // Send email to Gmail
    await sendAdminOtpEmail({
      toEmail: cleanEmail,
      otpCode,
      adminName: 'Super Admin',
    });

    // SECURITY: We do NOT send the OTP code in the response!
    res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${cleanEmail}. Please check your inbox and spam folder.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Failed to send admin OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP code' });
  }
});

// POST /api/admin/verify-otp - Verify the 6-digit code
apiRouter.post('/admin/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const storedOtp = activeOtps.get(cleanEmail);
    const isSuperAdmin = AUTHORIZED_SUPER_ADMINS.includes(cleanEmail);
    const isMasterKey = cleanCode === (process.env.ADMIN_MASTER_OTP || 'ABPDelwar12#32R');

    // Secure Master Key or live generated Gmail OTP
    const isValid = 
      (storedOtp && storedOtp.code === cleanCode && Date.now() < storedOtp.expiresAt) ||
      (isMasterKey && isSuperAdmin);

    if (isValid) {
      if (storedOtp) {
        activeOtps.delete(cleanEmail);
      }

      res.json({
        success: true,
        message: 'OTP verified successfully',
        admin: {
          email: cleanEmail,
          role: 'Super Admin',
          name: 'Super Admin (Owner)',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP code. Please check your Gmail and try again.',
      });
    }
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ==========================================
// 7. COURIER INTEGRATION PROXY (Steadfast & Pathao)
// ==========================================

// POST /api/courier/steadfast/send - Send Order to Steadfast Courier
apiRouter.post('/courier/steadfast/send', async (req, res) => {
  try {
    const { apiKey, secretKey, order, baseUrl } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Steadfast API Key and Secret Key are required' });
    }

    if (!order) {
      return res.status(400).json({ error: 'Order details are required' });
    }

    const host = baseUrl?.trim() || 'https://portal.steadfast.com.bd';
    const endpoint = `${host.replace(/\/$/, '')}/api/v1/create_order`;

    const customerName = order.customer?.fullName || order.customerName || 'Customer';
    const customerPhone = order.customer?.phone || order.customerPhone || '';
    const customerAddress = order.customer?.address || order.deliveryAddress || '';
    const invoice = order.id || order.trackingCode || `ABP-${Date.now()}`;
    const codAmount = order.paymentMethod === 'COD' || order.paymentMethod === 'cod' || !order.paymentMethod
      ? Number(order.total || order.totalAmount || 0)
      : 0;
    const note = order.notes || 'Al Barakah Premium Order';

    const payload = {
      invoice: invoice.slice(-20),
      recipient_name: customerName,
      recipient_phone: customerPhone.replace(/[^0-9]/g, ''),
      recipient_address: customerAddress,
      cod_amount: codAmount,
      note: note,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.status !== 200 && data.status !== 'success' && !data.consignment)) {
      const errMsg = data?.message || data?.errors || `Steadfast API Error (HTTP ${response.status})`;
      return res.status(response.status >= 400 ? response.status : 400).json({
        success: false,
        error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg,
        raw: data,
      });
    }

    const consignment = data?.consignment || {};
    const trackingCode = consignment.tracking_code || consignment.consignment_id || data?.tracking_code || '';
    const consignmentId = consignment.consignment_id || data?.consignment_id || trackingCode;

    res.json({
      success: true,
      provider: 'steadfast',
      consignmentId: String(consignmentId),
      trackingCode: String(trackingCode),
      status: consignment.status || 'in_review',
      data: data,
      message: 'Order successfully submitted to Steadfast Courier!',
    });
  } catch (error: any) {
    console.error('Steadfast dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to communicate with Steadfast API',
    });
  }
});

// GET /api/courier/steadfast/track/:code - Live Steadfast Tracking
apiRouter.post('/courier/steadfast/track', async (req, res) => {
  try {
    const { apiKey, secretKey, trackingCode, consignmentId, invoice, baseUrl } = req.body;
    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Steadfast API Key and Secret Key required' });
    }

    const host = baseUrl?.trim() || 'https://portal.steadfast.com.bd';
    let url = '';
    if (trackingCode) {
      url = `${host.replace(/\/$/, '')}/api/v1/status_by_trackingcode/${encodeURIComponent(trackingCode)}`;
    } else if (consignmentId) {
      url = `${host.replace(/\/$/, '')}/api/v1/status_by_cid/${encodeURIComponent(consignmentId)}`;
    } else if (invoice) {
      url = `${host.replace(/\/$/, '')}/api/v1/status_by_invoice/${encodeURIComponent(invoice)}`;
    } else {
      return res.status(400).json({ error: 'Tracking code, consignment ID, or invoice is required' });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
    });

    const data = await response.json().catch(() => null);
    res.json({ success: response.ok, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/courier/pathao/send - Send Order to Pathao Courier
apiRouter.post('/courier/pathao/send', async (req, res) => {
  try {
    const { clientId, clientSecret, username, password, storeId, order, baseUrl } = req.body;

    if (!clientId || !clientSecret || !username || !password) {
      return res.status(400).json({ error: 'Pathao credentials (Client ID, Secret, Username, Password) are required' });
    }

    const host = baseUrl?.trim() || 'https://api-hermes.pathao.com';

    // Step 1: Obtain OAuth Bearer Token from Pathao
    const tokenRes = await fetch(`${host.replace(/\/$/, '')}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        grant_type: 'password',
      }),
    });

    const tokenData = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.access_token) {
      const errMsg = tokenData?.message || tokenData?.error_description || 'Pathao Authentication Failed';
      return res.status(401).json({
        success: false,
        error: `Pathao Auth Error: ${errMsg}`,
        raw: tokenData,
      });
    }

    const accessToken = tokenData.access_token;

    // Step 2: Create Order in Pathao
    const customerName = order.customer?.fullName || order.customerName || 'Customer';
    const customerPhone = (order.customer?.phone || order.customerPhone || '').replace(/[^0-9]/g, '');
    const customerAddress = order.customer?.address || order.deliveryAddress || '';
    const invoice = (order.id || order.trackingCode || `ABP-${Date.now()}`).slice(-20);
    const codAmount = order.paymentMethod === 'COD' || order.paymentMethod === 'cod' || !order.paymentMethod
      ? Number(order.total || order.totalAmount || 0)
      : 0;

    const createOrderPayload = {
      store_id: Number(storeId) || undefined,
      merchant_order_id: invoice,
      recipient_name: customerName,
      recipient_phone: customerPhone,
      recipient_address: customerAddress,
      recipient_city: 1, // Default Dhaka City ID
      recipient_zone: 1,
      delivery_type: 48, // 48 Hours Normal Delivery
      item_type: 2, // 1: Document, 2: Parcel
      special_instruction: order.notes || 'Al Barakah Premium Delivery',
      item_quantity: order.items?.length || 1,
      item_weight: '0.5',
      amount_to_collect: codAmount,
      item_description: order.items?.map((it: any) => it.name || it.productNameSnapshot || 'Product').join(', ') || 'Al Barakah Products',
    };

    const createRes = await fetch(`${host.replace(/\/$/, '')}/aladdin/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(createOrderPayload),
    });

    const createData = await createRes.json().catch(() => null);

    if (!createRes.ok || !createData?.data?.consignment_id) {
      const errMsg = createData?.message || createData?.errors || 'Failed to create Pathao order';
      return res.status(createRes.status >= 400 ? createRes.status : 400).json({
        success: false,
        error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg,
        raw: createData,
      });
    }

    const orderData = createData.data;
    const consignmentId = orderData.consignment_id;
    const trackingCode = orderData.consignment_id || invoice;

    res.json({
      success: true,
      provider: 'pathao',
      consignmentId: String(consignmentId),
      trackingCode: String(trackingCode),
      status: orderData.order_status || 'Pending',
      data: createData,
      message: 'Order successfully submitted to Pathao Courier!',
    });
  } catch (error: any) {
    console.error('Pathao dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to communicate with Pathao API',
    });
  }
});

// POST /api/notify-order - Dispatch real-time email notification on new order
apiRouter.post('/notify-order', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || (!orderData.customerName && !orderData.customer?.fullName)) {
      return res.status(400).json({ success: false, error: 'Order details required' });
    }

    const payload = {
      id: orderData.id || `ORD-${Date.now()}`,
      trackingCode: orderData.trackingCode || orderData.id,
      customerName: orderData.customerName || orderData.customer?.fullName || 'Customer',
      customerEmail: orderData.customerEmail || orderData.customer?.email,
      customerPhone: orderData.customerPhone || orderData.customer?.phone || '',
      deliveryAddress: orderData.deliveryAddress || orderData.customer?.address || '',
      cityDistrict: orderData.cityDistrict || orderData.customer?.city,
      subtotalAmount: orderData.subtotalAmount || orderData.subtotal,
      discountAmount: orderData.discountAmount || orderData.discount,
      deliveryFee: orderData.deliveryFee || orderData.deliveryCharge,
      totalAmount: orderData.totalAmount || orderData.total || 0,
      paymentMethod: orderData.paymentMethod || 'Cash On Delivery',
      paymentStatus: orderData.paymentStatus || 'Pending',
      items: (orderData.items || []).map((it: any) => ({
        name: it.name || it.productNameSnapshot || 'Product',
        image: it.image,
        quantity: it.quantity || 1,
        price: it.price || it.unitPrice || 0,
        selectedColor: it.selectedColor,
        selectedSize: it.selectedSize,
      })),
      notes: orderData.notes,
      createdAt: orderData.createdAt || new Date().toISOString(),
    };

    const mailResult = await sendOrderNotificationEmail(payload);
    res.json({
      success: true,
      message: 'Order email notification processed',
      mailResult,
    });
  } catch (error: any) {
    console.error('Error dispatching order notification email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send order notification email',
    });
  }
});

// POST /api/test-email - Test SMTP configuration & connectivity (Protected: Admin Only)
apiRouter.post('/test-email', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const testOrder = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      trackingCode: `TEST-ORDER`,
      customerName: 'Test Customer (Al Barakah Verification)',
      customerPhone: '01700000000',
      deliveryAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
      cityDistrict: 'Dhaka',
      subtotalAmount: 1500,
      deliveryFee: 60,
      totalAmount: 1560,
      paymentMethod: 'Cash on Delivery',
      items: [
        {
          name: 'Premium Wild Flower Honey (500g)',
          quantity: 1,
          price: 1500,
          selectedSize: '500g',
        },
      ],
      notes: 'This is an automated diagnostic test email for Al Barakah Premium store.',
      createdAt: new Date().toLocaleString('bn-BD'),
    };

    const result = await sendOrderNotificationEmail(testOrder);
    res.json({
      success: result.delivered !== false,
      result,
      smtpConfig: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        user: (process.env.SMTP_USER || '').replace(/(.{3})(.*)(@.*)/, '$1***$3'),
        hasPass: !!process.env.SMTP_PASS,
        port: process.env.SMTP_PORT || 587,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


