import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDoc,
  getDocFromServer,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, CategoryItem, HeroBannerConfig, ProductReview, TopSellingSectionConfig, CourierConfig, DeliveryConfig, FacebookPixelConfig, BKashPaymentConfig, CouponItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { compressDataUrl } from '../utils/imageCompressor';

// Verified Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CATEGORIES_COLLECTION = 'categories';
const REVIEWS_COLLECTION = 'reviews';
const SETTINGS_COLLECTION = 'settings';

// --- FIRESTORE CONNECTIVITY TEST ---
export interface FirestoreConnectionStatus {
  connected: boolean;
  status: 'connected' | 'checking' | 'error';
  databaseId: string;
  projectId: string;
  latencyMs?: number;
  message?: string;
  testedAt?: string;
}

/**
 * Runs a direct server ping against the configured Firestore instance to verify live connectivity
 */
export const testFirestoreConnection = async (): Promise<FirestoreConnectionStatus> => {
  const start = Date.now();
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const projId = firebaseConfig.projectId || 'sodium-circle-3dw25';

  try {
    const pingRef = doc(db, SETTINGS_COLLECTION, 'general');
    await getDocFromServer(pingRef);
    const latency = Date.now() - start;
    return {
      connected: true,
      status: 'connected',
      databaseId: dbId,
      projectId: projId,
      latencyMs: latency,
      message: `কানেক্টেড (Latency: ${latency}ms)`,
      testedAt: new Date().toLocaleTimeString(),
    };
  } catch (error: any) {
    const latency = Date.now() - start;
    const msg = error instanceof Error ? error.message : String(error);
    const isOffline = msg.toLowerCase().includes('client is offline') || msg.toLowerCase().includes('unavailable');
    
    return {
      connected: !isOffline,
      status: isOffline ? 'error' : 'connected',
      databaseId: dbId,
      projectId: projId,
      latencyMs: latency,
      message: isOffline ? `অফলাইন / কানেকশন ত্রুটি` : `সক্রিয় (${latency}ms)`,
      testedAt: new Date().toLocaleTimeString(),
    };
  }
};

// --- SANITIZATION HELPERS ---
export const removeUndefinedFields = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
};

export const sanitizeCategory = async (category: CategoryItem): Promise<CategoryItem> => {
  let image = category.image || '';
  if (image.startsWith('data:image/')) {
    if (image.length > 30000) {
      try {
        image = await compressDataUrl(image, 500, 500, 0.70);
      } catch {
        const defaultCat = INITIAL_CATEGORIES.find((c) => c.id === category.id || c.slug === category.slug);
        image = defaultCat?.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80';
      }
    }
  }
  return {
    ...category,
    image,
  };
};

export const sanitizeProduct = async (product: Product): Promise<Product> => {
  let image = product.image || '';
  if (image.startsWith('data:image/') && image.length > 30000) {
    try {
      image = await compressDataUrl(image, 600, 600, 0.70);
    } catch {
      image = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
    }
  }

  let images = product.images;
  if (Array.isArray(images) && images.length > 0) {
    images = await Promise.all(
      images.map(async (img) => {
        if (img && img.startsWith('data:image/') && img.length > 30000) {
          try {
            return await compressDataUrl(img, 600, 600, 0.70);
          } catch {
            return image;
          }
        }
        return img;
      })
    );
  }

  return {
    ...product,
    image,
    images: images && images.length > 0 ? images : [image],
  };
};

// --- PRODUCTS ---
export const subscribeToProducts = (callback: (products: Product[]) => void, maxLimit = 300) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), limit(maxLimit));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      if (items.length > 0) {
        try {
          localStorage.setItem('albarakah_backup_products', JSON.stringify(items));
        } catch (e) {}
      }
      callback(items);
    },
    (err) => {
      console.warn('Products Firestore snapshot warning:', err);
      try {
        const cached = localStorage.getItem('albarakah_backup_products');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveProductToDb = async (product: Product): Promise<void> => {
  try {
    const sanitized = await sanitizeProduct(product);
    const cleaned = removeUndefinedFields(sanitized);
    const docRef = doc(db, PRODUCTS_COLLECTION, cleaned.id);
    await setDoc(docRef, cleaned, { merge: true });

    // Update local mirror
    try {
      const cached = localStorage.getItem('albarakah_backup_products');
      const list: Product[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(p => p.id === cleaned.id);
      if (idx >= 0) {
        list[idx] = cleaned;
      } else {
        list.unshift(cleaned);
      }
      localStorage.setItem('albarakah_backup_products', JSON.stringify(list));
    } catch (e) {}
  } catch (err) {
    console.error('Error saving product to DB:', err);
  }
};

export const deleteProductFromDb = async (productId: string): Promise<void> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);

    // Update local mirror
    try {
      const cached = localStorage.getItem('albarakah_backup_products');
      if (cached) {
        const list: Product[] = JSON.parse(cached);
        const filtered = list.filter(p => p.id !== productId);
        localStorage.setItem('albarakah_backup_products', JSON.stringify(filtered));
      }
    } catch (e) {}
  } catch (err) {
    console.error('Error deleting product from DB:', err);
  }
};

