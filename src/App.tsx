import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  FolderArchive, 
  Heart,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Lock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Product, CartItem, Order, FilterState, Category, CategoryItem, HeroBannerConfig, ProductReview, TopSellingSectionConfig, CourierConfig, DeliveryConfig, DEFAULT_DELIVERY_CONFIG, FacebookPixelConfig, DEFAULT_FACEBOOK_PIXEL_CONFIG, BKashPaymentConfig, DEFAULT_BKASH_CONFIG } from './types';
import { INITIAL_PRODUCTS } from './data/products';
import { INITIAL_CATEGORIES } from './data/categories';
import { DEFAULT_TOP_SELLING_CONFIG } from './types/topSelling';
import { DEFAULT_COURIER_CONFIG } from './services/courierService';
import { initFacebookPixel, trackFbPageView, trackFbViewContent, trackFbAddToCart, trackFbInitiateCheckout, trackFbPurchase } from './services/facebookPixelService';
import { TopSellingSection } from './components/TopSellingSection';
import {
  subscribeToProducts,
  saveProductToDb,
  deleteProductFromDb,
  seedInitialProductsIfEmpty,
  subscribeToOrders,
  saveOrderToDb,
  deleteOrderFromDb,
  updateOrderStatusInDb,
  subscribeToReviews,
  saveReviewToDb,
  deleteReviewFromDb,
  seedInitialReviewsIfEmpty,
  subscribeToCategories,
  saveCategoryToDb,
  deleteCategoryFromDb,
  seedInitialCategoriesIfEmpty,
  subscribeToStoreSettings,
  saveStoreSettingsToDb
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { HeroBanner, DEFAULT_HERO_CONFIG } from './components/HeroBanner';
import { CategorySlider } from './components/CategorySlider';
import { CategoryAdminModal } from './components/CategoryAdminModal';
import { BannerAdminModal } from './components/BannerAdminModal';
import { FloatingCartWidget } from './components/FloatingCartWidget';
import { ProductFilters } from './components/ProductFilters';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartView } from './components/CartView';
import { AuthAndTrackView } from './components/AuthAndTrackView';
import { WishlistView } from './components/WishlistView';
import { CheckoutModal } from './components/CheckoutModal';
import { AddProductModal } from './components/AddProductModal';
import { ZipImportGuideModal } from './components/ZipImportGuideModal';
import { PolicyModal } from './components/PolicyModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerDashboardModal } from './components/CustomerDashboardModal';
import { CompareModal } from './components/CompareModal';
import { CompareFloatingBar } from './components/CompareFloatingBar';
import { AdminDashboard, StaffMember } from './components/AdminDashboard';
import { AdminAuthGuard, SUPER_ADMIN_EMAILS } from './components/AdminAuthGuard';
import { ProductLandingPage } from './components/ProductLandingPage';
import { useAuth } from './contexts/AuthContext';

const INITIAL_STAFF_LIST: StaffMember[] = [
  {
    id: 'staff-primary-owner',
    name: 'Super Admin (Owner)',
    email: 'albarakahpremium10@gmail.com',
    role: 'Super Admin',
    status: 'Active',
  },
  {
    id: 'staff-super-admin-2',
    name: 'Super Admin (Tanvir)',
    email: 'pctanvirt@gmail.com',
    role: 'Super Admin',
    status: 'Active',
  },
];

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod-combo-1',
    productName: 'Al-Barakah VIP Ramadan Combo',
    customerName: 'তানভীর আহমেদ',
    rating: 5,
    comment: 'অসাধারণ প্যাকেজিং এবং কম্বোর প্রতিটি জিনিস ১০০% খাঁটি। ক্যাম্বোডি ওউদের ঘ্রাণ মাশাআল্লাহ কাপড়ে ২ দিন ছিল। জাযাকাল্লাহু খাইরান।',
    createdAt: '2026-08-10',
    verifiedPurchase: true,
    city: 'ঢাকা',
    approved: true
  },
  {
    id: 'rev-2',
    productId: 'prod-combo-1',
    productName: 'Al-Barakah VIP Ramadan Combo',
    customerName: 'মাহমুদুল হাসান',
    rating: 5,
    comment: 'তসবিহ এর ফিনিশিং অনেক সুন্দর আর আজওয়া খেজুরগুলো একদম ফ্রেশ ছিল। গিফট করার জন্য এর চেয়ে ভালো কম্বো হতে পারে না।',
    createdAt: '2026-08-12',
    verifiedPurchase: true,
    city: 'চট্টগ্রাম',
    approved: true
  },
  {
    id: 'rev-4',
    productId: 'prod-attar-1',
    productName: 'Royal Cambodi Aged Oudh Oil',
    customerName: 'হাফেজ জুবায়ের',
    rating: 5,
    comment: 'খাঁটি কম্বোডিয়ান ওউদের ঘ্রাণ। অল্প একটু লাগালেই পুরো রুম সুবাসে ভরে যায়। আলহামদুলিল্লাহ।',
    createdAt: '2026-08-15',
    verifiedPurchase: true,
    city: 'রাজশাহী',
    approved: true
  }
];

const DEFAULT_FILTERS: FilterState = {
  category: 'All',
  searchQuery: '',
  minPrice: 0,
  maxPrice: 10000,
  minRating: 0,
  sortBy: 'featured',
  inStockOnly: false,
  onSaleOnly: false,
};