export const seedInitialProductsIfEmpty = async (initialProducts: Product[]): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) {
      for (const prod of initialProducts) {
        await saveProductToDb(prod);
      }
    }
  } catch (e) {
    console.warn('Error seeding products:', e);
  }
};

// --- ORDERS ---
export const subscribeToOrders = (callback: (orders: Order[]) => void, maxLimit = 200) => {
  const q = query(collection(db, ORDERS_COLLECTION), limit(maxLimit));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Order), id: docSnap.id });
      });
      if (list.length > 0) {
        try {
          localStorage.setItem('albarakah_backup_orders', JSON.stringify(list));
        } catch (e) {}
      }
      callback(list);
    },
    (err) => {
      console.warn('Orders Firestore snapshot warning:', err);
      try {
        const cached = localStorage.getItem('albarakah_backup_orders');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveOrderToDb = async (order: Order): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const cleanedOrder = removeUndefinedFields(order);
    await setDoc(docRef, cleanedOrder, { merge: true });

    // Update local mirror
    try {
      const cached = localStorage.getItem('albarakah_backup_orders');
      const list: Order[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(o => o.id === cleanedOrder.id);
      if (idx >= 0) {
        list[idx] = cleanedOrder;
      } else {
        list.unshift(cleanedOrder);
      }
      localStorage.setItem('albarakah_backup_orders', JSON.stringify(list));
    } catch (e) {}
  } catch (err) {
    console.error('Error saving order to DB:', err);
  }
};

export const updateOrderStatusInDb = async (
  orderId: string,
  status: Order['status'],
  paymentStatus?: Order['paymentStatus']
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const updateData: any = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  await updateDoc(docRef, removeUndefinedFields(updateData));
};

export const deleteOrderFromDb = async (orderId: string): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting order from DB:', err);
  }
};

export const getFilteredOrders = async (userIdentifier?: {
  email?: string;
  phone?: string;
  userId?: string;
}): Promise<Order[]> => {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const snap = await getDocs(ordersCol);
    const allOrders: Order[] = [];
    snap.forEach((docSnap) => {
      allOrders.push({ ...(docSnap.data() as Order), id: docSnap.id });
    });

    // Server-side sorted by createdAt descending
    allOrders.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    if (!userIdentifier) return allOrders;

    const targetEmail = (userIdentifier.email || '').toLowerCase().trim();
    const targetPhoneDigits = (userIdentifier.phone || '').replace(/\D/g, '').slice(-10);
    const targetUserId = userIdentifier.userId || '';

    return allOrders.filter((o) => {
      if (targetUserId && o.userId && o.userId === targetUserId) return true;

      const oEmail = (o.customerEmail || o.customer?.email || '').toLowerCase().trim();
      if (targetEmail && oEmail) {
        if (oEmail === targetEmail) return true;
        const cleanOEmail = oEmail.replace('user_', '');
        const cleanTargetEmail = targetEmail.replace('user_', '');
        if (cleanOEmail === cleanTargetEmail) return true;
      }

      const oPhoneDigits = (o.customerPhone || o.customer?.phone || '').replace(/\D/g, '').slice(-10);
      if (targetPhoneDigits && oPhoneDigits && oPhoneDigits === targetPhoneDigits) {
        return true;
      }

      return false;
    });
  } catch (err) {
    console.error('Error fetching filtered orders:', err);
    return [];
  }
};