export default function App() {
  const { user, profile, isAdmin, openAuthModal, signOut } = useAuth();
  
  // --- Persistent & Real-Time Cloud Synced States ---
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('albarakah_premium_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('albarakah_premium_wishlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse wishlist', e);
      }
    }
    return [];
  });

  const [compareProducts, setCompareProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('albarakah_premium_compare');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse compare list', e);
      }
    }
    return [];
  });

  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // --- Admin & Staff Access State ---
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF_LIST);

  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    // Check if URL hash is #admin or query param is ?admin
    if (typeof window !== 'undefined') {
      return window.location.hash === '#admin' || window.location.search.includes('admin=true');
    }
    return false;
  });

  const [adminAuth, setAdminAuth] = useState<{ email: string; role: string } | null>(() => {
    const saved = localStorage.getItem('albarakah_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse admin session', e);
      }
    }
    return null;
  });

  const userEmailLower = user?.email?.toLowerCase().trim() || profile?.email?.toLowerCase().trim();
  const isSuperAdminUser = Boolean(
    userEmailLower && (userEmailLower === 'pctanvirt@gmail.com' || userEmailLower === 'albarakahpremium10@gmail.com')
  );
  const isEffectiveAdmin = Boolean(adminAuth || isAdmin || isSuperAdminUser || profile?.role === 'admin' || profile?.role === 'super_admin');

  // --- Hero Banner Configuration (Firestore Synced) ---
  const [heroBannerConfig, setHeroBannerConfig] = useState<HeroBannerConfig>(DEFAULT_HERO_CONFIG);

  // --- Top Selling Products Configuration (Firestore & LocalStorage Synced) ---
  const [topSellingConfig, setTopSellingConfig] = useState<TopSellingSectionConfig>(() => {
    try {
      const saved = localStorage.getItem('albarakah_premium_top_selling') || localStorage.getItem('albarakah_top_selling_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items && parsed.items.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse cached top selling config', e);
    }
    return DEFAULT_TOP_SELLING_CONFIG;
  });

  // --- Courier Configuration State (Steadfast & Pathao - Firestore Synced) ---
  const [courierConfig, setCourierConfig] = useState<CourierConfig>(DEFAULT_COURIER_CONFIG);

  // --- Dynamic Delivery Charge Configuration (Firestore Synced) ---
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);

  // --- Facebook Pixel, CAPI & Domain Verification Config (Firestore Synced) ---
  const [facebookPixelConfig, setFacebookPixelConfig] = useState<FacebookPixelConfig>(DEFAULT_FACEBOOK_PIXEL_CONFIG);

  // --- bKash Payment & PGW API Gateway Configuration (Firestore Synced) ---
  const [bkashConfig, setBkashConfig] = useState<BKashPaymentConfig>(DEFAULT_BKASH_CONFIG);

  // Initialize Facebook Pixel and Domain Verification whenever config changes
  useEffect(() => {
    initFacebookPixel(facebookPixelConfig);
  }, [facebookPixelConfig]);

  // --- Modals State ---
  const [activePageView, setActivePageView] = useState<'CATALOG' | 'CART' | 'TRACK' | 'LOGIN' | 'WISHLIST'>('CATALOG');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isZipGuideOpen, setIsZipGuideOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isAdminCategoryOpen, setIsAdminCategoryOpen] = useState(false);
  const [isBannerAdminOpen, setIsBannerAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [landingProduct, setLandingProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // --- Promo state ---
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // --- Toast Notification ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // --- Customer Reviews State & Admin Toggle (Connected to Firestore) ---
  const [enableCustomerReviews, setEnableCustomerReviews] = useState<boolean>(true);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);

  // --- Real-Time Firestore Synchronization Lifecycle ---
  useEffect(() => {
    // Clean up any stale or insecure business data stored in browser localStorage
    if (typeof window !== 'undefined') {
      try {
        const legacyKeys = [
          'albarakah_premium_products',
          'albarakah_premium_categories',
          'albarakah_premium_categories_v3',
          'albarakah_premium_orders',
          'albarakah_premium_reviews',
          'albarakah_premium_staff_list',
          'albarakah_premium_hero_banners',
          'albarakah_premium_top_selling',
          'albarakah_premium_courier_config',
          'albarakah_premium_bkash_config',
          'albarakah_premium_delivery_config',
          'albarakah_fb_pixel_config',
          'albarakah_enable_customer_reviews',
        ];
        legacyKeys.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        // Storage cleanup error ignore
      }
    }

    // Seed default initial data if Firestore collections are empty
    seedInitialProductsIfEmpty(INITIAL_PRODUCTS);
    seedInitialCategoriesIfEmpty(INITIAL_CATEGORIES);
    seedInitialReviewsIfEmpty(INITIAL_REVIEWS);

    // 1. Subscribe to Live Products
    const unsubProducts = subscribeToProducts((liveProducts) => {
      if (Array.isArray(liveProducts)) {
        setProducts(liveProducts);
      }
    });

    // 2. Subscribe to Live Categories
    const unsubCategories = subscribeToCategories((liveCategories) => {
      if (Array.isArray(liveCategories)) {
        setCategories(liveCategories);
      }
    });

    // 3. Subscribe to Live Orders
    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (liveOrders) {
        setOrders(liveOrders);
      }
    });

    // 4. Subscribe to Live Reviews
    const unsubReviews = subscribeToReviews((liveReviews) => {
      if (liveReviews && liveReviews.length > 0) {
        setReviews(liveReviews);
      }
    });

    // 5. Subscribe to Store Settings
    const unsubSettings = subscribeToStoreSettings((settings) => {
      if (typeof settings.enableCustomerReviews === 'boolean') {
        setEnableCustomerReviews(settings.enableCustomerReviews);
      }
      if (settings.heroBanners) {
        if (Array.isArray(settings.heroBanners)) {
          setHeroBannerConfig({
            slides: settings.heroBanners,
            promoCard: DEFAULT_HERO_CONFIG.promoCard,
          });
        } else if (typeof settings.heroBanners === 'object') {
          const raw = settings.heroBanners as any;
          if (Array.isArray(raw.slides)) {
            setHeroBannerConfig({
              slides: raw.slides,
              promoCard: raw.promoCard || DEFAULT_HERO_CONFIG.promoCard,
            });
          } else {
            setHeroBannerConfig(raw as HeroBannerConfig);
          }
        }
      }
      if (settings.topSelling && typeof settings.topSelling === 'object') {
        const topSellingData = settings.topSelling as TopSellingSectionConfig;
        if (topSellingData.items && topSellingData.items.length > 0) {
          setTopSellingConfig(topSellingData);
          localStorage.setItem('albarakah_premium_top_selling', JSON.stringify(topSellingData));
        }
      }
      if (settings.courierConfig && typeof settings.courierConfig === 'object') {
        setCourierConfig((prev) => ({
          ...prev,
          ...settings.courierConfig,
          steadfast: { ...prev.steadfast, ...(settings.courierConfig?.steadfast || {}) },
          pathao: { ...prev.pathao, ...(settings.courierConfig?.pathao || {}) },
        }));
      }
      if (settings.deliveryConfig && typeof settings.deliveryConfig === 'object') {
        setDeliveryConfig((prev) => ({
          ...prev,
          ...settings.deliveryConfig,
        }));
      }
      if (settings.facebookPixelConfig && typeof settings.facebookPixelConfig === 'object') {
        setFacebookPixelConfig((prev) => ({
          ...prev,
          ...settings.facebookPixelConfig,
        }));
      }
      if (settings.bkashConfig && typeof settings.bkashConfig === 'object') {
        setBkashConfig((prev) => ({
          ...prev,
          ...settings.bkashConfig,
          gateway: { ...prev.gateway, ...(settings.bkashConfig?.gateway || {}) },
        }));
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubReviews();
      unsubSettings();
    };
  }, []);

  const handleUpdateFacebookPixelConfig = async (newPixelCfg: FacebookPixelConfig) => {
    setFacebookPixelConfig(newPixelCfg);
    await saveStoreSettingsToDb({ facebookPixelConfig: newPixelCfg });
    initFacebookPixel(newPixelCfg);
    showToast('Facebook Pixel ও ডোমেইন ভেরিফিকেশন সফলভাবে সেভ হয়েছে!');
  };

  const handleUpdateBkashConfig = async (newBkashCfg: BKashPaymentConfig) => {
    setBkashConfig(newBkashCfg);
    await saveStoreSettingsToDb({ bkashConfig: newBkashCfg });
    showToast('বিকাশ পেমেন্ট গেটওয়ে ও পার্সোনাল সেটিংস সফলভাবে সেভ করা হয়েছে!');
  };

  const handleToggleCustomerReviews = async (enabled: boolean) => {
    setEnableCustomerReviews(enabled);
    await saveStoreSettingsToDb({ enableCustomerReviews: enabled });
    showToast(enabled ? 'কাস্টমার রিভিউ সিস্টেম চালু করা হয়েছে (ON)' : 'কাস্টমার রিভিউ সিস্টেম বন্ধ করা হয়েছে (OFF)');
  };

  const handleUpdateCategories = async (updatedCategories: CategoryItem[]) => {
    // Delete removed categories from Firestore
    const currentCatIds = new Set(updatedCategories.map((c) => c.id));
    const deletedCategories = categories.filter((c) => !currentCatIds.has(c.id));
    for (const delCat of deletedCategories) {
      await deleteCategoryFromDb(delCat.id);
    }

    // Preserve strict sequential order (0, 1, 2...)
    const sequenced = updatedCategories.map((cat, idx) => ({
      ...cat,
      order: idx,
    }));
    setCategories(sequenced);
    if (Array.isArray(sequenced)) {
      for (const c of sequenced) {
        await saveCategoryToDb(c);
      }
    }
  };

  const handleAddReview = async (newRevData: Omit<ProductReview, 'id' | 'createdAt'>) => {
    const newReview: ProductReview = {
      ...newRevData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      approved: true,
    };
    
    // Save directly to Central Firestore Database
    await saveReviewToDb(newReview);

    // Update product rating and count in database
    const allRevs = [newReview, ...reviews];
    const pRevs = allRevs.filter((r) => r.productId === newRevData.productId);
    const avg = pRevs.reduce((sum, r) => sum + r.rating, 0) / pRevs.length;

    const targetProduct = products.find((p) => p.id === newRevData.productId);
    if (targetProduct) {
      const updatedProduct = {
        ...targetProduct,
        rating: Number(avg.toFixed(1)),
        reviewCount: (targetProduct.reviewCount || 0) + 1,
      };
      await saveProductToDb(updatedProduct);
    }

    showToast('আপনার রিভিউ সফলভাবে ক্লাউড ডাটাবেজে যুক্ত হয়েছে! ধন্যবাদ।');
  };

  const handleDeleteReview = async (id: string) => {
    await deleteReviewFromDb(id);
    showToast('রিভিউ ডাটাবেজ থেকে মুছে ফেলা হয়েছে');
  };

  // Sync client-only state to local storage (Cart, Wishlist, Compare)
  useEffect(() => {
    localStorage.setItem('albarakah_premium_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('albarakah_premium_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('albarakah_premium_compare', JSON.stringify(compareProducts));
  }, [compareProducts]);

  // Listen to #admin hash or secret URL changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setIsAdminView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminView(false);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  useEffect(() => {
    if (adminAuth) {
      localStorage.setItem('albarakah_admin_session', JSON.stringify(adminAuth));
    } else {
      localStorage.removeItem('albarakah_admin_session');
    }
  }, [adminAuth]);

  // --- Mobile & Browser Back-Button History Controller ---
  const isPoppingStateRef = useRef(false);
  const lastStateKeyRef = useRef('');

  // 1. Initialize base state on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.history.state) {
        window.history.replaceState({ activePageView: 'CATALOG', category: 'All' }, '');
        lastStateKeyRef.current = JSON.stringify({ activePageView: 'CATALOG', category: 'All' });
      }
    }
  }, []);

  // 2. Listen to PopState (Mobile back button or browser back gesture)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      isPoppingStateRef.current = true;
      const state = event.state;

      if (!state) {
        // Revert to pure Home / Catalog
        setActivePageView('CATALOG');
        setSelectedProduct(null);
        setLandingProduct(null);
        setIsCheckoutOpen(false);
        setIsCustomerDashboardOpen(false);
        setIsCompareModalOpen(false);
        setIsPolicyOpen(false);
        setIsAdminCategoryOpen(false);
        setIsBannerAdminOpen(false);
        setIsAdminView(false);
        setFilters((prev) => ({ ...prev, category: 'All' }));
        lastStateKeyRef.current = JSON.stringify({ activePageView: 'CATALOG', category: 'All' });
      } else {
        setActivePageView(state.activePageView || 'CATALOG');
        if (state.selectedProductId) {
          const p = products.find((item) => item.id === state.selectedProductId);
          setSelectedProduct(p || null);
        } else {
          setSelectedProduct(null);
        }

        if (state.landingProductId) {
          const p = products.find((item) => item.id === state.landingProductId);
          setLandingProduct(p || null);
        } else {
          setLandingProduct(null);
        }

        setIsCheckoutOpen(Boolean(state.isCheckoutOpen));
        setIsCustomerDashboardOpen(Boolean(state.isCustomerDashboardOpen));
        setIsCompareModalOpen(Boolean(state.isCompareModalOpen));
        setIsPolicyOpen(Boolean(state.isPolicyOpen));
        setIsAdminCategoryOpen(Boolean(state.isAdminCategoryOpen));
        setIsBannerAdminOpen(Boolean(state.isBannerAdminOpen));
        setIsAdminView(Boolean(state.isAdminView));

        if (state.category) {
          setFilters((prev) => ({ ...prev, category: state.category }));
        }

        lastStateKeyRef.current = JSON.stringify({
          activePageView: state.activePageView || 'CATALOG',
          selectedProductId: state.selectedProductId || null,
          landingProductId: state.landingProductId || null,
          isCheckoutOpen: Boolean(state.isCheckoutOpen),
          isCustomerDashboardOpen: Boolean(state.isCustomerDashboardOpen),
          isCompareModalOpen: Boolean(state.isCompareModalOpen),
          isPolicyOpen: Boolean(state.isPolicyOpen),
          isAdminView: Boolean(state.isAdminView),
          category: state.category || 'All',
        });
      }

      setTimeout(() => {
        isPoppingStateRef.current = false;
      }, 150);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // 3. Push new history entry whenever user transitions to a modal, product, or subview
  useEffect(() => {
    if (typeof window === 'undefined' || isPoppingStateRef.current) return;

    const isSubState = Boolean(
      activePageView !== 'CATALOG' ||
      selectedProduct ||
      landingProduct ||
      isCheckoutOpen ||
      isCustomerDashboardOpen ||
      isCompareModalOpen ||
      isPolicyOpen ||
      isAdminCategoryOpen ||
      isBannerAdminOpen ||
      isAdminView ||
      (filters.category && filters.category !== 'All')
    );

    const currentStateObj = {
      activePageView,
      selectedProductId: selectedProduct?.id || null,
      landingProductId: landingProduct?.id || null,
      isCheckoutOpen,
      isCustomerDashboardOpen,
      isCompareModalOpen,
      isPolicyOpen,
      isAdminCategoryOpen,
      isBannerAdminOpen,
      isAdminView,
      category: filters.category,
    };

    const stateKey = JSON.stringify(currentStateObj);

    if (stateKey !== lastStateKeyRef.current) {
      if (isSubState) {
        window.history.pushState(currentStateObj, '');
      } else {
        window.history.replaceState(currentStateObj, '');
      }
      lastStateKeyRef.current = stateKey;
    }
  }, [
    activePageView,
    selectedProduct,
    landingProduct,
    isCheckoutOpen,
    isCustomerDashboardOpen,
    isCompareModalOpen,
    isPolicyOpen,
    isAdminCategoryOpen,
    isBannerAdminOpen,
    isAdminView,
    filters.category,
  ]);

  // Handle QR Code Verification Scan & Facebook Ad Landing Page Routing (e.g. ?landing=prod-mustard-oil-5l or ?verify=...)
  useEffect(() => {
    if (typeof window === 'undefined' || !products || products.length === 0) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyTarget = urlParams.get('verify') || urlParams.get('product');
      const landingTarget = urlParams.get('landing') || urlParams.get('ad') || urlParams.get('fb');
      const hash = window.location.hash;

      // Facebook Ad / Landing Page Route Check
      if (landingTarget) {
        const found = products.find(
          (p) =>
            p.id.toLowerCase() === landingTarget.toLowerCase() ||
            (p.slug && p.slug.toLowerCase() === landingTarget.toLowerCase()) ||
            p.name.toLowerCase().includes(landingTarget.toLowerCase())
        );
        if (found) {
          setLandingProduct(found);
          return;
        }
      } else if (hash && hash.startsWith('#landing-')) {
        const pId = hash.replace('#landing-', '');
        const found = products.find((p) => p.id === pId || p.slug === pId);
        if (found) {
          setLandingProduct(found);
          return;
        }
      }

      if (verifyTarget) {
        const found = products.find(
          (p) =>
            p.id.toLowerCase() === verifyTarget.toLowerCase() ||
            (p.slug && p.slug.toLowerCase() === verifyTarget.toLowerCase()) ||
            p.name.toLowerCase().includes(verifyTarget.toLowerCase())
        );
        if (found) {
          setSelectedProduct(found);
          showToast(`✅ ${found.name.slice(0, 28)} — আসল ও খাঁটি পণ্য হিসেবে যাচাই হয়েছে!`);
        }
      } else if (hash && hash.startsWith('#product-')) {
        const pId = hash.replace('#product-', '');
        const found = products.find((p) => p.id === pId || p.slug === pId);
        if (found) {
          setSelectedProduct(found);
        }
      }
    } catch (e) {
      console.error('Failed to parse URL params', e);
    }
  }, [products]);

  // --- Dynamic SEO & OpenGraph Meta Tag Injection ---
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let pageTitle = 'AL BARAKAH PREMIUM | Luxury Attar & Authentic Islamic Lifestyle';
    let metaDescription = 'Al Barakah Premium - Luxury alcohol-free attars, authentic Islamic lifestyle products, premium dates, and lifestyle collections in Bangladesh.';
    let ogImage = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';
    let pageKeywords = 'Al Barakah, Attar, Premium Perfume, Islamic Lifestyle, Bangladesh, Halal Perfume';

    if (selectedProduct) {
      pageTitle = `${selectedProduct.name} | AL BARAKAH PREMIUM`;
      metaDescription = selectedProduct.description 
        ? selectedProduct.description.slice(0, 160)
        : `Buy authentic ${selectedProduct.name} at AL BARAKAH PREMIUM. 100% pure & premium quality in Bangladesh.`;
      ogImage = selectedProduct.image || ogImage;
      pageKeywords = `${selectedProduct.name}, ${selectedProduct.category || 'Attar'}, AL BARAKAH PREMIUM, Buy Online Bangladesh`;
    } else if (activePageView === 'CART') {
      pageTitle = 'Shopping Cart | AL BARAKAH PREMIUM';
      metaDescription = 'Review your shopping bag and proceed to secure checkout on AL BARAKAH PREMIUM.';
    } else if (activePageView === 'WISHLIST') {
      pageTitle = 'My Wishlist | AL BARAKAH PREMIUM';
      metaDescription = 'View your saved favorite perfumes and Islamic lifestyle products on AL BARAKAH PREMIUM.';
    } else if (activePageView === 'TRACK') {
      pageTitle = 'Track Order | AL BARAKAH PREMIUM';
      metaDescription = 'Track your parcel and delivery status in real-time with AL BARAKAH PREMIUM.';
    } else if (filters.category && filters.category !== 'All') {
      pageTitle = `${filters.category} Collection | AL BARAKAH PREMIUM`;
      metaDescription = `Browse authentic ${filters.category} products at best prices with Cash on Delivery all across Bangladesh.`;
      pageKeywords = `${filters.category}, AL BARAKAH PREMIUM, Premium Collection, Bangladesh`;
    }

    // Set Document Title
    document.title = pageTitle;

    // Helper to update or create meta tags
    const updateOrCreateMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO Tags
    updateOrCreateMeta('name', 'description', metaDescription);
    updateOrCreateMeta('name', 'keywords', pageKeywords);

    // OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Messenger previews)
    updateOrCreateMeta('property', 'og:title', pageTitle);
    updateOrCreateMeta('property', 'og:description', metaDescription);
    updateOrCreateMeta('property', 'og:image', ogImage);
    updateOrCreateMeta('property', 'og:type', selectedProduct ? 'product' : 'website');
    updateOrCreateMeta('property', 'og:site_name', 'AL BARAKAH PREMIUM');
    updateOrCreateMeta('property', 'og:url', window.location.href);

    // Twitter Card Tags
    updateOrCreateMeta('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMeta('name', 'twitter:title', pageTitle);
    updateOrCreateMeta('name', 'twitter:description', metaDescription);
    updateOrCreateMeta('name', 'twitter:image', ogImage);

    // Track Facebook Pixel PageView
    trackFbPageView(activePageView);
  }, [selectedProduct, filters.category, activePageView]);

  // Track Facebook Pixel ViewContent for Standard Modal or Landing Page
  useEffect(() => {
    if (selectedProduct) {
      trackFbViewContent(selectedProduct, currency);
    }
  }, [selectedProduct, currency]);

  useEffect(() => {
    if (landingProduct) {
      trackFbViewContent(landingProduct, currency);
    }
  }, [landingProduct, currency]);

  // Track Facebook Pixel InitiateCheckout
  useEffect(() => {
    if (isCheckoutOpen && cart.length > 0) {
      const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.product.price) * item.quantity, 0);
      trackFbInitiateCheckout(cart, Math.max(0, subtotal - appliedDiscount), currency);
    }
  }, [isCheckoutOpen]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string, customPrice?: number) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        if (customPrice) {
          updated[existingIndex].customPrice = customPrice;
        }
        return updated;
      } else {
        return [...prevCart, { product, quantity, selectedColor: color, selectedSize: size, customPrice }];
      }
    });

    // Track Facebook Pixel AddToCart
    trackFbAddToCart(product, quantity, customPrice || product.price, currency);

    showToast(`Added "${product.name.slice(0, 25)}..." to cart`);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    showToast('Item removed from cart');
  };

  // Wishlist Operations
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed from wishlist`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        showToast(`Saved to wishlist`);
        return [...prev, product];
      }
    });
  };

  // Compare Operations (Limit: max 3 products)
  const handleToggleCompare = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`তুলনা তালিকা থেকে সরানো হয়েছে: "${product.name.slice(0, 18)}..."`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          showToast('সর্বোচ্চ ৩টি পণ্য একসাথে তুলনা করা যায় (Max 3 products)');
          return prev;
        }
        showToast(`তুলনা তালিকায় যুক্ত হয়েছে (${prev.length + 1}/3)`);
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromCompare = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleClearCompare = () => {
    setCompareProducts([]);
    showToast('তুলনা তালিকা খালি করা হয়েছে');
  };

  // Quick Buy Now Flow
  const handleBuyNow = (product: Product, quantity = 1, color?: string, size?: string, customPrice?: number) => {
    handleAddToCart(product, quantity, color, size, customPrice);
    setSelectedProduct(null);
    setActivePageView('CATALOG');
    setIsCheckoutOpen(true);
  };

  // Add Product (Persist directly to Firestore DB)
  const handleAddProduct = async (newProd: Product) => {
    await saveProductToDb(newProd);
    showToast(`New item "${newProd.name.slice(0, 20)}..." saved to Database!`);
  };

  // Order Placement (Persist directly to Firestore DB)
  const handleOrderPlaced = async (newOrder: Order) => {
    // Immediately update local orders state so it appears in Admin Dashboard instantly
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

    // Save to Firestore DB
    await saveOrderToDb(newOrder);

    // Dispatch Gmail notification
    try {
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch((err) => console.warn('Order notification dispatch warning:', err));
    } catch (e) {
      console.warn('Order notification trigger error:', e);
    }

    setCart([]); // Clear cart
    // Track Facebook Pixel Purchase event
    trackFbPurchase(newOrder);
    showToast(`Order #${newOrder.id} confirmed & saved to Live Database!`);
  };

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category
      if (filters.category !== 'All' && prod.category !== filters.category) {
        return false;
      }
      // Search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCategory = prod.category.toLowerCase().includes(q);
        const matchesTags = prod.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCategory && !matchesTags) {
          return false;
        }
      }
      // Price
      if (prod.price > filters.maxPrice) {
        return false;
      }
      // Rating
      if (filters.minRating > 0 && prod.rating < filters.minRating) {
        return false;
      }
      // Toggles
      if (filters.inStockOnly && !prod.inStock) {
        return false;
      }
      if (filters.onSaleOnly && !prod.originalPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return (b.badge === 'NEW' ? 1 : 0) - (a.badge === 'NEW' ? 1 : 0);
        default:
          return 0;
      }
    });
  }, [products, filters]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // --- Dedicated Secure Admin Dashboard View ---
  if (isAdminView) {
    if (!adminAuth) {
      return (
        <AdminAuthGuard
          allowedStaff={staffList}
          onBackToStore={handleCloseAdmin}
          onAuthenticated={(email, role) => {
            setAdminAuth({ email, role });
          }}
        />
      );
    }

    return (
      <AdminDashboard
        products={products}
        orders={orders}
        categories={categories}
        currency={currency}
        adminEmail={adminAuth.email}
        adminRole={adminAuth.role}
        onViewStore={handleCloseAdmin}
        onSignOut={() => {
          setAdminAuth(null);
          localStorage.removeItem('albarakah_admin_session');
          signOut();
          handleCloseAdmin();
          showToast('Logged out of Admin Session');
        }}
        onUpdateProducts={async (updatedProducts) => {
          // Identify any deleted products and delete them from Firestore
          const currentProdIds = new Set(updatedProducts.map((p) => p.id));
          const deletedProds = products.filter((p) => !currentProdIds.has(p.id));
          for (const delProd of deletedProds) {
            await deleteProductFromDb(delProd.id);
          }

          setProducts(updatedProducts);
          // If a product was updated or added, persist to Firestore
          if (Array.isArray(updatedProducts)) {
            for (const p of updatedProducts) {
              await saveProductToDb(p);
            }
          }
        }}
        onUpdateOrders={async (updatedOrders) => {
          // Identify any deleted orders and delete from Firestore
          const currentOrderIds = new Set(updatedOrders.map((o) => o.id));
          const deletedOrds = orders.filter((o) => !currentOrderIds.has(o.id));
          for (const delOrd of deletedOrds) {
            await deleteOrderFromDb(delOrd.id);
          }

          setOrders(updatedOrders);
          if (Array.isArray(updatedOrders)) {
            for (const o of updatedOrders) {
              await saveOrderToDb(o);
            }
          }
        }}
        onUpdateCategories={handleUpdateCategories}
        staffList={staffList}
        onUpdateStaffList={setStaffList}
        heroBannerConfig={heroBannerConfig}
        onUpdateHeroBannerConfig={async (banners) => {
          setHeroBannerConfig(banners);
          await saveStoreSettingsToDb({ heroBanners: banners });
        }}
        topSellingConfig={topSellingConfig}
        onUpdateTopSellingConfig={async (newTopSelling) => {
          setTopSellingConfig(newTopSelling);
          localStorage.setItem('albarakah_premium_top_selling', JSON.stringify(newTopSelling));
          await saveStoreSettingsToDb({ topSelling: newTopSelling });
          showToast('টপ সেলিং সেকশন সফলভাবে আপডেট করা হয়েছে!');
        }}
        courierConfig={courierConfig}
        onUpdateCourierConfig={async (newCourierCfg) => {
          setCourierConfig(newCourierCfg);
          localStorage.setItem('albarakah_premium_courier_config', JSON.stringify(newCourierCfg));
          await saveStoreSettingsToDb({ courierConfig: newCourierCfg });
          showToast('কুরিয়ার কনফিগারেশন সফলভাবে সেভ করা হয়েছে!');
        }}
        enableCustomerReviews={enableCustomerReviews}
        onToggleCustomerReviews={handleToggleCustomerReviews}
        customerReviews={reviews}
        onDeleteReview={handleDeleteReview}
        deliveryConfig={deliveryConfig}
        onUpdateDeliveryConfig={async (newDeliveryCfg) => {
          setDeliveryConfig(newDeliveryCfg);
          localStorage.setItem('albarakah_premium_delivery_config', JSON.stringify(newDeliveryCfg));
          await saveStoreSettingsToDb({ deliveryConfig: newDeliveryCfg });
          showToast('ডেলিভারি চার্জ ও শিপিং পলিসি সফলভাবে সেভ করা হয়েছে!');
        }}
        facebookPixelConfig={facebookPixelConfig}
        onUpdateFacebookPixelConfig={handleUpdateFacebookPixelConfig}
        bkashConfig={bkashConfig}
        onUpdateBkashConfig={handleUpdateBkashConfig}
        onPreviewLandingPage={(prod) => {
          setLandingProduct(prod);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        compareCount={compareProducts.length}
        searchQuery={filters.searchQuery || ''}
        onSearchChange={(q) => {
          setActivePageView('CATALOG');
          setFilters((prev) => ({ ...prev, searchQuery: q, search: q }));
        }}
        selectedCategory={filters.category}
        onSelectCategory={(cat) => {
          setActivePageView('CATALOG');
          setFilters((prev) => ({ ...prev, category: cat }));
        }}
        onOpenCart={() => setActivePageView((prev) => (prev === 'CART' ? 'CATALOG' : 'CART'))}
        onOpenWishlist={() => setActivePageView('WISHLIST')}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onOpenOrders={() => setActivePageView('TRACK')}
        onOpenAuth={(tab) => setActivePageView(tab === 'TRACK' ? 'TRACK' : 'LOGIN')}
        onOpenAdmin={() => setIsAdminView(true)}
        onOpenCustomerDashboard={() => setIsCustomerDashboardOpen(true)}
        isAdminSessionActive={isEffectiveAdmin}
        categories={categories}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Main Body: Full Screen Pages (Cart, Track Order, Auth/Login, Wishlist) or Main Catalog */}
      {activePageView === 'CART' && (
        <CartView
          items={cart}
          onClose={() => setActivePageView('CATALOG')}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedCheckout={(discount, code) => {
            setAppliedDiscount(discount);
            setAppliedCoupon(code);
            setIsCheckoutOpen(true);
          }}
          currency={currency}
          deliveryConfig={deliveryConfig}
        />
      )}

      {(activePageView === 'TRACK' || activePageView === 'LOGIN') && (
        <AuthAndTrackView
          initialTab={activePageView === 'TRACK' ? 'TRACK' : 'LOGIN'}
          onClose={() => setActivePageView('CATALOG')}
          orders={orders}
          currency={currency}
          onOpenDashboard={() => {
            setIsCustomerDashboardOpen(true);
            setActivePageView('CATALOG');
          }}
        />
      )}

      {activePageView === 'WISHLIST' && (
        <WishlistView
          wishlist={wishlist}
          onClose={() => setActivePageView('CATALOG')}
          onRemoveFromWishlist={handleToggleWishlist}
          onAddToCart={(p) => {
            handleAddToCart(p, 1);
            showToast('Added to cart');
          }}
          onQuickView={(p) => setSelectedProduct(p)}
          onDirectBuy={(p) => handleBuyNow(p, 1)}
          currency={currency}
          onOpenAuth={() => setActivePageView('LOGIN')}
        />
      )}

      {activePageView === 'CATALOG' && (
        <>
          {/* Hero Section (only when on 'All' or no active text search) */}
          {!filters.searchQuery && filters.category === 'All' && (
            <HeroBanner
              config={heroBannerConfig}
              onNavigate={(targetType, targetValue) => {
                if (targetType === 'category') {
                  setFilters((prev) => ({ ...prev, category: targetValue, searchQuery: '' }));
                  setActivePageView('CATALOG');
                  const catEl = document.getElementById('catalog-section');
                  if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
                } else if (targetType === 'product') {
                  const found = products.find((p) => p.id === targetValue || p.name === targetValue);
                  if (found) {
                    setSelectedProduct(found);
                  } else {
                    setActivePageView('CATALOG');
                  }
                } else {
                  setFilters((prev) => ({ ...prev, category: 'All', searchQuery: '' }));
                  setActivePageView('CATALOG');
                }
              }}
              onOpenProductModal={(p) => setSelectedProduct(p)}
              products={products}
              currency={currency}
            />
          )}

      {/* Featured Categories Carousel Slider (matching user requested flow & screenshot) */}
      {!filters.searchQuery && (
        <CategorySlider
          categories={categories}
          selectedCategory={filters.category}
          onSelectCategory={(cat) => setFilters((prev) => ({ ...prev, category: cat }))}
          onOpenAdmin={() => setIsAdminCategoryOpen(true)}
        />
      )}

      {/* Top Selling Products Section (Placed directly below CategorySlider in Ghorer Bazar style) */}
      {!filters.searchQuery && filters.category === 'All' && topSellingConfig.enabled && (
        <TopSellingSection
          config={topSellingConfig}
          products={products}
          compareProducts={compareProducts}
          onToggleCompare={handleToggleCompare}
          onAddToCart={(p, qty) => handleAddToCart(p, qty || 1)}
          onBuyNow={(p, qty) => handleBuyNow(p, qty || 1)}
          onOpenProductModal={(p) => setSelectedProduct(p)}
        />
      )}

      {/* Main Content Area: Clean Ghorer Bazar Full-Width Product Grid */}
      <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Section Header & Sort controls (shown when filtering by category or searching) */}
        {(filters.category !== 'All' || filters.searchQuery) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-stone-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {filters.category === 'All' ? 'All Products' : `${filters.category}`}
                </h2>
                {filters.searchQuery && (
                  <span className="text-xs font-normal text-stone-500">
                    - "{filters.searchQuery}"
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                Showing {filteredProducts.length} premium items with doorstep delivery
              </p>
            </div>

            {/* Sort Dropdown & Back to All */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors cursor-pointer"
              >
                All Categories
              </button>
              <div className="flex items-center gap-1.5 bg-white border border-stone-200/90 rounded-lg px-2.5 py-1.5 shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <label className="text-xs text-stone-500 font-medium hidden sm:inline">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                  className="text-xs font-semibold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Full-Width Products Content */}
        <div className="w-full">
          {filters.category === 'All' && !filters.searchQuery ? (
            /* Category-by-Category Sections in Strict Order */
            <div className="space-y-12 sm:space-y-14">
              {categories.filter((c) => c.enabled).map((cat) => {
                const catProducts = products.filter(
                  (p) => p.category?.toLowerCase() === cat.name.toLowerCase() || p.category === cat.name
                );

                if (catProducts.length === 0) return null;

                const isSpecialSection = cat.name.toLowerCase() === 'combo' || cat.name.toLowerCase() === 'offer zone';
                const isOfferZone = cat.name.toLowerCase() === 'offer zone';

                if (isSpecialSection) {
                  return (
                    <section 
                      key={cat.id} 
                      className={`space-y-5 p-4 sm:p-6 rounded-2xl border transition-all ${
                        isOfferZone 
                          ? 'bg-gradient-to-b from-rose-50/60 via-amber-50/30 to-white border-rose-200/80 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.08)]' 
                          : 'bg-gradient-to-b from-amber-50/70 via-emerald-50/20 to-white border-amber-200/80 shadow-[0_4px_20px_-4px_rgba(217,119,6,0.08)]'
                      }`}
                    >
                      {/* Special Centered Header */}
                      <div className="flex flex-col items-center justify-center text-center space-y-1.5 pb-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-2xs bg-white border border-stone-200">
                          <span className="w-2 h-2 rounded-full animate-ping mr-0.5 inline-block" style={{ backgroundColor: isOfferZone ? '#e11d48' : '#d97706' }} />
                          <span className={isOfferZone ? 'text-rose-700' : 'text-amber-700'}>
                            {cat.badge || (isOfferZone ? 'Flash Discount' : 'Mega Saver')}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-serif flex items-center justify-center gap-2">
                          <span>{cat.name}</span>
                        </h3>

                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          {isOfferZone 
                            ? 'Special limited time promotional discounts on hand-picked authentic essentials'
                            : 'Exclusive bundled packages designed to give you maximum value and savings'}
                        </p>

                        <div className="pt-1 flex items-center gap-3">
                          <button
                            onClick={() => {
                              setFilters((prev) => ({ ...prev, category: cat.name }));
                              const catSec = document.getElementById('catalog-section');
                              if (catSec) catSec.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                              isOfferZone 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                                : 'bg-[#0a5c36] hover:bg-[#08482a] text-white shadow-xs'
                            }`}
                          >
                            <span>Explore All {cat.name}</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>

                      {/* Products Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {catProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            currency={currency}
                            isWishlisted={wishlist.some((p) => p.id === product.id)}
                            onToggleWishlist={handleToggleWishlist}
                            isCompared={compareProducts.some((p) => p.id === product.id)}
                            onToggleCompare={handleToggleCompare}
                            onAddToCart={(p, qty = 1, size, price) => handleAddToCart(p, qty, undefined, size, price)}
                            onBuyNow={(p, qty = 1, size, price) => handleBuyNow(p, qty, undefined, size, price)}
                            onQuickView={(p) => setSelectedProduct(p)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                }

                return (
                  <section key={cat.id} className="space-y-4">
                    {/* Standard Category Section Header */}
                    <div className="flex items-center justify-between border-b border-stone-200/90 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-6 bg-[#0a5c36] rounded-full" />
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                          {cat.name}
                        </h3>
                        {cat.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {cat.badge}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 font-medium hidden xs:inline">
                          ({catProducts.length} items)
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, category: cat.name }));
                          const catSec = document.getElementById('catalog-section');
                          if (catSec) catSec.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-[#0a5c36] hover:text-[#08482a] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View All</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {catProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          currency={currency}
                          isWishlisted={wishlist.some((p) => p.id === product.id)}
                          onToggleWishlist={handleToggleWishlist}
                          isCompared={compareProducts.some((p) => p.id === product.id)}
                          onToggleCompare={handleToggleCompare}
                          onAddToCart={(p, qty = 1, size, price) => handleAddToCart(p, qty, undefined, size, price)}
                          onBuyNow={(p, qty = 1, size, price) => handleBuyNow(p, qty, undefined, size, price)}
                          onQuickView={(p) => setSelectedProduct(p)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200/80 p-12 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">No Products Found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  We couldn't find any products matching your active category or search query.
                </p>
              </div>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="px-4 py-2 rounded-lg bg-[#0a5c36] text-white text-xs font-bold hover:bg-[#08482a] transition-colors cursor-pointer shadow-xs"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  isWishlisted={wishlist.some((p) => p.id === product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  isCompared={compareProducts.some((p) => p.id === product.id)}
                  onToggleCompare={handleToggleCompare}
                  onAddToCart={(p, qty = 1, size, price) => handleAddToCart(p, qty, undefined, size, price)}
                  onBuyNow={(p, qty = 1, size, price) => handleBuyNow(p, qty, undefined, size, price)}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
        </>
      )}

      {/* Trust Badges Bar (100% Pure & Halal, Fast Delivery, Easy Return, Secure Payment) */}
      <section className="bg-white border-t border-b border-stone-200/90 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-stone-50/80 transition-colors">
              <div className="w-14 h-14 rounded-full border border-amber-600/40 bg-amber-50/50 flex items-center justify-center text-amber-700 shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-sm tracking-wider text-stone-900 uppercase">
                100% PURE & HALAL
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs">
                All our attars are completely alcohol-free and prepared from pure ingredients.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-stone-50/80 transition-colors">
              <div className="w-14 h-14 rounded-full border border-amber-600/40 bg-amber-50/50 flex items-center justify-center text-amber-700 shadow-xs">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-sm tracking-wider text-stone-900 uppercase">
                FAST DELIVERY BANGLADESH
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs">
                Home delivery in 24–48 hours inside Dhaka and 3–5 days across Bangladesh.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-stone-50/80 transition-colors">
              <div className="w-14 h-14 rounded-full border border-amber-600/40 bg-amber-50/50 flex items-center justify-center text-amber-700 shadow-xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-sm tracking-wider text-stone-900 uppercase">
                EASY RETURN POLICY
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs">
                Easy 7–day return if you are not satisfied or receive a defective product.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-stone-50/80 transition-colors">
              <div className="w-14 h-14 rounded-full border border-amber-600/40 bg-amber-50/50 flex items-center justify-center text-amber-700 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-sm tracking-wider text-stone-900 uppercase">
                SECURE PAYMENT
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs">
                Your payment information is 100% safe and secure with us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-stone-900 text-stone-300 text-xs border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-100 tracking-wider font-serif block" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                      AL BARAKAH
                    </span>
                    <span className="text-[9px] tracking-[0.22em] text-amber-400 font-semibold uppercase block">
                      PREMIUM
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-amber-400 font-bold text-xs tracking-wide">
                    “বরকতের সাথে বিশুদ্ধতা”
                  </p>
                  <p className="text-stone-400 text-[11px] italic">
                    • Purity with Blessing •
                  </p>
                </div>
              </div>

              <p className="text-stone-400 text-xs leading-relaxed">
                Al Barakah Premium is a luxury Islamic brand based in Bangladesh, offering high-end alcohol-free attars and authentic products.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs text-amber-400 tracking-wider uppercase border-b border-stone-800 pb-1.5">
                QUICK LINKS
              </h4>
              <ul className="space-y-1.5 text-stone-300">
                <li>
                  <button 
                    onClick={() => {
                      setActivePageView('HOME');
                      setFilters(DEFAULT_FILTERS);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setActivePageView('HOME');
                      setFilters(DEFAULT_FILTERS);
                      const catSec = document.getElementById('catalog-section');
                      if (catSec) catSec.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Shop All Products</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const aboutSec = document.getElementById('catalog-section');
                      if (aboutSec) aboutSec.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>About Us</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const footerSec = document.querySelector('footer');
                      if (footerSec) footerSec.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Contact Us</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setIsPolicyOpen(true)} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Privacy & Return Policy</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setIsPolicyOpen(true)} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Terms & Conditions</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePageView('TRACK')} 
                    className="flex items-center gap-1.5 hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-500/80" />
                    <span>Track Order</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact Info */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs text-amber-400 tracking-wider uppercase border-b border-stone-800 pb-1.5">
                CONTACT INFO
              </h4>
              <ul className="space-y-2.5 text-stone-300">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Tongi BSCIC, Gazipur, Bangladesh.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href="tel:01316534171" className="hover:text-amber-300 font-medium transition-colors">
                    01316534171
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href="mailto:info@albarakahpremium.com" className="hover:text-amber-300 transition-colors">
                    info@albarakahpremium.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-amber-400 shrink-0" />
                  <a 
                    href="https://www.facebook.com/share/19EEJXoVg1/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-amber-300 font-semibold transition-colors underline decoration-amber-500/50 underline-offset-2"
                  >
                    Al Barakah Premium
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Payment Gateways */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs text-amber-400 tracking-wider uppercase border-b border-stone-800 pb-1.5">
                PAYMENT GATEWAYS
              </h4>
              <p className="text-stone-400 text-xs mt-2 mb-2.5 leading-relaxed">
                We support trusted local payment methods in Bangladesh:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Premium Styled COD Badge */}
                <div className="bg-stone-800/90 border border-stone-700/90 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xs hover:border-amber-500/50 transition-colors">
                  <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black tracking-tight text-stone-100 uppercase leading-none">
                      Cash On Delivery
                    </div>
                    <div className="text-[9px] text-stone-400 font-medium">হাতে পেয়ে মূল্য পরিশোধ</div>
                  </div>
                </div>

                {/* Premium Styled bKash Badge */}
                <div className="bg-stone-800/90 border border-stone-700/90 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xs hover:border-pink-500/50 transition-colors">
                  <div className="w-6 h-6 rounded bg-[#E2136E]/10 border border-[#E2136E]/40 flex items-center justify-center text-[#E2136E] font-black text-xs">
                    ৳
                  </div>
                  <div>
                    <div className="text-[11px] font-black tracking-tight text-white leading-none flex items-center gap-1">
                      <span className="text-[#ff2e8c]">bKash</span>
                      <span className="text-stone-300 font-bold text-[10px]">বিকাশ</span>
                    </div>
                    <div className="text-[9px] text-stone-400 font-medium">Instant Direct Payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar - 3 Columns (Left, Center, Right) */}
          <div className="pt-6 mt-6 border-t border-stone-800/90 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
            {/* Left */}
            <div className="text-center md:text-left">
              © 2026 <strong className="text-amber-400 font-semibold">AL BARAKAH PREMIUM</strong>. All Rights Reserved.
            </div>

            {/* Center */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-stone-300">
              <button 
                onClick={() => setIsPolicyOpen(true)} 
                className="hover:text-amber-400 cursor-pointer transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-stone-700">|</span>
              <button 
                onClick={() => setIsPolicyOpen(true)} 
                className="hover:text-amber-400 cursor-pointer transition-colors"
              >
                Return Policy
              </button>
              <span className="text-stone-700">|</span>
              <button 
                onClick={() => setIsPolicyOpen(true)} 
                className="hover:text-amber-400 cursor-pointer transition-colors"
              >
                Terms & Conditions
              </button>
            </div>

            {/* Right */}
            <div className="text-center md:text-right">
              Developed by <strong className="text-amber-400 font-semibold">AL BARAKAH PREMIUM</strong>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals and Drawers */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          currency={currency}
          isWishlisted={wishlist.some((p) => p.id === selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
          isCompared={compareProducts.some((p) => p.id === selectedProduct.id)}
          onToggleCompare={handleToggleCompare}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          allProducts={products}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenPolicy={() => setIsPolicyOpen(true)}
          cartCount={totalCartCount}
          wishlistCount={wishlist.length}
          compareCount={compareProducts.length}
          onOpenCart={() => {
            setSelectedProduct(null);
            setActivePageView('CART');
          }}
          onOpenWishlist={() => {
            setSelectedProduct(null);
            setActivePageView('WISHLIST');
          }}
          onOpenCompare={() => {
            setSelectedProduct(null);
            setIsCompareModalOpen(true);
          }}
          onOpenOrders={() => {
            setSelectedProduct(null);
            setActivePageView('TRACK');
          }}
          onOpenAdmin={() => {
            setSelectedProduct(null);
            setIsAdminView(true);
          }}
          onOpenCustomerDashboard={() => {
            setSelectedProduct(null);
            setIsCustomerDashboardOpen(true);
          }}
          onOpenAuth={(tab) => {
            setSelectedProduct(null);
            setActivePageView(tab === 'TRACK' ? 'TRACK' : 'LOGIN');
          }}
          categories={categories}
          enableCustomerReviews={enableCustomerReviews}
          reviews={reviews}
          onAddReview={handleAddReview}
        />
      )}

      {/* Product Comparison Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareProducts={compareProducts}
        allProducts={products}
        onRemoveProduct={handleRemoveFromCompare}
        onClearAll={handleClearCompare}
        onAddProduct={handleToggleCompare}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
        }}
        onBuyNow={(p, qty) => {
          setIsCompareModalOpen(false);
          handleBuyNow(p, qty);
        }}
        onSelectProduct={(p) => {
          setIsCompareModalOpen(false);
          setSelectedProduct(p);
        }}
        currency={currency}
      />

      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        discountPercent={appliedDiscount}
        promoCode={appliedCoupon}
        onOrderPlaced={handleOrderPlaced}
        currency={currency}
        deliveryConfig={deliveryConfig}
        bkashConfig={bkashConfig}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
        currency={currency}
      />

      <ZipImportGuideModal
        isOpen={isZipGuideOpen}
        onClose={() => setIsZipGuideOpen(false)}
      />

      <CategoryAdminModal
        isOpen={isAdminCategoryOpen}
        onClose={() => setIsAdminCategoryOpen(false)}
        categories={categories}
        onUpdateCategories={handleUpdateCategories}
      />

      <BannerAdminModal
        isOpen={isBannerAdminOpen}
        onClose={() => setIsBannerAdminOpen(false)}
        config={heroBannerConfig}
        onSaveConfig={async (cfg) => {
          setHeroBannerConfig(cfg);
          await saveStoreSettingsToDb({ heroBanners: cfg });
          showToast('Hero & promo banners saved!');
        }}
        categories={categories}
        products={products}
      />

      {/* Customer Full Dashboard Modal (Profile, Orders, Saved Addresses CRUD, Wishlist) */}
      <CustomerDashboardModal
        isOpen={isCustomerDashboardOpen}
        onClose={() => setIsCustomerDashboardOpen(false)}
        orders={orders}
        wishlist={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        currency={currency}
      />

      {/* Customer Login & Account Modal */}
      <CustomerAuthModal
        onOpenOrderTrack={(code) => {
          setActivePageView('TRACK');
        }}
      />

      {/* Persistent Floating Compare Bar when items are selected */}
      <CompareFloatingBar
        compareProducts={compareProducts}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onRemoveProduct={handleRemoveFromCompare}
        onClearAll={handleClearCompare}
      />

      {/* Floating Cart Widget on Right Edge */}
      <FloatingCartWidget
        cart={cart}
        currency={currency}
        onOpenCart={() => setActivePageView('CART')}
      />

      {/* 🚀 High-Converting Facebook Ad Sales Landing Page */}
      {landingProduct && (
        <ProductLandingPage
          product={landingProduct}
          onClose={() => {
            setLandingProduct(null);
            const params = new URLSearchParams(window.location.search);
            if (params.has('landing') || params.has('ad') || params.has('fb')) {
              params.delete('landing');
              params.delete('ad');
              params.delete('fb');
              const newSearch = params.toString() ? `?${params.toString()}` : '';
              window.history.pushState(null, '', window.location.pathname + newSearch);
            }
          }}
          onPlaceOrder={async (orderData) => {
            const newOrder: Order = {
              id: orderData.id || `ALB-${Date.now().toString().slice(-6)}`,
              createdAt: new Date().toISOString(),
              orderStatus: 'PENDING',
              paymentStatus: 'UNPAID',
              currency: 'BDT',
              ...orderData,
            } as Order;
            await saveOrderToDb(newOrder);

            // Dispatch Gmail notification
            try {
              fetch('/api/notify-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder),
              }).catch((err) => console.warn('Order notification dispatch warning:', err));
            } catch (e) {
              console.warn('Order notification trigger error:', e);
            }

            setCart([]);
            // Track Facebook Pixel Purchase event for Landing Page orders
            trackFbPurchase(newOrder);
            showToast(`✅ অর্ডার #${newOrder.id} সফলভাবে সম্পন্ন হয়েছে! শীঘ্রই কনফার্মেশন কল করা হবে।`);
            return newOrder;
          }}
          deliveryConfig={deliveryConfig}
          onOpenStore={() => {
            setLandingProduct(null);
            setActivePageView('CATALOG');
            const params = new URLSearchParams(window.location.search);
            if (params.has('landing') || params.has('ad') || params.has('fb')) {
              params.delete('landing');
              params.delete('ad');
              params.delete('fb');
              const newSearch = params.toString() ? `?${params.toString()}` : '';
              window.history.pushState(null, '', window.location.pathname + newSearch);
            }
          }}
        />
      )}
    </div>
  );
}