// --- REVIEWS ---
export const subscribeToReviews = (callback: (reviews: ProductReview[]) => void, maxLimit = 150) => {
  const q = query(collection(db, REVIEWS_COLLECTION), limit(maxLimit));
  return onSnapshot(
    q,
    (snapshot) => {
      const revs: ProductReview[] = [];
      snapshot.forEach((docSnap) => {
        revs.push({ ...(docSnap.data() as ProductReview), id: docSnap.id });
      });
      if (revs.length > 0) {
        try {
          localStorage.setItem('albarakah_backup_reviews', JSON.stringify(revs));
        } catch (e) {}
      }
      callback(revs);
    },
    (err) => {
      console.warn('Reviews Firestore snapshot warning:', err);
      try {
        const cached = localStorage.getItem('albarakah_backup_reviews');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveReviewToDb = async (review: ProductReview): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, review.id);
    const cleanedReview = removeUndefinedFields(review);
    await setDoc(docRef, cleanedReview, { merge: true });

    try {
      const cached = localStorage.getItem('albarakah_backup_reviews');
      const list: ProductReview[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(r => r.id === cleanedReview.id);
      if (idx >= 0) {
        list[idx] = cleanedReview;
      } else {
        list.unshift(cleanedReview);
      }
      localStorage.setItem('albarakah_backup_reviews', JSON.stringify(list));
    } catch (e) {}
  } catch (err) {
    console.error('Error saving review to DB:', err);
  }
};

export const deleteReviewFromDb = async (reviewId: string): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(docRef);

    try {
      const cached = localStorage.getItem('albarakah_backup_reviews');
      if (cached) {
        const list: ProductReview[] = JSON.parse(cached);
        const filtered = list.filter(r => r.id !== reviewId);
        localStorage.setItem('albarakah_backup_reviews', JSON.stringify(filtered));
      }
    } catch (e) {}
  } catch (err) {
    console.error('Error deleting review from DB:', err);
  }
};

export const seedInitialReviewsIfEmpty = async (initialReviews: ProductReview[]): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, REVIEWS_COLLECTION));
    if (snap.empty) {
      for (const rev of initialReviews) {
        await saveReviewToDb(rev);
      }
    }
  } catch (e) {
    console.warn('Error seeding reviews:', e);
  }
};

// --- CATEGORIES ---
export const subscribeToCategories = (callback: (categories: CategoryItem[]) => void) => {
  const q = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    q,
    (snapshot) => {
      const cats: CategoryItem[] = [];
      snapshot.forEach((docSnap) => {
        cats.push({ ...(docSnap.data() as CategoryItem), id: docSnap.id });
      });
      // Sort by order property to strictly maintain user reordered sequence
      cats.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (cats.length > 0) {
        try {
          localStorage.setItem('albarakah_backup_categories', JSON.stringify(cats));
        } catch (e) {}
      }
      callback(cats);
    },
    (err) => {
      console.warn('Categories Firestore snapshot warning:', err);
      try {
        const cached = localStorage.getItem('albarakah_backup_categories');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveCategoryToDb = async (category: CategoryItem): Promise<void> => {
  try {
    const sanitized = await sanitizeCategory(category);
    const cleaned = removeUndefinedFields(sanitized);
    const docRef = doc(db, CATEGORIES_COLLECTION, cleaned.id);
    await setDoc(docRef, cleaned, { merge: true });

    try {
      const cached = localStorage.getItem('albarakah_backup_categories');
      const list: CategoryItem[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(c => c.id === cleaned.id);
      if (idx >= 0) {
        list[idx] = cleaned;
      } else {
        list.push(cleaned);
      }
      localStorage.setItem('albarakah_backup_categories', JSON.stringify(list));
    } catch (e) {}
  } catch (err) {
    console.error('Error saving category to DB:', err);
  }
};

export const deleteCategoryFromDb = async (categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);

    try {
      const cached = localStorage.getItem('albarakah_backup_categories');
      if (cached) {
        const list: CategoryItem[] = JSON.parse(cached);
        const filtered = list.filter(c => c.id !== categoryId);
        localStorage.setItem('albarakah_backup_categories', JSON.stringify(filtered));
      }
    } catch (e) {}
  } catch (err) {
    console.error('Error deleting category from DB:', err);
  }
};

export const seedInitialCategoriesIfEmpty = async (initialCategories: CategoryItem[]): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (snap.empty) {
      for (const cat of initialCategories) {
        await saveCategoryToDb(cat);
      }
    }
  } catch (e) {
    console.warn('Error seeding categories:', e);
  }
};

// --- SETTINGS (Review Toggle, Coupon Toggle & Codes, Banners, Top Selling, Courier Config, Delivery Config, Facebook Pixel, bKash Config) ---
export const subscribeToStoreSettings = (
  callback: (settings: {
    enableCustomerReviews?: boolean;
    enableCoupons?: boolean;
    coupons?: CouponItem[];
    heroBanners?: HeroBannerConfig | HeroBannerConfig[] | any;
    topSelling?: TopSellingSectionConfig;
    courierConfig?: CourierConfig;
    deliveryConfig?: DeliveryConfig;
    facebookPixelConfig?: FacebookPixelConfig;
    bkashConfig?: BKashPaymentConfig;
  }) => void
) => {
  const docRef = doc(db, SETTINGS_COLLECTION, 'general');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        try {
          localStorage.setItem('albarakah_backup_settings', JSON.stringify(data));
        } catch (e) {}
        callback(data);
      }
    },
    (err) => {
      console.warn('Settings snapshot warning:', err);
      try {
        const cached = localStorage.getItem('albarakah_backup_settings');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveStoreSettingsToDb = async (settings: {
  enableCustomerReviews?: boolean;
  enableCoupons?: boolean;
  coupons?: CouponItem[];
  heroBanners?: HeroBannerConfig | HeroBannerConfig[] | any;
  topSelling?: TopSellingSectionConfig;
  courierConfig?: CourierConfig;
  deliveryConfig?: DeliveryConfig;
  facebookPixelConfig?: FacebookPixelConfig;
  bkashConfig?: BKashPaymentConfig;
}): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    const cleanedSettings = removeUndefinedFields(settings);
    await setDoc(docRef, cleanedSettings, { merge: true });

    try {
      localStorage.setItem('albarakah_backup_settings', JSON.stringify(cleanedSettings));
    } catch (e) {}
  } catch (err) {
    console.error('Error saving store settings to DB:', err);
    throw err;
  }
};

export const updateOrderCourierInfoInDb = async (
  orderId: string,
  courierData: {
    courierProvider: string;
    courierConsignmentId: string;
    courierTrackingCode: string;
    courierStatus: string;
    courierSentAt: string;
    courierResponse?: any;
    status?: Order['status'];
  }
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, removeUndefinedFields(courierData));
  } catch (err) {
    console.error('Error updating order courier info in DB:', err);
  }
};

// --- ONE-CLICK FULL DATABASE BACKUP & RESTORE ---
export interface DatabaseBackupPayload {
  version: string;
  backupDate: string;
  storeName: string;
  data: {
    products: Product[];
    orders: Order[];
    categories: CategoryItem[];
    reviews: ProductReview[];
    settings?: any;
  };
}

/**
 * Fetches all live collections from Firestore and returns a comprehensive JSON backup payload
 */
export const createFullDatabaseBackup = async (): Promise<DatabaseBackupPayload> => {
  try {
    const [prodSnap, orderSnap, catSnap, revSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, PRODUCTS_COLLECTION)),
      getDocs(collection(db, ORDERS_COLLECTION)),
      getDocs(collection(db, CATEGORIES_COLLECTION)),
      getDocs(collection(db, REVIEWS_COLLECTION)),
      getDoc(doc(db, SETTINGS_COLLECTION, 'general')),
    ]);

    const products: Product[] = [];
    prodSnap.forEach((d) => products.push({ ...(d.data() as Product), id: d.id }));

    const orders: Order[] = [];
    orderSnap.forEach((d) => orders.push({ ...(d.data() as Order), id: d.id }));

    const categories: CategoryItem[] = [];
    catSnap.forEach((d) => categories.push({ ...(d.data() as CategoryItem), id: d.id }));

    const reviews: ProductReview[] = [];
    revSnap.forEach((d) => reviews.push({ ...(d.data() as ProductReview), id: d.id }));

    const settings = settingsSnap.exists() ? settingsSnap.data() : null;

    return {
      version: '1.0.0',
      backupDate: new Date().toISOString(),
      storeName: 'Al-Barakah Premium',
      data: {
        products,
        orders,
        categories,
        reviews,
        settings,
      },
    };
  } catch (error) {
    console.error('Error creating database backup:', error);
    throw error;
  }
};

/**
 * Restores products, categories, orders, reviews, and settings from a JSON backup payload to Firestore
 */
export const restoreFullDatabaseBackup = async (
  backup: DatabaseBackupPayload,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; counts: { products: number; categories: number; orders: number; reviews: number } }> => {
  if (!backup || !backup.data) {
    throw new Error('Invalid backup file format.');
  }

  const { products = [], categories = [], orders = [], reviews = [], settings } = backup.data;

  if (onProgress) onProgress(`Restoring ${products.length} products...`);
  for (const prod of products) {
    if (prod && prod.id) {
      await saveProductToDb(prod);
    }
  }

  if (onProgress) onProgress(`Restoring ${categories.length} categories...`);
  for (const cat of categories) {
    if (cat && cat.id) {
      await saveCategoryToDb(cat);
    }
  }

  if (onProgress) onProgress(`Restoring ${orders.length} orders...`);
  for (const ord of orders) {
    if (ord && ord.id) {
      await saveOrderToDb(ord);
    }
  }

  if (onProgress) onProgress(`Restoring ${reviews.length} reviews...`);
  for (const rev of reviews) {
    if (rev && rev.id) {
      await saveReviewToDb(rev);
    }
  }

  if (settings) {
    if (onProgress) onProgress('Restoring store settings...');
    await saveStoreSettingsToDb(settings);
  }

  return {
    success: true,
    counts: {
      products: products.length,
      categories: categories.length,
      orders: orders.length,
      reviews: reviews.length,
    },
  };
};
