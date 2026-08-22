import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Tag,
  Sparkles,
  Star,
  ShieldCheck,
  Settings,
  LogOut,
  Store,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  Mail,
  UserPlus,
  Menu,
  ShoppingBag,
  Upload,
  AlertTriangle,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  FolderArchive,
  Image as ImageIcon,
  SlidersHorizontal,
  MoveUp,
  MoveDown,
  QrCode,
  Radio,
  ArrowRight,
  Globe,
  Filter
} from 'lucide-react';
import { Product, Order, CategoryItem, HeroBannerConfig, HeroSlide, PromoCard, ProductReview, TopSellingSectionConfig, TopSellingItem, CourierConfig, DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from '../types';
import { Layers, Flame, Truck, Send, CheckCircle, User, Download, Database, HardDriveDownload, RefreshCw } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { DEFAULT_HERO_CONFIG } from './HeroBanner';
import { compressImageFile, compressDataUrl } from '../utils/imageCompressor';
import { DEFAULT_TOP_SELLING_CONFIG } from '../types/topSelling';
import { TopSellingAdmin } from './TopSellingAdmin';
import { TakaIcon } from './TakaIcon';
import { CourierSettingsModal } from './CourierSettingsModal';
import { QRCodeGeneratorModal } from './QRCodeGeneratorModal';
import { LandingPageAdminModal } from './LandingPageAdminModal';
import { FacebookPixelSettingsModal } from './FacebookPixelSettingsModal';
import { FacebookPixelConfig, DEFAULT_FACEBOOK_PIXEL_CONFIG, BKashPaymentConfig, DEFAULT_BKASH_CONFIG } from '../types';
import { BKashSettingsModal } from './BKashSettingsModal';
import { ProfitAnalyticsReports } from './ProfitAnalyticsReports';
import { DEFAULT_COURIER_CONFIG, dispatchOrderToCourier, sendOrderToSteadfast, sendOrderToPathao } from '../services/courierService';
import { createFullDatabaseBackup, restoreFullDatabaseBackup, DatabaseBackupPayload, deleteOrderFromDb } from '../services/firebaseService';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'landingPages'
  | 'topSelling'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'coupons'
  | 'banners'
  | 'categories'
  | 'reviews'
  | 'qrcode'
  | 'staff'
  | 'settings';

export interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  minSpend: number;
  status: 'active' | 'expired';
  usageCount: number;
}

export interface ReviewItem {
  id: string;
  userName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Store Manager' | 'Order Specialist';
  status: 'Active' | 'Inactive';
}

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  categories: CategoryItem[];
  currency: 'USD' | 'BDT';
  adminEmail: string;
  adminRole: string;
  onViewStore: () => void;
  onSignOut: () => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
  staffList: StaffMember[];
  onUpdateStaffList: (staff: StaffMember[]) => void;
  heroBannerConfig?: HeroBannerConfig;
  onUpdateHeroBannerConfig?: (config: HeroBannerConfig) => void;
  topSellingConfig?: TopSellingSectionConfig;
  onUpdateTopSellingConfig?: (config: TopSellingSectionConfig) => void;
  courierConfig?: CourierConfig;
  onUpdateCourierConfig?: (config: CourierConfig) => void;
  enableCustomerReviews?: boolean;
  onToggleCustomerReviews?: (enabled: boolean) => void;
  customerReviews?: ProductReview[];
  onDeleteReview?: (id: string) => void;
  deliveryConfig?: DeliveryConfig;
  onUpdateDeliveryConfig?: (config: DeliveryConfig) => void;
  facebookPixelConfig?: FacebookPixelConfig;
  onUpdateFacebookPixelConfig?: (config: FacebookPixelConfig) => void;
  bkashConfig?: BKashPaymentConfig;
  onUpdateBkashConfig?: (config: BKashPaymentConfig) => void;
  onPreviewLandingPage?: (product: Product) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  categories,
  currency,
  adminEmail,
  adminRole,
  onViewStore,
  onSignOut,
  onUpdateProducts,
  onUpdateOrders,
  onUpdateCategories,
  staffList,
  onUpdateStaffList,
  heroBannerConfig = DEFAULT_HERO_CONFIG,
  onUpdateHeroBannerConfig,
  topSellingConfig = DEFAULT_TOP_SELLING_CONFIG,
  onUpdateTopSellingConfig,
  courierConfig = DEFAULT_COURIER_CONFIG,
  onUpdateCourierConfig,
  enableCustomerReviews = true,
  onToggleCustomerReviews,
  customerReviews = [],
  onDeleteReview,
  deliveryConfig = DEFAULT_DELIVERY_CONFIG,
  onUpdateDeliveryConfig,
  facebookPixelConfig = DEFAULT_FACEBOOK_PIXEL_CONFIG,
  onUpdateFacebookPixelConfig,
  bkashConfig = DEFAULT_BKASH_CONFIG,
  onUpdateBkashConfig,
  onPreviewLandingPage,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [courierDispatchingOrderId, setCourierDispatchingOrderId] = useState<string | null>(null);

  // Facebook Ad & Landing Page Studio State
  const [isLandingPageModalOpen, setIsLandingPageModalOpen] = useState(false);
  const [selectedLandingProduct, setSelectedLandingProduct] = useState<Product | null>(null);
  const [landingPageSearch, setLandingPageSearch] = useState('');

  const handleOpenLandingCustomizer = (prod: Product) => {
    setSelectedLandingProduct(prod);
    setIsLandingPageModalOpen(true);
  };

  const handleSaveLandingPageConfig = (productId: string, config: any) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          landingPage: config,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    showToast('✅ ল্যান্ডিং পেজ ও ফেসবুক অ্যাড সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };
  
  // Products management states
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategoryFilter, setSelectedProductCategoryFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodFormId, setProdFormId] = useState<string | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormSlug, setProdFormSlug] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState('Organic Foods');
  const [prodFormPrice, setProdFormPrice] = useState('15');
  const [prodFormCostPrice, setProdFormCostPrice] = useState('');
  const [prodFormOriginalPrice, setProdFormOriginalPrice] = useState('20');
  const [prodFormImages, setProdFormImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
    '',
    ''
  ]);
  const [prodFormDescription, setProdFormDescription] = useState('Premium quality authentic product with high purity.');
  const [prodFormStock, setProdFormStock] = useState('30');
  const [prodFormBadge, setProdFormBadge] = useState<string>('NEW');
  const [prodFormSizes, setProdFormSizes] = useState<string[]>([]);
  const [customVariantInput, setCustomVariantInput] = useState<string>('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Database Backup & Restore state
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreProgressMsg, setRestoreProgressMsg] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<DatabaseBackupPayload | null>(null);

  // QR Code & Bottle Sticker Generator state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);

  // Category Management state
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormSlug, setCatFormSlug] = useState('');
  const [catFormImage, setCatFormImage] = useState('');
  const [catFormBadge, setCatFormBadge] = useState('');
  const [catFormEnabled, setCatFormEnabled] = useState(true);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const CATEGORY_PRESET_IMAGES = [
    { label: 'Organic Foods / Honey', url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80' },
    { label: 'Premium Watches', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
    { label: 'Luxury Attar / Oudh', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80' },
    { label: 'Sunnah Items / Dates', url: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=600&auto=format&fit=crop&q=80' },
    { label: 'Women Collection', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80' },
    { label: 'Medicine & Health', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80' },
    { label: 'Baby & Kids Toys', url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80' },
    { label: 'Combo & Gift Packages', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80' },
    { label: 'Offer & Flash Deals', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80' },
    { label: 'Dry Fruits & Nuts', url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80' },
  ];

  const openAddCategoryModal = () => {
    setEditingCategoryId(null);
    setCatFormName('');
    setCatFormSlug('');
    setCatFormImage('https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80');
    setCatFormBadge('');
    setCatFormEnabled(true);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setCatFormName(cat.name);
    setCatFormSlug(cat.slug || generateSlug(cat.name));
    setCatFormImage(cat.image || '');
    setCatFormBadge(cat.badge || '');
    setCatFormEnabled(cat.enabled);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      alert('দয়া করে ক্যাটাগরির নাম লিখুন');
      return;
    }

    const finalSlug = catFormSlug.trim() || generateSlug(catFormName);
    const finalImage = catFormImage.trim() || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80';

    if (editingCategoryId) {
      // Update existing category
      const updated = categories.map((c) => {
        if (c.id === editingCategoryId) {
          return {
            ...c,
            name: catFormName.trim(),
            slug: finalSlug,
            image: finalImage,
            badge: catFormBadge.trim() || undefined,
            enabled: catFormEnabled,
          };
        }
        return c;
      });
      onUpdateCategories(updated);
      showToast(`ক্যাটাগরি "${catFormName.trim()}" সফলভাবে আপডেট করা হয়েছে!`);
    } else {
      // Create new category
      const newCategory: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: catFormName.trim(),
        slug: finalSlug,
        image: finalImage,
        badge: catFormBadge.trim() || undefined,
        enabled: catFormEnabled,
      };
      onUpdateCategories([...categories, newCategory]);
      showToast(`নতুন ক্যাটাগরি "${catFormName.trim()}" সফলভাবে যোগ করা হয়েছে!`);
    }

    setIsCategoryModalOpen(false);
  };

  const handleToggleCategory = (id: string) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    onUpdateCategories(updated);
    const target = categories.find((c) => c.id === id);
    if (target) {
      showToast(`"${target.name}" ক্যাটাগরি ${!target.enabled ? 'চালু (ON)' : 'বন্ধ (OFF)'} করা হয়েছে`);
    }
  };

  const handleToggleAllCategories = (status: boolean) => {
    const updated = categories.map((c) => ({ ...c, enabled: status }));
    onUpdateCategories(updated);
    showToast(status ? 'সবগুলো ক্যাটাগরি চালু (ON) করা হয়েছে' : 'সবগুলো ক্যাটাগরি বন্ধ (OFF) করা হয়েছে');
  };

  // --- Database Backup & Restore Handlers ---
  const handleDownloadFullBackup = async () => {
    try {
      setIsExportingBackup(true);
      const backupData = await createFullDatabaseBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `albarakah_db_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('সম্পূর্ণ ডাটাবেস ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch (error) {
      console.error('Export backup error:', error);
      alert('ডাটাবেস ব্যাকআপ তৈরি করতে সমস্যা হয়েছে। দয়া করে ফায়ারবেস কানেকশন চেক করুন।');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleFileUploadForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as DatabaseBackupPayload;
        if (!parsed || !parsed.data) {
          alert('ভুল ফরম্যাটের ব্যাকআপ ফাইল। দয়া করে সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
          return;
        }
        setPendingRestoreData(parsed);
        setShowRestoreConfirmModal(true);
      } catch (err) {
        alert('ফাইলটি সঠিক JSON ফরম্যাটে নেই।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      setIsRestoringBackup(true);
      setRestoreProgressMsg('রিস্টোর শুরু হচ্ছে...');
      const res = await restoreFullDatabaseBackup(pendingRestoreData, (msg) => {
        setRestoreProgressMsg(msg);
      });
      setShowRestoreConfirmModal(false);
      setPendingRestoreData(null);
      showToast(`ডাটাবেস সফলভাবে রিস্টোর হয়েছে! (${res.counts.products} প্রোডাক্ট, ${res.counts.orders} অর্ডার, ${res.counts.categories} ক্যাটাগরি)`);
    } catch (err) {
      console.error('Restore error:', err);
      alert('ডাটাবেস রিস্টোর করতে সমস্যা হয়েছে।');
    } finally {
      setIsRestoringBackup(false);
      setRestoreProgressMsg(null);
    }
  };

  const handleReorderCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onUpdateCategories(reordered);
    showToast(`"${temp.name}" এর পজিশন পরিবর্তন করা হয়েছে`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const updated = categories.filter((c) => c.id !== categoryToDelete.id);
    onUpdateCategories(updated);
    showToast(`"${categoryToDelete.name}" ক্যাটাগরি মুছে ফেলা হয়েছে`);
    setCategoryToDelete(null);
  };

  const handleResetCategoriesToDefault = () => {
    if (window.confirm('আপনি কি সব ক্যাটাগরি ডিফল্ট ৯টি আইটেমে রিসেট করতে চান?')) {
      onUpdateCategories(INITIAL_CATEGORIES);
      showToast('সব ক্যাটাগরি ডিফল্ট ৯টিতে রিসেট করা হয়েছে');
    }
  };

  const handleCategoryImageUpload = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.72);
      setCatFormImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCatFormImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const QUICK_ADD_PRESETS = [
    { label: '+ 3ml, 6ml, 12ml', variants: ['3ml', '6ml', '12ml'] },
    { label: '+ 2kg, 5kg, 10kg', variants: ['2kg', '5kg', '10kg'] },
    { label: '+ 500g, 1kg, 2kg', variants: ['500g', '1kg', '2kg'] },
    { label: '+ 250g, 500g, 1kg', variants: ['250g', '500g', '1kg'] },
    { label: '+ 1 Litre, 5 Litre', variants: ['1 Litre', '5 Litre'] },
    { label: '+ 1 Pcs, 2 Pcs, 5 Pcs', variants: ['1 Pcs', '2 Pcs', '5 Pcs'] },
    { label: '+ 1 Box, 2 Box', variants: ['1 Box', '2 Box'] },
    { label: '+ 1 Strip, 1 Box', variants: ['1 Strip', '1 Box'] },
    { label: '+ S, M, L, XL', variants: ['S', 'M', 'L', 'XL'] },
  ];

  const handleApplyQuickAdd = (variants: string[]) => {
    // Append or replace unique variants
    const combined = Array.from(new Set([...prodFormSizes, ...variants]));
    setProdFormSizes(combined);
  };

  const handleAddCustomVariant = () => {
    if (!customVariantInput.trim()) return;
    const trimmed = customVariantInput.trim();
    if (!prodFormSizes.includes(trimmed)) {
      setProdFormSizes([...prodFormSizes, trimmed]);
    }
    setCustomVariantInput('');
  };

  const handleRemoveVariant = (variantToRemove: string) => {
    setProdFormSizes(prodFormSizes.filter((v) => v !== variantToRemove));
  };

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleProductImageSlotUpload = async (slotIndex: number, file: File) => {
    try {
      const compressed = await compressImageFile(file, 600, 600, 0.70);
      const updated = [...prodFormImages];
      updated[slotIndex] = compressed;
      setProdFormImages(updated);
    } catch {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const raw = e.target.result as string;
          const compressed = await compressDataUrl(raw, 600, 600, 0.70);
          const updated = [...prodFormImages];
          updated[slotIndex] = compressed;
          setProdFormImages(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroSlideImageUpload = async (slideId: string, file: File) => {
    try {
      const compressed = await compressImageFile(file, 900, 500, 0.70);
      const updated = bannerConfigState.slides.map((s) =>
        s.id === slideId ? { ...s, image: compressed } : s
      );
      setBannerConfigState({ ...bannerConfigState, slides: updated });
    } catch {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const raw = e.target.result as string;
          const compressed = await compressDataUrl(raw, 900, 500, 0.70);
          const updated = bannerConfigState.slides.map((s) =>
            s.id === slideId ? { ...s, image: compressed } : s
          );
          setBannerConfigState({ ...bannerConfigState, slides: updated });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromoImageUpload = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.70);
      setBannerConfigState({
        ...bannerConfigState,
        promoCard: {
          ...bannerConfigState.promoCard,
          image: compressed,
        },
      });
    } catch {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const raw = e.target.result as string;
          const compressed = await compressDataUrl(raw, 500, 500, 0.70);
          setBannerConfigState({
            ...bannerConfigState,
            promoCard: {
              ...bannerConfigState.promoCard,
              image: compressed,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddProductModal = () => {
    setProdFormId(null);
    setProdFormName('');
    setProdFormSlug('');
    setProdFormCategory('Organic Foods');
    setProdFormPrice('15');
    setProdFormCostPrice('');
    setProdFormOriginalPrice('');
    setProdFormImages([
      'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
      '',
      ''
    ]);
    setProdFormDescription('Premium quality authentic product with 100% genuine sourcing.');
    setProdFormStock('30');
    setProdFormBadge('NEW');
    setProdFormSizes([]);
    setCustomVariantInput('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setProdFormId(prod.id);
    setProdFormName(prod.name);
    setProdFormSlug(prod.slug || generateSlug(prod.name));
    setProdFormCategory(prod.category);
    setProdFormPrice(String(prod.price));
    setProdFormCostPrice(prod.costPrice ? String(prod.costPrice) : '');
    setProdFormOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
    
    // Prepare 3 images array
    const existingImgs = prod.images && prod.images.length > 0 ? prod.images : [prod.image || ''];
    setProdFormImages([
      existingImgs[0] || prod.image || '',
      existingImgs[1] || '',
      existingImgs[2] || ''
    ]);
    setProdFormDescription(prod.description || '');
    setProdFormStock(String(prod.stockCount ?? 25));
    setProdFormBadge(prod.badge || '');
    setProdFormSizes(prod.sizes && prod.sizes.length > 0 ? prod.sizes : (prod.weight ? [prod.weight] : []));
    setCustomVariantInput('');
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim()) return;

    // Sanitize and compress any base64 images
    const compressedImages = await Promise.all(
      prodFormImages.map(async (img) => {
        if (img && img.startsWith('data:image/') && img.length > 25000) {
          try {
            return await compressDataUrl(img, 600, 600, 0.70);
          } catch {
            return img;
          }
        }
        return img;
      })
    );

    // Filter valid images
    const validImages = compressedImages.filter(img => Boolean(img && img.trim()));
    const primaryImg = validImages[0] || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80';
    const allImages = validImages.length > 0 ? validImages : [primaryImg];
    const finalSlug = prodFormSlug.trim() || generateSlug(prodFormName);

    if (prodFormId) {
      const updated = products.map((p) => {
        if (p.id === prodFormId) {
          return {
            ...p,
            name: prodFormName.trim(),
            slug: finalSlug,
            category: prodFormCategory,
            price: parseFloat(prodFormPrice) || p.price,
            costPrice: prodFormCostPrice ? parseFloat(prodFormCostPrice) : undefined,
            originalPrice: prodFormOriginalPrice ? parseFloat(prodFormOriginalPrice) : undefined,
            image: primaryImg,
            images: allImages,
            description: prodFormDescription.trim(),
            stockCount: parseInt(prodFormStock) || 25,
            inStock: (parseInt(prodFormStock) || 0) > 0,
            badge: (prodFormBadge as any) || undefined,
            sizes: prodFormSizes.length > 0 ? prodFormSizes : undefined,
          };
        }
        return p;
      });
      await onUpdateProducts(updated);
      showToast(`"${prodFormName.trim()}" তথ্য সফলভাবে আপডেট হয়েছে!`);
    } else {
      const newP: Product = {
        id: `prod-${Date.now()}`,
        name: prodFormName.trim(),
        slug: finalSlug,
        category: prodFormCategory,
        price: parseFloat(prodFormPrice) || 20,
        costPrice: prodFormCostPrice ? parseFloat(prodFormCostPrice) : undefined,
        originalPrice: prodFormOriginalPrice ? parseFloat(prodFormOriginalPrice) : undefined,
        rating: 5.0,
        reviewCount: 1,
        image: primaryImg,
        images: allImages,
        description: prodFormDescription.trim(),
        features: ['100% Genuine Certified', 'Fast Cash on Delivery', 'Premium Packaging'],
        inStock: (parseInt(prodFormStock) || 1) > 0,
        stockCount: parseInt(prodFormStock) || 25,
        badge: (prodFormBadge as any) || undefined,
        sizes: prodFormSizes.length > 0 ? prodFormSizes : undefined,
        tags: [prodFormCategory.toLowerCase(), 'new-product'],
      };
      await onUpdateProducts([newP, ...products]);
      showToast(`নতুন প্রোডাক্ট "${newP.name}" ক্লাউড ডাটাবেজে সফলভাবে যোগ করা হয়েছে!`);
    }
    setIsProductModalOpen(false);
  };

  // Orders filter & details
  const [orderFilter, setOrderFilter] = useState<'all' | 'advance_paid' | 'advance_pending' | 'full_paid' | 'verified' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'fake'>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const handleUpdateDeliveryPaymentStatus = (orderId: string, paymentStatus: Order['deliveryPaymentStatus']) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          deliveryPaymentStatus: paymentStatus,
          // Auto advance status if marked verified or advance paid
          ...(paymentStatus === 'ADVANCE_PAID' && {
            advanceAmount: o.advanceAmount || o.shipping || 80,
            dueAmountOnDelivery: Math.max(0, (o.total || 0) - (o.advanceAmount || o.shipping || 80)),
          }),
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
      setSelectedOrderDetails({
        ...selectedOrderDetails,
        deliveryPaymentStatus: paymentStatus,
      });
    }
    showToast(`অর্ডারের পেমেন্ট স্ট্যাটাস '${paymentStatus}' এ আপডেট করা হয়েছে!`);
  };

  const handleToggleFakeSuspicion = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const nextState = !o.isFakeSuspected;
        return {
          ...o,
          isFakeSuspected: nextState,
          deliveryPaymentStatus: nextState ? ('FAKE_SUSPECTED' as const) : o.deliveryPaymentStatus,
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    showToast('অর্ডারের ঝুঁকি ও ফেক স্ট্যাটাস আপডেট করা হয়েছে');
  };

  const handleOpenWhatsAppReminder = (order: Order) => {
    const rawPhone = (order.customer?.phone || (order as any).shippingAddress?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('880') ? rawPhone : `880${rawPhone.replace(/^0/, '')}`;
    const orderTotal = Math.round(getOrderTotal(order) * rate);
    const advance = order.advanceAmount || order.shipping || (insideDhakaDelivery ?? 80);
    const due = Math.max(0, orderTotal - advance);
    const bkashNum = bkashConfig.personalNumber || '01316534171';
    
    const message = `আসসালামু আলাইকুম ${getCustomerName(order)},\nআল-বারাকাহ প্রিমিয়ামে আপনার অর্ডারটি (#{order.id.slice(-6).toUpperCase()}) কনফার্ম করতে অনুগ্রহ করে অগ্রিম ডেলিভারি চার্জ ৳${advance} টাকা বিকাশ করুন।\n\nবিকাশ নম্বর: ${bkashNum} (Personal - Send Money)\n\nডেলিভারি চার্জ বিকাশ করার পর TrxID টি আমাদের মেসেজ দিয়ে জানালে আমরা পার্সেলটি দ্রুত কুরিয়ারে পাঠিয়ে দেব।\nপণ্য হাতে পেয়ে বাকি ৳${due} টাকা ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।\nধন্যবাদ!`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Coupons State
  const [coupons, setCoupons] = useState<CouponItem[]>([
    { id: 'c1', code: 'BARAKAH10', discountPercent: 10, minSpend: 1500, status: 'active', usageCount: 48 },
    { id: 'c2', code: 'RAMADAN20', discountPercent: 20, minSpend: 3000, status: 'active', usageCount: 112 },
    { id: 'c3', code: 'OUD500', discountPercent: 15, minSpend: 2500, status: 'expired', usageCount: 30 },
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(1000);

  // Hero & Banners State
  const [bannerConfigState, setBannerConfigState] = useState<HeroBannerConfig>(heroBannerConfig);
  const [topSellingState, setTopSellingState] = useState<TopSellingSectionConfig>(topSellingConfig);
  const [bannerSubTab, setBannerSubTab] = useState<'SLIDES' | 'PROMO' | 'TOP_SELLING'>('SLIDES');
  const [bannerSavedToast, setBannerSavedToast] = useState(false);

  useEffect(() => {
    if (heroBannerConfig && heroBannerConfig.slides) {
      setBannerConfigState(heroBannerConfig);
    }
  }, [heroBannerConfig]);

  useEffect(() => {
    if (topSellingConfig) {
      setTopSellingState(topSellingConfig);
    }
  }, [topSellingConfig]);

  const handleSaveBanners = (newCfg: HeroBannerConfig) => {
    setBannerConfigState(newCfg);
    if (onUpdateHeroBannerConfig) {
      onUpdateHeroBannerConfig(newCfg);
    }
    setBannerSavedToast(true);
    setTimeout(() => setBannerSavedToast(false), 2500);
  };

  const [isSavingTopSelling, setIsSavingTopSelling] = useState(false);

  const handleSaveTopSellingAdmin = async (newCfg: TopSellingSectionConfig) => {
    setIsSavingTopSelling(true);
    try {
      setTopSellingState(newCfg);
      if (onUpdateTopSellingConfig) {
        await onUpdateTopSellingConfig(newCfg);
      }
      setBannerSavedToast(true);
      setTimeout(() => setBannerSavedToast(false), 3000);
    } catch (err) {
      console.error('Error saving top selling config:', err);
      alert('টপ সেলিং সেভ করার সময় ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSavingTopSelling(false);
    }
  };

  // Customer Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: 'r1',
      userName: 'Md. Rafiqul Islam',
      productName: 'Royal Skeleton Automatic Watch',
      rating: 5,
      comment: 'Mashallah! Original automatic watch with stunning Arabic numerals. Very premium packaging.',
      date: '2026-08-12',
      approved: true
    },
    {
      id: 'r2',
      userName: 'Tariq Mahmud',
      productName: 'VIP Grade-A Madinah Ajwa Dates',
      rating: 5,
      comment: 'Fresh, soft and authentically imported Ajwa dates from Madinah. Highly recommended.',
      date: '2026-08-13',
      approved: true
    },
    {
      id: 'r3',
      userName: 'Salma Khatun',
      productName: 'Dehn Al Oudh Cambodi Special',
      rating: 4,
      comment: 'Fragrance lasts over 24 hours without any alcohol harshness. Very soothing.',
      date: '2026-08-14',
      approved: true
    },
  ]);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Super Admin' | 'Store Manager' | 'Order Specialist'>('Store Manager');

  // Store Settings
  const [storeName, setStoreName] = useState('Al Barakah Premium');
  const [supportPhone, setSupportPhone] = useState('+880 1700-000000');
  const [insideDhakaDelivery, setInsideDhakaDelivery] = useState(deliveryConfig?.insideDhakaCharge ?? 80);
  const [outsideDhakaDelivery, setOutsideDhakaDelivery] = useState(deliveryConfig?.outsideDhakaCharge ?? 160);
  const [subDhakaDelivery, setSubDhakaDelivery] = useState(deliveryConfig?.subDhakaCharge ?? 100);
  const [isSubDhakaEnabled, setIsSubDhakaEnabled] = useState(deliveryConfig?.enableSubDhaka ?? false);
  const [isFreeDeliveryEnabled, setIsFreeDeliveryEnabled] = useState(deliveryConfig?.enableFreeDelivery ?? false);
  const [freeDeliveryThresholdAmount, setFreeDeliveryThresholdAmount] = useState(deliveryConfig?.freeDeliveryThreshold ?? 2000);
  const [estInsideDhakaText, setEstInsideDhakaText] = useState(deliveryConfig?.estimatedInsideDhakaDays ?? '১-২ কার্যদিবস');
  const [estOutsideDhakaText, setEstOutsideDhakaText] = useState(deliveryConfig?.estimatedOutsideDhakaDays ?? '২-৪ কার্যদিবস');
  const [deliveryNoticeStr, setDeliveryNoticeStr] = useState(deliveryConfig?.deliveryNotice ?? 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।');
  const [requireAdvanceDeliveryCharge, setRequireAdvanceDeliveryCharge] = useState(deliveryConfig?.requireAdvanceDeliveryCharge ?? true);
  const [advanceDeliveryNotice, setAdvanceDeliveryNotice] = useState(deliveryConfig?.advanceDeliveryNotice ?? 'ফেক অর্ডার ও অনাকাঙ্ক্ষিত রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে।');

  useEffect(() => {
    if (deliveryConfig) {
      setInsideDhakaDelivery(deliveryConfig.insideDhakaCharge ?? 80);
      setOutsideDhakaDelivery(deliveryConfig.outsideDhakaCharge ?? 160);
      setSubDhakaDelivery(deliveryConfig.subDhakaCharge ?? 100);
      setIsSubDhakaEnabled(deliveryConfig.enableSubDhaka ?? false);
      setIsFreeDeliveryEnabled(deliveryConfig.enableFreeDelivery ?? false);
      setFreeDeliveryThresholdAmount(deliveryConfig.freeDeliveryThreshold ?? 2000);
      setEstInsideDhakaText(deliveryConfig.estimatedInsideDhakaDays ?? '১-২ কার্যদিবস');
      setEstOutsideDhakaText(deliveryConfig.estimatedOutsideDhakaDays ?? '২-৪ কার্যদিবস');
      setDeliveryNoticeStr(deliveryConfig.deliveryNotice ?? 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।');
      setRequireAdvanceDeliveryCharge(deliveryConfig.requireAdvanceDeliveryCharge ?? true);
      setAdvanceDeliveryNotice(deliveryConfig.advanceDeliveryNotice ?? 'ফেক অর্ডার ও অনাকাঙ্ক্ষিত রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে।');
    }
  }, [deliveryConfig]);

  const handleSaveDeliverySettings = () => {
    const updated: DeliveryConfig = {
      insideDhakaCharge: Number(insideDhakaDelivery) || 0,
      outsideDhakaCharge: Number(outsideDhakaDelivery) || 0,
      subDhakaCharge: Number(subDhakaDelivery) || 0,
      enableSubDhaka: Boolean(isSubDhakaEnabled),
      freeDeliveryThreshold: Number(freeDeliveryThresholdAmount) || 0,
      enableFreeDelivery: Boolean(isFreeDeliveryEnabled),
      estimatedInsideDhakaDays: estInsideDhakaText.trim(),
      estimatedOutsideDhakaDays: estOutsideDhakaText.trim(),
      deliveryNotice: deliveryNoticeStr.trim(),
      requireAdvanceDeliveryCharge: Boolean(requireAdvanceDeliveryCharge),
      advanceDeliveryNotice: advanceDeliveryNotice.trim(),
    };
    if (onUpdateDeliveryConfig) {
      onUpdateDeliveryConfig(updated);
    }
    showToast('✅ ডেলিভারি চার্জ ও অগ্রিম পেমেন্ট পলিসি সফলভাবে সেভ হয়েছে!');
  };

  const rate = 1;
  const symbol = '৳';

  // Metrics Calculation & Safe Accessors
  const getOrderTotal = (o: Order) => (o as any).totalAmount ?? o.total ?? o.subtotal ?? 0;
  const getCustomerName = (o: Order) => (o as any).shippingAddress?.name || o.customer?.fullName || (o as any).customerName || 'Customer';
  const getCustomerPhone = (o: Order) => (o as any).shippingAddress?.phone || o.customer?.phone || (o as any).customerPhone || 'N/A';
  const getCustomerAddress = (o: Order) => (o as any).shippingAddress?.address || o.customer?.address || (o as any).deliveryAddress || 'N/A';
  const getCustomerZip = (o: Order) => (o as any).shippingAddress?.zipCode || o.customer?.postalCode || 'N/A';
  const getPaymentMethod = (o: Order) => o.paymentMethod || o.customer?.paymentMethod || 'COD';
  const getShippingZone = (o: Order) => (o as any).shippingZone || o.customer?.city || 'Dhaka';
  const getOrderStatus = (o: Order) => ((o.status || (o as any).orderStatus || 'Pending') as string).toLowerCase();

  const deliveredOrders = orders.filter((o) => getOrderStatus(o) === 'delivered');
  const pendingOrders = orders.filter((o) => ['pending', 'processing'].includes(getOrderStatus(o)));
  
  const deliveredSales = deliveredOrders.reduce((sum, o) => sum + getOrderTotal(o) * rate, 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + getOrderTotal(o) * rate, 0);
  
  const uniqueCustomers = Array.from(new Set(orders.map((o) => getCustomerPhone(o) || getCustomerName(o)))).length;

  // Chart data simulation (weekly bar chart)
  const salesBarData = [
    { day: 'Sat', amount: 5200, height: '40%' },
    { day: 'Sun', amount: 7400, height: '55%' },
    { day: 'Mon', amount: 3800, height: '30%' },
    { day: 'Tue', amount: 9600, height: '70%' },
    { day: 'Wed', amount: 6100, height: '45%' },
    { day: 'Thu', amount: 11200, height: '82%' },
    { day: 'Fri', amount: 14800, height: '95%' },
  ];

  // Helper to match category by name or slug flexibly
  const isCategoryMatch = (prodCategory: string | undefined, targetCategory: string) => {
    if (!prodCategory || !targetCategory) return false;
    const pCat = prodCategory.trim().toLowerCase();
    const tCat = targetCategory.trim().toLowerCase();
    if (pCat === tCat) return true;
    
    // Normalize dashes and special chars
    const pNorm = pCat.replace(/[\s\-_&]+/g, '');
    const tNorm = tCat.replace(/[\s\-_&]+/g, '');
    return pNorm === tNorm || pCat.includes(tCat) || tCat.includes(pCat);
  };

  // Distinct available categories list combining dynamic DB categories + INITIAL_CATEGORIES + products
  const availableProductCategories = useMemo(() => {
    const orderedList: string[] = [];
    const seen = new Set<string>();

    const addCategory = (name: string | undefined) => {
      if (!name) return;
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        orderedList.push(trimmed);
      }
    };

    // 1. Dynamic categories from Firestore
    if (categories && categories.length > 0) {
      categories.forEach((c) => addCategory(c.name));
    }

    // 2. Standard 9 initial store categories
    INITIAL_CATEGORIES.forEach((c) => addCategory(c.name));

    // 3. Any additional categories found in products
    products.forEach((p) => addCategory(p.category));

    return orderedList;
  }, [categories, products]);

  // Helper to calculate product counts per category for the filter bar
  const productCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableProductCategories.forEach((catName) => {
      let matchCount = 0;
      products.forEach((p) => {
        if (isCategoryMatch(p.category, catName)) {
          matchCount++;
        }
      });
      counts[catName] = matchCount;
    });
    return counts;
  }, [products, availableProductCategories]);

  // Filtered products list based on category pill & search query
  const filteredProductsList = useMemo(() => {
    return products.filter((p) => {
      // 1. Category Filter
      if (selectedProductCategoryFilter !== 'all') {
        if (!isCategoryMatch(p.category, selectedProductCategoryFilter)) {
          return false;
        }
      }
      // 2. Search Query Filter
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesId = (p.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedProductCategoryFilter, productSearch]);

  // Helper to handle product deletion
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProductToDelete(prod);
    }
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const deletedName = productToDelete.name;
    onUpdateProducts(products.filter((p) => p.id !== productToDelete.id));
    setProductToDelete(null);
    showToast(`"${deletedName}" সফলভাবে ডিলিট করা হয়েছে!`);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.id;
    const targetOrderLabel = `#${targetId.slice(-6).toUpperCase()}`;

    try {
      await deleteOrderFromDb(targetId);
    } catch (err) {
      console.error('Failed to delete order directly from Firestore:', err);
    }

    const remaining = orders.filter((o) => o.id !== targetId);
    onUpdateOrders(remaining);

    if (selectedOrderDetails?.id === targetId) {
      setSelectedOrderDetails(null);
    }

    setOrderToDelete(null);
    showToast(`অর্ডার ${targetOrderLabel} সফলভাবে ডাটাবেজ থেকে মুছে ফেলা হয়েছে`);
  };

  // Helper to change order status
  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    onUpdateOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // If auto-send on confirm is enabled and status changed to Shipped/Processing
    if (
      courierConfig.autoSendOnConfirm &&
      (newStatus === 'Shipped' || newStatus === 'Processing' || newStatus === 'shipped' || newStatus === 'processing')
    ) {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder && !targetOrder.courierConsignmentId) {
        handleSendOrderToCourier(targetOrder);
      }
    }
  };

  // One-Click Courier Dispatch Handler
  const handleSendOrderToCourier = async (
    order: Order,
    preferredProvider?: 'steadfast' | 'pathao'
  ) => {
    const provider: 'steadfast' | 'pathao' =
      preferredProvider ||
      (courierConfig.defaultCourier === 'pathao' ? 'pathao' : 'steadfast');

    if (provider === 'steadfast' && (!courierConfig.steadfast.apiKey || !courierConfig.steadfast.secretKey)) {
      setIsCourierModalOpen(true);
      showToast('অনুগ্রহ করে আগে Steadfast API Key এবং Secret Key কনফিগার করুন');
      return;
    }

    if (
      provider === 'pathao' &&
      (!courierConfig.pathao.clientId ||
        !courierConfig.pathao.clientSecret ||
        !courierConfig.pathao.username ||
        !courierConfig.pathao.password)
    ) {
      setIsCourierModalOpen(true);
      showToast('অনুগ্রহ করে আগে Pathao API ক্রেডেনশিয়াল কনফিগার করুন');
      return;
    }

    setCourierDispatchingOrderId(order.id);
    showToast(`${provider === 'steadfast' ? 'Steadfast' : 'Pathao'} কুরিয়ারে বুকিং পাঠানো হচ্ছে...`);

    try {
      const res = await dispatchOrderToCourier(order, courierConfig, provider);

      if (res.success && res.consignmentId) {
        const updatedOrders = orders.map((o) => {
          if (o.id === order.id) {
            return {
              ...o,
              status: 'Shipped' as Order['status'],
              courierProvider: res.provider,
              courierConsignmentId: res.consignmentId,
              courierTrackingCode: res.trackingCode,
              courierStatus: res.status || 'in_review',
              courierSentAt: new Date().toISOString(),
              courierResponse: res.raw,
            };
          }
          return o;
        });

        onUpdateOrders(updatedOrders);
        if (selectedOrderDetails?.id === order.id) {
          setSelectedOrderDetails((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'Shipped' as Order['status'],
                  courierProvider: res.provider,
                  courierConsignmentId: res.consignmentId,
                  courierTrackingCode: res.trackingCode,
                  courierStatus: res.status || 'in_review',
                  courierSentAt: new Date().toISOString(),
                }
              : null
          );
        }
        showToast(`✅ ${res.message} (Consignment ID: ${res.consignmentId})`);
      } else {
        alert(`❌ কুরিয়ারে এন্ট্রি ব্যর্থ হয়েছে:\n${res.message || res.error}`);
        showToast(`কুরিয়ার এন্ট্রি ব্যর্থ: ${res.message}`);
      }
    } catch (err: any) {
      alert(`❌ কুরিয়ার ত্রুটি: ${err.message}`);
      showToast(`কুরিয়ার ত্রুটি: ${err.message}`);
    } finally {
      setCourierDispatchingOrderId(null);
    }
  };

  // Add new coupon
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const newC: CouponItem = {
      id: `c-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: Number(newCouponDiscount),
      minSpend: Number(newCouponMin),
      status: 'active',
      usageCount: 0
    };
    setCoupons([newC, ...coupons]);
    setNewCouponCode('');
  };

  // Add new staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    const newS: StaffMember = {
      id: `s-${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      role: newStaffRole,
      status: 'Active'
    };
    onUpdateStaffList([...staffList, newS]);
    setNewStaffName('');
    setNewStaffEmail('');
    alert(`Access granted for ${newS.email} with role: ${newS.role}`);
  };

  // Delete staff
  const handleDeleteStaff = (id: string, email: string) => {
    const cleanEmail = email.toLowerCase();
    if (cleanEmail === 'albarakahpremium10@gmail.com' || cleanEmail === 'pctanvirt@gmail.com') {
      alert('Cannot delete the primary Super Admin (Owner).');
      return;
    }
    if (window.confirm(`Revoke admin access for ${email}?`)) {
      onUpdateStaffList(staffList.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex text-stone-800 antialiased font-sans relative">
      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div 
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* 1. LEFT SIDEBAR (Exact Forest Green `#03251a` Theme as in Screenshot) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#03251a] text-stone-200 flex flex-col shrink-0 min-h-screen border-r border-emerald-950/40 select-none transform transition-transform duration-200 ease-in-out ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-stone-950 font-black shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-stone-950 fill-stone-950" />
            </div>
            <div>
              <h1 
                className="text-sm font-black tracking-wider text-[#D4AF37] uppercase leading-tight font-serif"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                AL BARAKAH
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                PREMIUM ADMIN
              </p>
            </div>
          </div>

          <button 
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden text-stone-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37] shadow-sm'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-300" />
            <span>Dashboard</span>
          </button>

          {/* Products */}
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Package className="w-4 h-4 text-emerald-300" />
              <span>Products</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              {products.length}
            </span>
          </button>

          {/* Facebook Ads & Landing Pages */}
          <button
            onClick={() => setActiveTab('landingPages')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'landingPages'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37] shadow-sm'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Facebook Ads & Landing</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">
              ADS
            </span>
          </button>

          {/* Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShoppingCart className="w-4 h-4 text-emerald-300" />
              <span>Orders</span>
            </div>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">
                {pendingOrders.length}
              </span>
            )}
          </button>

          {/* Customers */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>Customers</span>
          </button>

          {/* Reports & Profit Analytics */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>বিক্রয় ও লাভ-ক্ষতি</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              হিসাব
            </span>
          </button>

          {/* Coupons */}
          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-300" />
            <span>Coupons</span>
          </button>

          {/* Hero & Banners */}
          <button
            onClick={() => setActiveTab('banners')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>Hero & Banners</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Live
            </span>
          </button>

          {/* Top Selling Products */}
          <button
            onClick={() => setActiveTab('topSelling')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'topSelling'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>Top Selling Items</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              topSellingConfig?.enabled
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'bg-stone-700 text-stone-400'
            }`}>
              {topSellingConfig?.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Categories & Offers */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Categories & Offers</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              {categories.length}
            </span>
          </button>

          {/* Customer Reviews */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 text-emerald-300" />
            <span>Customer Reviews</span>
          </button>

          {/* Admins & Staff */}
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Admins & Staff</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950">
              {staffList.length}
            </span>
          </button>

          {/* QR Code & Sticker Studio */}
          <button
            onClick={() => {
              setQrModalProduct(null);
              setIsQrModalOpen(true);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR & Sticker Studio</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              NEW
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-900/90 text-white font-bold border-l-4 border-[#D4AF37]'
                : 'text-stone-300 hover:bg-emerald-950/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-300" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer (SIGN OUT) */}
        <div className="p-4 border-t border-emerald-900/40">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top App Header (Matching Screenshot Topbar) */}
        <header className="bg-white border-b border-stone-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Title with Sparkle Icon + Mobile Menu Hamburger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-600 hidden xs:block" />
            <h2 
              className="text-base sm:text-lg lg:text-xl font-bold text-stone-900 font-serif tracking-tight truncate max-w-[200px] sm:max-w-none"
              style={{ fontFamily: "'Cinzel', Georgia, serif" }}
            >
              {activeTab === 'dashboard' && 'Dashboard Summary'}
              {activeTab === 'products' && 'Products Management'}
              {activeTab === 'topSelling' && 'Top Selling Items Management'}
              {activeTab === 'orders' && 'Orders Processing'}
              {activeTab === 'customers' && 'Customer Base'}
              {activeTab === 'reports' && 'Sales & Analytics Reports'}
              {activeTab === 'coupons' && 'Discount Coupons'}
              {activeTab === 'categories' && 'Categories & Offer Banners'}
              {activeTab === 'banners' && 'Hero & Banners Customizer'}
              {activeTab === 'reviews' && 'Customer Reviews Moderation'}
              {activeTab === 'staff' && 'Admins & Staff Access Control'}
              {activeTab === 'settings' && 'Store Configuration & Settings'}
            </h2>
          </div>

          {/* Header Right Actions (View Store + Admin Badge) */}
          <div className="flex items-center gap-3.5">
            {/* View Store Button (Dark Forest Green pill button as in screenshot) */}
            <button
              onClick={onViewStore}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Return to Customer Storefront"
            >
              <Store className="w-4 h-4" />
              <span>View Store</span>
            </button>

            {/* Admin Profile Avatar & Role */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-[#112d22] text-[#D4AF37] text-xs font-black flex items-center justify-center shadow-xs">
                AB
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-stone-800 leading-tight">
                  {adminRole || 'Super Admin'}
                </div>
                <div className="text-[10px] text-stone-400 font-mono truncate max-w-[150px]">
                  {adminEmail}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* TAB 1: MAIN DASHBOARD SUMMARY (EXACT SCREENSHOT LAYOUT) */}
        {activeTab === 'dashboard' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            
            {/* 4 KPI Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: DELIVERED SALES */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      DELIVERED SALES
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif flex items-center gap-1"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      <TakaIcon className="text-xl sm:text-2xl text-emerald-600" />
                      {Math.round(deliveredSales).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0 font-bold text-lg font-sans">
                    ৳
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Excluding pending/cancelled
                </p>
              </div>

              {/* Card 2: PENDING REVENUE */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      PENDING REVENUE
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif flex items-center gap-1"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      <TakaIcon className="text-xl sm:text-2xl text-[#f38018]" />
                      {Math.round(pendingRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shrink-0">
                    <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Awaiting dispatch/COD delivery
                </p>
              </div>

              {/* Card 3: DELIVERED ORDERS */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      DELIVERED ORDERS
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      {deliveredOrders.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Shipped and completed
                </p>
              </div>

              {/* Card 4: TOTAL CUSTOMERS */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      TOTAL CUSTOMERS
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      {uniqueCustomers || 12}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
                    <Users className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Unique client records
                </p>
              </div>
            </div>

            {/* Sales Overview Chart */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 
                    className="text-base sm:text-lg font-bold text-stone-900 font-serif"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    Monthly Sales Overview
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Weekly revenue performance across store channels</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                  Live Analytics
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-8 pb-2 border-b border-stone-200">
                {salesBarData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {symbol}{item.amount.toLocaleString()}
                    </div>
                    <div 
                      className="w-full max-w-[50px] bg-[#0a5c36] hover:bg-[#FF6A00] transition-all rounded-t-lg shadow-xs cursor-pointer"
                      style={{ height: item.height }}
                    />
                    <span className="text-xs font-bold text-stone-600 mt-2">{item.day}</span>
                  </div>
                ))}
              </div>

              {/* Quick Actions Footer below chart */}
              <div className="mt-6 pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0a5c36]"></div>
                  <span className="text-xs font-semibold text-stone-600">Storefront Orders (Cash on Delivery / bKash)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#0a5c36] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 font-serif">Recent Store Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#0a5c36] hover:underline cursor-pointer"
                >
                  Manage All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3">Order ID</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Total Amount</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-stone-900">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-stone-900">{getCustomerName(order)}</div>
                          <div className="text-[11px] text-stone-500">{getCustomerPhone(order)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">
                          {order.items?.length || 0} product(s)
                        </td>
                        <td className="px-5 py-3.5 font-bold text-stone-900">
                          {symbol}{Math.round(getOrderTotal(order) * rate).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-bold text-[11px] text-stone-600">
                          {getPaymentMethod(order)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              getOrderStatus(order) === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : getOrderStatus(order) === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : getOrderStatus(order) === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Management Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('banners')}
                className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-300/40 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5 text-stone-950" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Hero & Banners</span>
                  <span className="text-amber-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Customize main homepage slider & promo banners
                </p>
              </div>

              <div
                onClick={() => setActiveTab('products')}
                className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-300/40 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a5c36] text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Products ({products.length})</span>
                  <span className="text-emerald-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Add, edit, or adjust pricing & stock
                </p>
              </div>

              <div
                onClick={() => setActiveTab('orders')}
                className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-300/40 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Orders ({orders.length})</span>
                  <span className="text-blue-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Process shipments, COD & delivery tracking
                </p>
              </div>

              <div
                onClick={() => setActiveTab('topSelling')}
                className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl border border-orange-300/40 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f38018] text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Top Selling Items</span>
                  <span className="text-orange-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Customize 4 top selling product cards & pricing
                </p>
              </div>

              <div
                onClick={() => setActiveTab('categories')}
                className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl border border-purple-300/40 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Categories & Offers</span>
                  <span className="text-purple-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Manage categories & promotional badges
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search products by title, category, ID..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setQrModalProduct(null);
                    setIsQrModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-700" />
                  <span>QR & Sticker Studio</span>
                </button>

                <button
                  onClick={() => setActiveTab('topSelling')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-[#f38018] text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-[#f38018]" />
                  <span>Edit Top Selling Items</span>
                </button>

                <button
                  onClick={openAddProductModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Category Filter Bar (Exact Match with Provided UI Screenshot - 100% Visible Multi-Row Wrap) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-950">
                  <Filter className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>FILTER BY CATEGORY:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {availableProductCategories.length} Categories
                  </span>
                </div>
                {(selectedProductCategoryFilter !== 'all' || productSearch.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductCategoryFilter('all');
                      setProductSearch('');
                    }}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                  >
                    Reset All Filters (সব দেখুন)
                  </button>
                )}
              </div>

              {/* Multi-row wrapped Category Pills ensuring NO category is hidden or cut off */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
                {/* All Products Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedProductCategoryFilter('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedProductCategoryFilter === 'all'
                      ? 'bg-[#0a5c36] text-white shadow-xs ring-2 ring-[#0a5c36]/20'
                      : 'bg-stone-100/90 hover:bg-stone-200/90 text-stone-700 border border-stone-200/70'
                  }`}
                >
                  <span>All Products</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      selectedProductCategoryFilter === 'all'
                        ? 'bg-[#D4AF37] text-stone-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                {/* Dynamic Category Pill Tabs */}
                {availableProductCategories.map((catName) => {
                  const count = productCategoryCounts[catName] || 0;
                  const isSelected = selectedProductCategoryFilter.toLowerCase() === catName.toLowerCase();

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSelectedProductCategoryFilter(catName)}
                      className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a5c36] text-white shadow-xs ring-2 ring-[#0a5c36]/20'
                          : 'bg-stone-100/90 hover:bg-stone-200/90 text-stone-700 border border-stone-200/70'
                      }`}
                    >
                      <span>{catName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isSelected
                            ? 'bg-[#D4AF37] text-stone-950'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Price</th>
                      <th className="px-5 py-3.5">Stock</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filteredProductsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-stone-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="w-8 h-8 text-stone-300" />
                            <p className="text-xs font-semibold text-stone-600">
                              এই ক্যাটাগরিতে কোনো প্রোডাক্ট পাওয়া যায়নি
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductCategoryFilter('all');
                                setProductSearch('');
                              }}
                              className="mt-1 px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
                            >
                              সব প্রোডাক্ট দেখুন (View All Products)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProductsList.map((product) => (
                        <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image || (product as any).imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200"
                              />
                              <div>
                                <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                                <div className="text-[11px] text-stone-400">ID: {product.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] font-semibold">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-stone-900">
                            {symbol}{Math.round(product.price * rate).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                product.inStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {product.inStock ? `${product.stockCount || 25} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-amber-700">
                            ★ {product.rating} ({product.reviewCount})
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenLandingCustomizer(product)}
                              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                product.landingPage?.enabled
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold'
                                  : 'bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-800'
                              }`}
                              title={product.landingPage?.enabled ? "ফেসবুক ল্যান্ডিং পেজ কাস্টমাইজ করুন (সক্রিয়)" : "ফেসবুক ল্যান্ডিং পেজ তৈরি করুন"}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                            <button
                              onClick={() => {
                                setQrModalProduct(product);
                                setIsQrModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer transition-colors"
                              title="Generate QR Code & Bottle Sticker (কিউআর ও স্টিকার তৈরি করুন)"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FACEBOOK ADS & SALES LANDING PAGES */}
        {activeTab === 'landingPages' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-[#0a5c36] to-stone-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Facebook Ads & Direct Conversion Engine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100">
                    উচ্চ রূপান্তরযোগ্য (High-Converting) সেলস ল্যান্ডিং পেজ
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                    ফেসবুক অ্যাড ট্রাফিকের জন্য সরাসরি সিঙ্গেল-প্রোডাক্ট সেলস পেজ। এখানে কাস্টমার বিভ্রান্ত না হয়ে সরাসরি ভিডিও/ছবি দেখে, অফার প্যাকেজ সিলেক্ট করে ১-ক্লিকে ক্যাশ অন ডেলিভারিতে অর্ডার দিতে পারে।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4 text-blue-200 animate-pulse" />
                    <span>Facebook Pixel & CAPI সেটিংস</span>
                    {facebookPixelConfig.pixelId ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-900 text-[10px] font-black">সেট করুন</span>
                    )}
                  </button>

                  {products.find((p) => p.name.includes('Mustard') || p.name.includes('সরিষা')) && (
                    <button
                      type="button"
                      onClick={() => {
                        const mustardProd = products.find((p) => p.name.includes('Mustard') || p.name.includes('সরিষা'));
                        if (mustardProd && onPreviewLandingPage) {
                          onPreviewLandingPage(mustardProd);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-stone-900" />
                      <span>সরিষার তেল ল্যান্ডিং পেজ লাইভ দেখুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">সক্রিয় ল্যান্ডিং পেজ</div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    {products.filter((p) => p.landingPage?.enabled).length} টি প্রোডাক্ট
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">Facebook Pixel</div>
                  <div className="text-lg font-black text-emerald-300 mt-1 flex items-center gap-1.5">
                    {facebookPixelConfig.pixelId ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="truncate">{facebookPixelConfig.pixelId}</span>
                      </>
                    ) : (
                      <span className="text-amber-300 text-xs">বসানো হয়নি (সেট করুন)</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">Domain Verification</div>
                  <div className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
                    {facebookPixelConfig.domainVerificationCode ? (
                      <span className="text-emerald-300 text-xs font-bold">✅ ভেরিফায়েড / সক্রিয়</span>
                    ) : (
                      <span className="text-stone-300 text-xs">albarakahpremium.com</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-stone-300 font-medium">অর্ডার ও ট্র্যাকিং</div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    ১-ক্লিক COD + CAPI
                  </div>
                </div>
              </div>
            </div>

            {/* Facebook Pixel & Domain Verification Quick Action Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Pixel & CAPI */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Facebook Pixel & Conversions API (CAPI)</div>
                      <div className="text-xs text-stone-500">
                        {facebookPixelConfig.pixelId ? `পিক্সেল ID: ${facebookPixelConfig.pixelId} (সক্রিয়)` : 'পিক্সেল আইডি সেট করা হয়নি'}
                      </div>
                    </div>
                  </div>
                  {facebookPixelConfig.pixelId ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      সক্রিয়
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                      সেট করা প্রয়োজন
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  PageView, ViewContent, AddToCart, InitiateCheckout এবং Purchase ইভেন্ট স্বয়ংক্রিয়ভাবে ট্র্যাকিং করে মেটা অ্যাডসে রিপোর্ট পাঠায়।
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-mono">
                    CAPI: {facebookPixelConfig.enableCapi ? 'এনাবল্ড' : 'অফ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>পিক্সেল কনফিগার ও টেস্ট করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Domain Verification */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Facebook Domain Verification</div>
                      <div className="text-xs text-stone-500">albarakahpremium.com (কাস্টম ডোমেইন)</div>
                    </div>
                  </div>
                  {facebookPixelConfig.domainVerificationCode ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      মেটা ট্যাগ যুক্ত
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-[11px]">
                      কনফিগার করুন
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  মেটা বিজনেস ম্যানেজারে ডোমেইন ভেরিফাই করার জন্য মেটা-ট্যাগ কোড বা DNS TXT রেকর্ড নির্দেশনা পেয়ে যাবেন।
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-mono">
                    DNS / Meta-tag Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPixelModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ডোমেইন ভেরিফিকেশন সেট করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="ল্যান্ডিং পেজ বা প্রোডাক্ট খুঁজুন..."
                  value={landingPageSearch}
                  onChange={(e) => setLandingPageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="text-xs text-stone-500 font-medium">
                টিপস: ফেসবুক অ্যাডে যে প্রোডাক্টের ক্যাম্পেইন চালাবেন সেটির অ্যাড লিংক কপি করে অ্যাডের Website URL এ পেস্ট করুন।
              </div>
            </div>

            {/* Products with Landing Page Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">প্রোডাক্ট ও ক্যাটাগরি</th>
                      <th className="px-5 py-3.5">ল্যান্ডিং পেজ স্ট্যাটাস</th>
                      <th className="px-5 py-3.5">হেডলাইন ও অফার প্যাকেজ</th>
                      <th className="px-5 py-3.5">ফেসবুক অ্যাড ডেস্টিনেশন লিংক</th>
                      <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {products
                      .filter((p) => {
                        if (!landingPageSearch) return true;
                        const q = landingPageSearch.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q) ||
                          (p.landingPage?.headline && p.landingPage.headline.toLowerCase().includes(q))
                        );
                      })
                      .map((product) => {
                        const isEnabled = Boolean(product.landingPage?.enabled);
                        const adUrl = `${window.location.origin}${window.location.pathname}?landing=${product.id}`;

                        return (
                          <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.images[0] || 'https://via.placeholder.com/60'}
                                  alt={product.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-stone-200"
                                />
                                <div>
                                  <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                                  <div className="text-[11px] text-stone-400">{product.category} • ৳{product.price}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                  লাইভ সক্রিয়
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[11px]">
                                  তৈরি করা হয়নি
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3.5 max-w-xs">
                              {product.landingPage?.headline ? (
                                <div className="space-y-1">
                                  <div className="font-serif font-bold text-stone-800 line-clamp-1">
                                    {product.landingPage.headline}
                                  </div>
                                  <div className="text-[11px] text-stone-500 flex flex-wrap gap-1">
                                    {product.landingPage.variants?.map((v, i) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px]">
                                        {v.name}: ৳{v.price}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">ডিফল্ট টেমপ্লেট প্রযোজ্য</span>
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 rounded bg-stone-100 text-[11px] text-stone-700 font-mono select-all truncate max-w-[180px]">
                                  ?landing={product.id}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(adUrl);
                                    showToast(`অ্যাড লিংক কপি হয়েছে: ${adUrl}`);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Copy Full URL"
                                >
                                  কপি
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-right space-x-2">
                              {/* Preview Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onPreviewLandingPage) {
                                    onPreviewLandingPage(product);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                title="Live Preview Landing Page"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                <span>প্রিভিউ</span>
                              </button>

                              {/* Customize Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenLandingCustomizer(product)}
                                className="px-3 py-1.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
                                title="Edit Landing Page Content, Pricing & Video"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>কাস্টমাইজ</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Facebook Ads Readiness & Campaign Strategy Guide */}
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>ফেসবুক অ্যাড ক্যাম্পেইন শুরু করার জন্য চূড়ান্ত চেকলিস্ট (Facebook Ads Checklist)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700">
                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">১</span>
                    <span>হুক ও আসল সরিষার তেলের বিশ্বাস</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    অ্যাডের ভিডিওতে ঘানিভাঙা তেল পড়ার দৃশ্য ও খাঁটি ঝাঁঝের নিশ্চয়তা হাইলাইট করুন। ল্যান্ডিং পেজে ইতিমধ্যে '১০০% খাঁটি ও টেস্টেড' ব্যাজ সেট করা আছে।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">২</span>
                    <span>অফার প্যাকেজ ও ফ্রি ডেলিভারি</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    ১ লিটার, ২ লিটার এবং ৫ লিটার প্যাকেজের মধ্যে ৫ লিটারে "ফ্রি ডেলিভারি" দিলে এভারেজ অর্ডার ভ্যালু (AOV) দ্বিগুণ হয়ে যায়।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">৩</span>
                    <span>সরাসরি ক্যাশ অন ডেলিভারি ফর্ম</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    কাস্টমারকে কোনো লগইন বা পাসওয়ার্ড তৈরি করতে হবে না—শুধু নাম, মোবাইল ও ঠিকানা লিখে ১ ক্লিকে অর্ডার প্লেস করতে পারবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2.5: TOP SELLING ITEMS & 4 BANNERS CONFIG */}
        {activeTab === 'topSelling' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black">
                      <Flame className="w-4 h-4 text-white fill-white" />
                    </span>
                    <h3 className="text-base font-bold text-stone-900 font-serif">
                      Top Selling Products & 4 Banners Manager
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    টপ সেলিং সেকশনের টাইটেল, অফার সাবটাইটেল এবং ৪টি ব্যানার ও অফার প্রোডাক্ট এডিট করে লাইভ সেভ করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: TopSellingItem = {
                        id: `top_${Date.now()}`,
                        productId: products[0]?.id || 'custom',
                        name: products[0]?.name || 'New Top Selling Item',
                        price: products[0]?.price || 850,
                        originalPrice: products[0]?.originalPrice || 1050,
                        badge: 'HOT DEAL',
                        badgeText: '🔥 HOT DEAL',
                        badgeBgColor: '#e11d48',
                        overridePrice: products[0]?.price || 850,
                        overrideOriginalPrice: products[0]?.originalPrice || 1050,
                        overrideWeight: products[0]?.weight || '1 Kg',
                        image: products[0]?.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
                        enabled: true,
                        order: topSellingState.items.length + 1,
                      };
                      const updated = {
                        ...topSellingState,
                        items: [...topSellingState.items, newItem]
                      };
                      handleSaveTopSellingAdmin(updated);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTopSelling}
                    onClick={() => handleSaveTopSellingAdmin(topSellingState)}
                    className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-stone-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    {isSavingTopSelling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Top Selling</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section Title & Subtitle Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Section Title (বাংলা/English)</label>
                  <input
                    type="text"
                    value={topSellingState.title}
                    onChange={(e) => {
                      setTopSellingState({ ...topSellingState, title: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Subtitle / Offer Note</label>
                  <input
                    type="text"
                    value={topSellingState.subtitle || ''}
                    onChange={(e) => {
                      setTopSellingState({ ...topSellingState, subtitle: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3 sm:pt-6">
                  <label className="text-xs font-bold text-stone-700 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={topSellingState.enabled}
                      onChange={(e) => {
                        setTopSellingState({ ...topSellingState, enabled: e.target.checked });
                      }}
                      className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                    />
                    <span>Show on Homepage (হোমপেজে দেখান)</span>
                  </label>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {topSellingState.items.map((item, idx) => {
                  const linkedProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id || idx} className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0a5c36] text-white text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {item.name || linkedProduct?.name || `Top Selling Banner ${idx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].enabled = e.target.checked;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Remove this top selling item?')) {
                                const updatedItems = topSellingState.items.filter((_, i) => i !== idx);
                                const updated = { ...topSellingState, items: updatedItems };
                                handleSaveTopSellingAdmin(updated);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Left: Image Preview, Direct File Upload & URL */}
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[11px] font-bold text-stone-600 block">
                            Custom Banner / Photo (ছবি আপলোড বা লিংক)
                          </label>
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center relative group">
                            <img
                              src={item.image || linkedProduct?.image}
                              alt={item.name || 'Banner preview'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                            {/* Overlay file upload button with auto-compression */}
                            <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold">
                              <Upload className="w-5 h-5 mb-1" />
                              <span>ছবি আপলোড করুন</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.8);
                                      const updatedItems = [...topSellingState.items];
                                      updatedItems[idx].image = compressed;
                                      setTopSellingState({ ...topSellingState, items: updatedItems });
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.image || ''}
                              placeholder="Paste direct Image URL or link..."
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].image = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                            />
                            <label className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0" title="Upload from Device">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.8);
                                      const updatedItems = [...topSellingState.items];
                                      updatedItems[idx].image = compressed;
                                      setTopSellingState({ ...topSellingState, items: updatedItems });
                                    } catch (err) {
                                      console.error('Failed to compress image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Right: Product linking & metadata overrides */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Link to Real Product (অর্ডার বাটনে পণ্য সিলেক্ট)
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                const selProd = products.find((p) => p.id === e.target.value);
                                if (selProd) {
                                  updatedItems[idx] = {
                                    ...updatedItems[idx],
                                    productId: selProd.id,
                                    name: selProd.name,
                                    image: selProd.image,
                                    price: selProd.price,
                                    originalPrice: selProd.originalPrice,
                                    overridePrice: selProd.price,
                                    overrideOriginalPrice: selProd.originalPrice,
                                    overrideWeight: selProd.weight || '১ কেজি',
                                  };
                                } else {
                                  updatedItems[idx].productId = e.target.value;
                                }
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Display Title (ঐচ্ছিক নাম)
                            </label>
                            <input
                              type="text"
                              value={item.name || ''}
                              placeholder={linkedProduct?.name || 'Product Title'}
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].name = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Badge Text (যেমন: 🔥 BESTSELLER, 50% OFF)
                            </label>
                            <input
                              type="text"
                              value={item.badgeText || ''}
                              placeholder="🔥 HOT DEAL"
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].badgeText = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Weight / Unit (যেমন: 1 Kg / 500g)
                            </label>
                            <input
                              type="text"
                              value={item.overrideWeight || ''}
                              placeholder="1 Kg"
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overrideWeight = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Offer Price (বিক্রয় মূল্য ৳)
                            </label>
                            <input
                              type="number"
                              value={item.overridePrice !== undefined && item.overridePrice !== null ? item.overridePrice : (item.price || '')}
                              placeholder={String(linkedProduct?.price || 0)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overridePrice = val;
                                updatedItems[idx].price = val;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">
                              Regular Price (আগের কাটা মূল্য ৳)
                            </label>
                            <input
                              type="number"
                              value={item.overrideOriginalPrice !== undefined && item.overrideOriginalPrice !== null ? item.overrideOriginalPrice : (item.originalPrice || '')}
                              placeholder={String(linkedProduct?.originalPrice || 0)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].overrideOriginalPrice = val;
                                updatedItems[idx].originalPrice = val;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS PROCESSING */}
        {activeTab === 'orders' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Filter Buttons & Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0a5c36]" />
                    <span>অর্ডার ম্যানেজমেন্ট ও অগ্রিম ডেলিভারি ট্র্যাকিং</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    অগ্রিম ডেলিভারি চার্জ TrxID ভেরিফিকেশন, ক্যাশ অন ডেলিভারি বাকি ব্যালেন্স এবং কুরিয়ার অটোমেশন
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsCourierModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-[#0a5c36] hover:bg-emerald-50 text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Courier Settings</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/80">
                {[
                  { id: 'all', label: 'সব অর্ডার (All)', count: orders.length, color: 'bg-[#0a5c36] text-white' },
                  {
                    id: 'advance_paid',
                    label: '৳ অগ্রিম পেইড (Paid)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'ADVANCE_PAID' || (o.advanceAmount && o.advanceAmount > 0 && o.bkashTrxId)).length,
                    color: 'bg-emerald-700 text-white',
                  },
                  {
                    id: 'advance_pending',
                    label: '⏳ অগ্রিম বকেয়া (Pending)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'ADVANCE_PENDING' || (o.advancePaymentType === 'DELIVERY_ONLY' && !o.bkashTrxId)).length,
                    color: 'bg-amber-600 text-white',
                  },
                  {
                    id: 'verified',
                    label: '✓ ভেরিফাইড (Verified)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'VERIFIED').length,
                    color: 'bg-teal-700 text-white',
                  },
                  {
                    id: 'full_paid',
                    label: '৳ ফুল পেইড (bKash)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'FULL_PAID' || o.advancePaymentType === 'FULL_PAYMENT').length,
                    color: 'bg-pink-700 text-white',
                  },
                  {
                    id: 'pending',
                    label: 'Pending',
                    count: orders.filter((o) => o.status === 'pending').length,
                    color: 'bg-stone-700 text-white',
                  },
                  {
                    id: 'processing',
                    label: 'Processing',
                    count: orders.filter((o) => o.status === 'processing').length,
                    color: 'bg-blue-700 text-white',
                  },
                  {
                    id: 'shipped',
                    label: 'Shipped',
                    count: orders.filter((o) => o.status === 'shipped').length,
                    color: 'bg-indigo-700 text-white',
                  },
                  {
                    id: 'delivered',
                    label: 'Delivered',
                    count: orders.filter((o) => o.status === 'delivered').length,
                    color: 'bg-emerald-800 text-white',
                  },
                  {
                    id: 'fake',
                    label: '⚠️ সন্দেহজনক/ফেক',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'FAKE_SUSPECTED' || o.isFakeSuspected).length,
                    color: 'bg-rose-700 text-white',
                  },
                  {
                    id: 'cancelled',
                    label: 'Cancelled',
                    count: orders.filter((o) => o.status === 'cancelled').length,
                    color: 'bg-rose-800 text-white',
                  },
                ].map((pill) => {
                  const isActive = orderFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setOrderFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? `${pill.color} shadow-xs`
                          : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/60'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3.5">Order ID & Date</th>
                      <th className="px-4 py-3.5">Customer & Phone</th>
                      <th className="px-4 py-3.5">Billing & Breakdown</th>
                      <th className="px-4 py-3.5">Delivery Payment Status</th>
                      <th className="px-4 py-3.5">Order Status</th>
                      <th className="px-4 py-3.5">Courier</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {orders
                      .filter((order) => {
                        if (orderFilter === 'all') return true;
                        if (orderFilter === 'advance_paid') {
                          return order.deliveryPaymentStatus === 'ADVANCE_PAID' || (order.advanceAmount && order.advanceAmount > 0 && order.bkashTrxId);
                        }
                        if (orderFilter === 'advance_pending') {
                          return order.deliveryPaymentStatus === 'ADVANCE_PENDING' || (order.advancePaymentType === 'DELIVERY_ONLY' && !order.bkashTrxId);
                        }
                        if (orderFilter === 'full_paid') {
                          return order.deliveryPaymentStatus === 'FULL_PAID' || order.advancePaymentType === 'FULL_PAYMENT' || order.paymentMethod === 'FULL_BKASH';
                        }
                        if (orderFilter === 'verified') {
                          return order.deliveryPaymentStatus === 'VERIFIED';
                        }
                        if (orderFilter === 'fake') {
                          return order.deliveryPaymentStatus === 'FAKE_SUSPECTED' || order.isFakeSuspected;
                        }
                        return getOrderStatus(order) === orderFilter;
                      })
                      .map((order) => {
                        const total = Math.round(getOrderTotal(order) * rate);
                        const advance = order.advanceAmount || (order.advancePaymentType === 'DELIVERY_ONLY' ? (order.shipping || 80) : 0);
                        const due = order.dueAmountOnDelivery !== undefined ? order.dueAmountOnDelivery : Math.max(0, total - advance);
                        const isAdvancePaid = order.deliveryPaymentStatus === 'ADVANCE_PAID' || (advance > 0 && order.bkashTrxId);
                        const isVerified = order.deliveryPaymentStatus === 'VERIFIED';
                        const isFake = order.deliveryPaymentStatus === 'FAKE_SUSPECTED' || order.isFakeSuspected;

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-stone-50/80 transition-colors ${
                              isFake ? 'bg-rose-50/40' : isVerified ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            {/* Order ID & Date */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                                {isFake && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                    Fake/Risk
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Customer & Phone */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-stone-900">{getCustomerName(order)}</div>
                              <div className="text-[11px] text-stone-600 flex items-center gap-1.5 mt-0.5">
                                <span>{getCustomerPhone(order)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppReminder(order)}
                                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded"
                                  title="WhatsApp Reminder Message"
                                >
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                              <div className="text-[10px] text-stone-400 truncate max-w-[180px] mt-0.5" title={getCustomerAddress(order)}>
                                {getCustomerAddress(order)}
                              </div>
                            </td>

                            {/* Billing & Breakdown */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-stone-900 text-xs">
                                মোট: ৳{total.toLocaleString()}
                              </div>
                              {advance > 0 && (
                                <div className="text-[11px] text-[#e2136e] font-bold">
                                  অগ্রিম: ৳{advance.toLocaleString()}
                                </div>
                              )}
                              <div className="text-[11px] text-[#0a5c36] font-semibold">
                                COD বাকি: ৳{due.toLocaleString()}
                              </div>
                            </td>

                            {/* Delivery Payment Status */}
                            <td className="px-4 py-3.5">
                              <div className="space-y-1.5">
                                {order.deliveryPaymentStatus === 'ADVANCE_PAID' || isAdvancePaid ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                                    <span>Advance Paid (৳{advance})</span>
                                  </div>
                                ) : order.deliveryPaymentStatus === 'FULL_PAID' ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-100 text-pink-900 font-bold text-[11px] border border-pink-300">
                                    <span>Full Paid bKash</span>
                                  </div>
                                ) : order.deliveryPaymentStatus === 'VERIFIED' ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-bold text-[11px] border border-teal-300">
                                    <ShieldCheck className="w-3 h-3 text-teal-700" />
                                    <span>Verified Order</span>
                                  </div>
                                ) : isFake ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold text-[11px] border border-rose-300">
                                    <AlertTriangle className="w-3 h-3 text-rose-700" />
                                    <span>Suspected Fake</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                                    <span>Advance Pending (৳{advance || 80})</span>
                                  </div>
                                )}

                                {/* bKash TrxID if available */}
                                {order.bkashTrxId && (
                                  <div className="flex items-center gap-1 text-[10px] text-[#e2136e] font-mono font-bold">
                                    <span>Trx: {order.bkashTrxId}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.bkashTrxId || '');
                                        showToast('TrxID কপি হয়েছে!');
                                      }}
                                      className="hover:underline text-[9px] text-stone-500 cursor-pointer"
                                    >
                                      (কপি)
                                    </button>
                                  </div>
                                )}

                                {/* Quick toggle status buttons */}
                                <div className="flex items-center gap-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliveryPaymentStatus(order.id, 'ADVANCE_PAID')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                                    title="Mark Advance Paid"
                                  >
                                    পেইড
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliveryPaymentStatus(order.id, 'VERIFIED')}
                                    className="px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold cursor-pointer"
                                    title="Mark Verified"
                                  >
                                    ভেরিফাই
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFakeSuspicion(order.id)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                      isFake
                                        ? 'bg-stone-200 text-stone-700'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                    title={isFake ? 'Remove Fake Flag' : 'Flag as Fake Order'}
                                  >
                                    {isFake ? 'রিমুভ' : 'ফেক ফ্ল্যাগ'}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Order Status */}
                            <td className="px-4 py-3.5">
                              <select
                                value={getOrderStatus(order)}
                                onChange={(e) => handleOrderStatusChange(order.id, e.target.value as Order['status'])}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-stone-50 border border-stone-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* Courier Integration */}
                            <td className="px-4 py-3.5">
                              {order.courierConsignmentId ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                      order.courierProvider === 'pathao'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {order.courierProvider || 'Courier'}
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-600">
                                      #{String(order.courierConsignmentId).slice(-6)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Dispatched</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={courierDispatchingOrderId === order.id}
                                    onClick={() => handleSendOrderToCourier(order, 'steadfast')}
                                    title="Send to Steadfast Courier"
                                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0a5c36] border border-emerald-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Steadfast</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={courierDispatchingOrderId === order.id}
                                    onClick={() => handleSendOrderToCourier(order, 'pathao')}
                                    title="Send to Pathao Courier"
                                    className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <span>Pathao</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* View / Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                                  title="অর্ডারের বিবরণ দেখুন (View Details)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(order)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 hover:border-rose-300 cursor-pointer transition-colors"
                                  title="অর্ডার ডিলিট করুন (Delete Order)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
              <h3 className="text-base font-bold text-stone-900 font-serif mb-4">Customer Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Contact Phone</th>
                      <th className="px-4 py-3">City / Address</th>
                      <th className="px-4 py-3">Total Orders</th>
                      <th className="px-4 py-3">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {orders.map((o, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-bold text-stone-900">{getCustomerName(o)}</td>
                        <td className="px-4 py-3 text-stone-600">{getCustomerPhone(o)}</td>
                        <td className="px-4 py-3 text-stone-500">{getCustomerAddress(o)}</td>
                        <td className="px-4 py-3 font-bold text-emerald-800">1 Order</td>
                        <td className="px-4 py-3 font-bold text-stone-900">{symbol}{Math.round(getOrderTotal(o) * rate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & PROFIT ANALYTICS */}
        {activeTab === 'reports' && (
          <ProfitAnalyticsReports
            products={products}
            orders={orders}
            currency={currency}
            onUpdateProductCostPrice={(prodId, newCost) => {
              const updated = products.map((p) => {
                if (p.id === prodId) {
                  return { ...p, costPrice: newCost };
                }
                return p;
              });
              onUpdateProducts(updated);
              showToast('✅ প্রোডাক্টের কেনা দাম (Cost Price) সফলভাবে সংরক্ষিত হয়েছে!');
            }}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {/* TAB 6: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit">
                <h3 className="text-sm font-bold text-stone-900 font-serif mb-4">Create Discount Coupon</h3>
                <form onSubmit={handleAddCoupon} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700">Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. EIDSPECIAL"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold uppercase focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Discount Percentage (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Min Spend ({symbol})</label>
                    <input
                      type="number"
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Add Coupon
                  </button>
                </form>
              </div>

              {/* Coupon List */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 font-serif mb-4">Active Coupon Codes</h3>
                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-stone-900 tracking-wider font-mono">{c.code}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {c.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Min Spend: {symbol}{c.minSpend} | Used: {c.usageCount} times</p>
                      </div>
                      <button
                        onClick={() => setCoupons(coupons.filter((item) => item.id !== c.id))}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HERO & PROMO BANNERS */}
        {activeTab === 'banners' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Header & Save Action */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 font-serif">Hero & Promo Banners (Ghorer Bazar Style)</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    Interactive Links
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Customize the main 2/3 carousel slider and the right 1/3 promo card. When customers click, they are navigated to the selected page.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to standard Ghorer Bazar default banners?')) {
                      setBannerConfigState(DEFAULT_HERO_CONFIG);
                      if (onUpdateHeroBannerConfig) onUpdateHeroBannerConfig(DEFAULT_HERO_CONFIG);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBanners(bannerConfigState)}
                  className="px-5 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  {bannerSavedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved & Live!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Banners</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap border-b border-stone-200 bg-white rounded-t-2xl px-6 pt-2 gap-1">
              <button
                type="button"
                onClick={() => setBannerSubTab('SLIDES')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'SLIDES'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Main Slider Carousel ({bannerConfigState.slides.length} slides)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerSubTab('PROMO')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'PROMO'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Right Promo Card (1/3 Width)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerSubTab('TOP_SELLING')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  bannerSubTab === 'TOP_SELLING'
                    ? 'border-[#0a5c36] text-[#0a5c36]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>🔥 Top Selling Items & Banners ({topSellingState.items.length} items)</span>
              </button>
            </div>

            {/* Sub-tab 1: Carousel Slides */}
            {bannerSubTab === 'SLIDES' && (
              <div className="bg-white p-6 rounded-b-2xl border-x border-b border-stone-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Configure each slider banner & its click destination</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newS: HeroSlide = {
                        id: `slide_${Date.now()}`,
                        badge: 'নতুন অফার',
                        title: 'নতুন ধামাকা অফার ব্যানার',
                        subtitle: 'প্রিমিয়াম কোয়ালিটি পণ্য অর্ডার করুন',
                        ctaText: 'অর্ডার করুন',
                        targetType: 'category',
                        targetValue: categories[0]?.name || 'Organic Foods',
                        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1400&auto=format&fit=crop&q=85',
                        enabled: true
                      };
                      setBannerConfigState({
                        ...bannerConfigState,
                        slides: [newS, ...bannerConfigState.slides]
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Slide</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {bannerConfigState.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-900 text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-800">{slide.title || 'Slide Title'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.enabled}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, enabled: e.target.checked } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="rounded text-emerald-600"
                            />
                            <span>Active</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              if (bannerConfigState.slides.length <= 1) {
                                alert('At least one slide is required.');
                                return;
                              }
                              const updated = bannerConfigState.slides.filter((s) => s.id !== slide.id);
                              setBannerConfigState({ ...bannerConfigState, slides: updated });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer"
                            title="Delete slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Image & Preview */}
                        <div className="lg:col-span-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-stone-700">Slide Image (ছবি)</label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-[#f38018] hover:underline cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>ছবি আপলোড (Device)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleHeroSlideImageUpload(slide.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="url"
                            value={slide.image}
                            onChange={(e) => {
                              const updated = bannerConfigState.slides.map((s) =>
                                s.id === slide.id ? { ...s, image: e.target.value } : s
                              );
                              setBannerConfigState({ ...bannerConfigState, slides: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                            placeholder="অথবা Image URL দিন..."
                          />
                          <div className="h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-200 relative">
                            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="lg:col-span-7 space-y-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700">Headline / Offer Title</label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, title: e.target.value } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none font-bold text-stone-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Badge Text</label>
                              <input
                                type="text"
                                value={slide.badge}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, badge: e.target.value } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Button CTA Text</label>
                              <input
                                type="text"
                                value={slide.ctaText}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, ctaText: e.target.value } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-700">Subtitle / Tagline</label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => {
                                const updated = bannerConfigState.slides.map((s) =>
                                  s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                                );
                                setBannerConfigState({ ...bannerConfigState, slides: updated });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                            />
                          </div>

                          {/* Target on Click */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                            <div>
                              <label className="text-[11px] font-bold text-stone-700">When Clicked, Go To:</label>
                              <select
                                value={slide.targetType}
                                onChange={(e) => {
                                  const updated = bannerConfigState.slides.map((s) =>
                                    s.id === slide.id ? { ...s, targetType: e.target.value as any } : s
                                  );
                                  setBannerConfigState({ ...bannerConfigState, slides: updated });
                                }}
                                className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none font-semibold"
                              >
                                <option value="category">Category Page</option>
                                <option value="product">Specific Product</option>
                                <option value="all">All Catalog</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-700">Select Target:</label>
                              {slide.targetType === 'category' ? (
                                <select
                                  value={slide.targetValue}
                                  onChange={(e) => {
                                    const updated = bannerConfigState.slides.map((s) =>
                                      s.id === slide.id ? { ...s, targetValue: e.target.value } : s
                                    );
                                    setBannerConfigState({ ...bannerConfigState, slides: updated });
                                  }}
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              ) : slide.targetType === 'product' ? (
                                <select
                                  value={slide.targetValue}
                                  onChange={(e) => {
                                    const updated = bannerConfigState.slides.map((s) =>
                                      s.id === slide.id ? { ...s, targetValue: e.target.value } : s
                                    );
                                    setBannerConfigState({ ...bannerConfigState, slides: updated });
                                  }}
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name.substring(0, 28)}...</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-xs text-stone-500 py-1.5">Goes to All Products</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Right Promo Card */}
            {bannerSubTab === 'PROMO' && (
              <div className="bg-white p-6 rounded-b-2xl border-x border-b border-stone-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Right Side Highlight Promo Card</h4>
                    <p className="text-xs text-stone-500">Dedicated card on the right (like Ghorer Bazar honey nuts card)</p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfigState.promoCard.enabled}
                      onChange={(e) => {
                        setBannerConfigState({
                          ...bannerConfigState,
                          promoCard: { ...bannerConfigState.promoCard, enabled: e.target.checked }
                        });
                      }}
                      className="rounded text-emerald-600"
                    />
                    <span>Show Promo Card</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Image & Preview */}
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-700">Promo Image (ছবি)</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-[#f38018] hover:underline cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>ছবি আপলোড (Device)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePromoImageUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        value={bannerConfigState.promoCard.image}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, image: e.target.value }
                          });
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        placeholder="অথবা Image URL লিখুন..."
                      />
                    </div>

                    <div className="h-48 rounded-2xl overflow-hidden border border-stone-200 relative bg-[#FFF7ED]">
                      <img
                        src={bannerConfigState.promoCard.image}
                        alt={bannerConfigState.promoCard.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-between p-3 text-white">
                        <span className="self-start px-2 py-0.5 rounded-full bg-[#FF6A00] text-[10px] font-bold">
                          {bannerConfigState.promoCard.badge || 'PROMO'}
                        </span>
                        <div>
                          <h5 className="text-sm font-bold">{bannerConfigState.promoCard.title}</h5>
                          <p className="text-[11px] text-stone-200">{bannerConfigState.promoCard.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="md:col-span-7 space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-700">Offer Title</label>
                      <input
                        type="text"
                        value={bannerConfigState.promoCard.title}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, title: e.target.value }
                          });
                        }}
                        placeholder="e.g. এখন হানি নাটসে ১০% ছাড়!"
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700">Badge Text</label>
                        <input
                          type="text"
                          value={bannerConfigState.promoCard.badge || ''}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, badge: e.target.value }
                            });
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700">Action Text</label>
                        <input
                          type="text"
                          value={bannerConfigState.promoCard.ctaText || ''}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, ctaText: e.target.value }
                            });
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700">Subtitle</label>
                      <input
                        type="text"
                        value={bannerConfigState.promoCard.subtitle || ''}
                        onChange={(e) => {
                          setBannerConfigState({
                            ...bannerConfigState,
                            promoCard: { ...bannerConfigState.promoCard, subtitle: e.target.value }
                          });
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                      <div>
                        <label className="text-xs font-bold text-stone-700">When Clicked, Go To:</label>
                        <select
                          value={bannerConfigState.promoCard.targetType}
                          onChange={(e) => {
                            setBannerConfigState({
                              ...bannerConfigState,
                              promoCard: { ...bannerConfigState.promoCard, targetType: e.target.value as any }
                            });
                          }}
                          className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none"
                        >
                          <option value="category">Category Page</option>
                          <option value="product">Specific Product</option>
                          <option value="all">All Products</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700">Target Page:</label>
                        {bannerConfigState.promoCard.targetType === 'category' ? (
                          <select
                            value={bannerConfigState.promoCard.targetValue}
                            onChange={(e) => {
                              setBannerConfigState({
                                ...bannerConfigState,
                                promoCard: { ...bannerConfigState.promoCard, targetValue: e.target.value }
                              });
                            }}
                            className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        ) : bannerConfigState.promoCard.targetType === 'product' ? (
                          <select
                            value={bannerConfigState.promoCard.targetValue}
                            onChange={(e) => {
                              setBannerConfigState({
                                ...bannerConfigState,
                                promoCard: { ...bannerConfigState.promoCard, targetValue: e.target.value }
                              });
                            }}
                            className="w-full mt-1 px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name.substring(0, 28)}...</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-stone-500 py-2">Catalog (All Items)</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Top Selling Section Items & Banners */}
            {bannerSubTab === 'TOP_SELLING' && (
              <div className="bg-white p-6 rounded-b-2xl border-x border-b border-stone-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">🔥 Top Selling Products & Custom Banners</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      টপ সেলিং সেকশনের টাইটেল, অফার সাবটাইটেল এবং প্রতিটি আইটেমের কাস্টম ব্যানার/ছবি ও তথ্য নিয়ন্ত্রণ করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: TopSellingItem = {
                          id: `top_${Date.now()}`,
                          productId: products[0]?.id || 'custom',
                          name: products[0]?.name || 'New Top Selling Item',
                          price: products[0]?.price || 850,
                          originalPrice: products[0]?.originalPrice || 1050,
                          badge: 'HOT DEAL',
                          badgeText: '🔥 HOT DEAL',
                          badgeBgColor: '#e11d48',
                          overridePrice: products[0]?.price || 850,
                          overrideOriginalPrice: products[0]?.originalPrice || 1050,
                          overrideWeight: products[0]?.weight || '1 Kg',
                          image: products[0]?.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80',
                          enabled: true,
                          order: topSellingState.items.length + 1,
                        };
                        const updated = {
                          ...topSellingState,
                          items: [...topSellingState.items, newItem]
                        };
                        handleSaveTopSellingAdmin(updated);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveTopSellingAdmin(topSellingState)}
                      className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Top Selling</span>
                    </button>
                  </div>
                </div>

                {/* Section Title & Subtitle Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Section Title (বাংলা/English)</label>
                    <input
                      type="text"
                      value={topSellingState.title}
                      onChange={(e) => {
                        setTopSellingState({ ...topSellingState, title: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Subtitle / Offer Note</label>
                    <input
                      type="text"
                      value={topSellingState.subtitle || ''}
                      onChange={(e) => {
                        setTopSellingState({ ...topSellingState, subtitle: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:pt-6">
                    <label className="text-xs font-bold text-stone-700 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={topSellingState.enabled}
                        onChange={(e) => {
                          setTopSellingState({ ...topSellingState, enabled: e.target.checked });
                        }}
                        className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                      />
                      <span>Show on Homepage (হোমপেজে দেখান)</span>
                    </label>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {topSellingState.items.map((item, idx) => {
                    const linkedProduct = products.find((p) => p.id === item.productId);
                    return (
                      <div key={item.id || idx} className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#0a5c36] text-white text-xs font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-stone-900">
                              {item.name || linkedProduct?.name || 'Top Selling Item'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].enabled = e.target.checked;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="rounded text-[#0a5c36] focus:ring-[#0a5c36] cursor-pointer"
                              />
                              <span>Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Remove this top selling item?')) {
                                  const updatedItems = topSellingState.items.filter((_, i) => i !== idx);
                                  const updated = { ...topSellingState, items: updatedItems };
                                  handleSaveTopSellingAdmin(updated);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Left: Image Preview & URL */}
                          <div className="md:col-span-4 space-y-2">
                            <label className="text-[11px] font-bold text-stone-600 block">
                              Custom Banner / Photo URL (কাস্টম ব্যানার লিংক)
                            </label>
                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center relative">
                              <img
                                src={item.image || linkedProduct?.image}
                                alt={item.name || 'Banner preview'}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <input
                              type="text"
                              value={item.image || ''}
                              placeholder="Paste direct Image URL or Canva/ChatGPT banner link..."
                              onChange={(e) => {
                                const updatedItems = [...topSellingState.items];
                                updatedItems[idx].image = e.target.value;
                                setTopSellingState({ ...topSellingState, items: updatedItems });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a5c36]"
                            />
                          </div>

                          {/* Right: Product linking & metadata overrides */}
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Link to Real Product (অর্ডার বাটনে পণ্য সিলেক্ট)
                              </label>
                              <select
                                value={item.productId}
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  const selProd = products.find((p) => p.id === e.target.value);
                                  updatedItems[idx].productId = e.target.value;
                                  if (selProd && !updatedItems[idx].name) {
                                    updatedItems[idx].name = selProd.name;
                                  }
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Display Title (ঐচ্ছিক নাম)
                              </label>
                              <input
                                type="text"
                                value={item.name || ''}
                                placeholder={linkedProduct?.name || 'Product Title'}
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].name = e.target.value;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Badge Text (যেমন: 🔥 BESTSELLER, 50% OFF)
                              </label>
                              <input
                                type="text"
                                value={item.badgeText || ''}
                                placeholder="🔥 HOT DEAL"
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].badgeText = e.target.value;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Weight / Unit (যেমন: 1 Kg / 500g)
                              </label>
                              <input
                                type="text"
                                value={item.overrideWeight || ''}
                                placeholder="1 Kg"
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].overrideWeight = e.target.value;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Offer Price (বিক্রয় মূল্য ৳)
                              </label>
                              <input
                                type="number"
                                value={item.overridePrice || ''}
                                placeholder={String(linkedProduct?.price || 0)}
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].overridePrice = Number(e.target.value) || 0;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                Regular Price (আগের কাটা মূল্য ৳)
                              </label>
                              <input
                                type="number"
                                value={item.overrideOriginalPrice || ''}
                                placeholder={String(linkedProduct?.originalPrice || 0)}
                                onChange={(e) => {
                                  const updatedItems = [...topSellingState.items];
                                  updatedItems[idx].overrideOriginalPrice = Number(e.target.value) || 0;
                                  setTopSellingState({ ...topSellingState, items: updatedItems });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CATEGORIES & OFFERS */}
        {activeTab === 'categories' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Top Category Management Banner / Toolbar */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a5c36] text-white flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Category Management & Customization (ক্যাটাগরি ব্যবস্থাপনা)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  ক্যাটাগরি তৈরি, এডিট, রিমুভ, রিঅর্ডার (আগে/পিছে সাজানো) ও হোমপেজে দৃশ্যমানতা নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Turn All ON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(false)}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-200 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                  <span>Turn All OFF</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCategoriesToDefault}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Reset to 9 default categories"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Category</span>
                </button>
              </div>
            </div>

            {/* Metric Counters & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 shadow-2xs">
                  মোট ক্যাটাগরি: <strong className="text-stone-950 font-black">{categories.length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  সক্রিয় (ON): <strong className="font-black">{categories.filter((c) => c.enabled).length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-stone-200/80 border border-stone-300 text-xs font-bold text-stone-700 shadow-2xs">
                  লুকানো (OFF): <strong className="font-black">{categories.filter((c) => !c.enabled).length}</strong>
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="ক্যাটাগরি খুঁজুন (Search)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Grid (Styled like screenshot with full customization actions) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories
                .filter(
                  (cat) =>
                    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                    cat.slug.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .map((cat) => {
                  const index = categories.findIndex((c) => c.id === cat.id);
                  const productCount = products.filter(
                    (p) => p.category?.toLowerCase() === cat.name?.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                        cat.enabled
                          ? 'bg-white border-stone-200 shadow-xs hover:shadow-md hover:border-emerald-300'
                          : 'bg-stone-100/70 border-stone-200/80 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Top row: Image + Info + ON/OFF switch */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 relative">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                                  {cat.name}
                                </div>
                                {cat.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#FF6A00] text-white text-[9px] font-bold uppercase tracking-wider">
                                    {cat.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                /{cat.slug}
                              </div>
                              <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                                {productCount} টি প্রোডাক্ট
                              </div>
                            </div>
                          </div>

                          {/* Toggle ON/OFF Switch (Exact style from screenshot) */}
                          <button
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer shadow-2xs shrink-0 ${
                              cat.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-stone-300 hover:bg-stone-400 text-stone-700'
                            }`}
                          >
                            {cat.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Action Strip: Reorder & Edit / Delete */}
                      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-bold mr-1">#{index + 1}</span>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleReorderCategory(index, 'up')}
                            className={`p-1 rounded-lg border border-stone-200 text-stone-600 transition-colors ${
                              index === 0
                                ? 'opacity-30 cursor-not-allowed bg-stone-50'
                                : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 cursor-pointer bg-white'
                            }`}
                            title="Move Up (আগে নিন)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => handleReorderCategory(index, 'down')}
                            className={`p-1 rounded-lg border border-stone-200 text-stone-600 transition-colors ${
                              index === categories.length - 1
                                ? 'opacity-30 cursor-not-allowed bg-stone-50'
                                : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 cursor-pointer bg-white'
                            }`}
                            title="Move Down (পিছে নিন)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 8: CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            
            {/* Top ON/OFF Toggle Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Customer Reviews & Rating System (কাস্টমার রিভিউ সিস্টেম)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    enableCustomerReviews ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {enableCustomerReviews ? 'Enabled / সক্রিয়' : 'Disabled / বন্ধ'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {enableCustomerReviews
                    ? 'গ্রাহকরা প্রোডাক্ট পেজে গিয়ে রিভিউ, রেটিং দিতে পারছেন এবং অন্য গ্রাহকদের মতামত দেখতে পাচ্ছেন।'
                    : 'প্রোডাক্ট পেজ থেকে রিভিউ এবং রেটিং সেকশন সাময়িকভাবে হাইড করা রয়েছে।'}
                </p>
              </div>

              {/* Master ON / OFF Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleCustomerReviews) {
                    onToggleCustomerReviews(!enableCustomerReviews);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 ${
                  enableCustomerReviews
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
                id="btn-toggle-customer-reviews"
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${enableCustomerReviews ? 'scale-100' : 'scale-75 opacity-70'}`} />
                <span>{enableCustomerReviews ? 'Reviews: ON' : 'Reviews: OFF'}</span>
              </button>
            </div>

            {/* Reviews List */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="text-sm font-bold text-stone-900 font-serif">
                  All Submitted Product Reviews ({customerReviews.length} টি রিভিউ)
                </h4>
              </div>

              {customerReviews.length > 0 ? (
                <div className="space-y-3">
                  {customerReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900 text-xs">{rev.customerName}</span>
                          <span className="text-amber-500 text-xs font-bold flex items-center">
                            ★ {rev.rating}/5
                          </span>
                          <span className="text-[11px] font-semibold text-[#0A3828] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {rev.productName || 'Product'}
                          </span>
                          {rev.city && (
                            <span className="text-[10px] text-stone-400">({rev.city})</span>
                          )}
                          <span className="text-[10px] text-stone-400">• {rev.createdAt}</span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Verified
                        </span>

                        {onDeleteReview && (
                          <button
                            type="button"
                            onClick={() => onDeleteReview(rev.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete this review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  কোনো রিভিউ পাওয়া যায়নি।
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 9: ADMINS & STAFF (ACCESS CONTROL) */}
        {activeTab === 'staff' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#0a5c36] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#0a5c36]">Role-Based Access Control (RBAC)</h4>
                <p className="text-[11px] text-emerald-800">
                  Only emails listed below will have authorization to login to the Admin Dashboard. Super Admin can invite/grant access to managers and staff.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Staff Form */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-4 h-4 text-[#0a5c36]" />
                  <h3 className="text-sm font-bold text-stone-900 font-serif">Grant Admin Access</h3>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700">Staff Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mahir Rahman"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Authorized Gmail / Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@gmail.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-600 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Assigned Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as StaffMember['role'])}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="Store Manager">Store Manager (Products & Orders)</option>
                      <option value="Order Specialist">Order Specialist (Orders & Dispatch)</option>
                      <option value="Super Admin">Super Admin (Full Access)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Authorize Staff Email
                  </button>
                </form>
              </div>

              {/* Staff List Table */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 font-serif mb-4">Authorized Admin & Staff List</h3>
                <div className="space-y-3">
                  {staffList.map((s) => {
                    const isOwner = s.email.toLowerCase() === 'albarakahpremium10@gmail.com';
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-950 text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs">{s.name}</span>
                              {isOwner && (
                                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8B6508] border border-[#D4AF37]/40 text-[9px] font-black uppercase">
                                  Primary Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono mt-0.5">{s.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            s.role === 'Super Admin' 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {s.role}
                          </span>

                          {!isOwner && (
                            <button
                              onClick={() => handleDeleteStaff(s.id, s.email)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TOP SELLING PRODUCTS */}
        {activeTab === 'topSelling' && (
          <TopSellingAdmin
            config={topSellingConfig}
            products={products}
            onSaveConfig={(newCfg) => {
              if (onUpdateTopSellingConfig) {
                onUpdateTopSellingConfig(newCfg);
              }
            }}
          />
        )}

        {/* TAB 10: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs max-w-3xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">Store Configuration & Logistics</h3>
                  <p className="text-xs text-stone-500">স্টোরের সাধারণ তথ্য, ডেলিভারি চার্জ ও ব্যাকআপ সেটিংস পরিবর্তন করুন</p>
                </div>
                <button
                  onClick={handleSaveDeliverySettings}
                  className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. General Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-600">General Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700">Store Title</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700">Support Hotline Phone</label>
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Charge & Shipping Rules (Customizable) */}
                <div className="pt-4 border-t border-stone-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0a5c36]" />
                        <span>Delivery Charges & Shipping Rules (ডেলিভারি চার্জ সেটিংস)</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        চেকআউট পেজে গ্রাহকদের জন্য এরিয়া ভিত্তিক ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সীমা নির্ধারণ করুন
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Live Dynamic
                    </span>
                  </div>

                  {/* Core Rates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span>Inside Dhaka Delivery (৳)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">ঢাকা সিটির ভিতরে</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={insideDhakaDelivery}
                          onChange={(e) => setInsideDhakaDelivery(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">৳</span>
                      </div>
                      <input
                        type="text"
                        placeholder="আনুমানিক সময় (যেমন: ১-২ কার্যদিবস)"
                        value={estInsideDhakaText}
                        onChange={(e) => setEstInsideDhakaText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-700 focus:outline-hidden"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                      <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span>Outside Dhaka Delivery (৳)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">ঢাকা সিটির বাইরে</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={outsideDhakaDelivery}
                          onChange={(e) => setOutsideDhakaDelivery(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">৳</span>
                      </div>
                      <input
                        type="text"
                        placeholder="আনুমানিক সময় (যেমন: ২-৪ কার্যদিবস)"
                        value={estOutsideDhakaText}
                        onChange={(e) => setEstOutsideDhakaText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-700 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Dhaka Suburb Option */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-stone-800">
                          Dhaka Suburb / উপশহর জোন (সাভার, গাজীপুর, কেরানীগঞ্জ)
                        </p>
                        <p className="text-[11px] text-stone-500">
                          ঢাকা পার্শ্ববর্তী অঞ্চলের জন্য আলাদা বিশেষ ডেলিভারি চার্জ সক্রিয় করুন
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSubDhakaEnabled(!isSubDhakaEnabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSubDhakaEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isSubDhakaEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {isSubDhakaEnabled && (
                      <div className="pt-2 flex items-center gap-3">
                        <label className="text-xs font-bold text-stone-700 whitespace-nowrap">Suburb Charge (৳):</label>
                        <input
                          type="number"
                          min="0"
                          value={subDhakaDelivery}
                          onChange={(e) => setSubDhakaDelivery(Number(e.target.value))}
                          className="w-32 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Free Delivery Threshold */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Free Delivery Promotion (ফ্রি ডেলিভারি অফার)</span>
                        </p>
                        <p className="text-[11px] text-stone-600">
                          নির্দিষ্ট টাকার বেশি কেনাকাটা করলে গ্রাহককে স্বয়ংক্রিয় ফ্রি ডেলিভারি প্রদান করুন
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFreeDeliveryEnabled(!isFreeDeliveryEnabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isFreeDeliveryEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isFreeDeliveryEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {isFreeDeliveryEnabled && (
                      <div className="pt-2 flex items-center gap-3">
                        <label className="text-xs font-bold text-emerald-950 whitespace-nowrap">
                          ন্যূনতম অর্ডার মূল্য (৳):
                        </label>
                        <input
                          type="number"
                          min="100"
                          value={freeDeliveryThresholdAmount}
                          onChange={(e) => setFreeDeliveryThresholdAmount(Number(e.target.value))}
                          className="w-36 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-stone-900 focus:outline-hidden"
                        />
                        <span className="text-[11px] text-stone-600">বা তার বেশি অর্ডারে ডেলিভারি চার্জ ০ টাকা হবে</span>
                      </div>
                    )}
                  </div>

                  {/* Checkout Notice */}
                  <div>
                    <label className="text-xs font-bold text-stone-700">Checkout Delivery Notice (গ্রাহকের জন্য মেসেজ)</label>
                    <input
                      type="text"
                      value={deliveryNoticeStr}
                      onChange={(e) => setDeliveryNoticeStr(e.target.value)}
                      placeholder="যেমন: সারা বাংলাদেশে দ্রুততম সময়ে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-emerald-600 text-stone-800"
                    />
                  </div>

                  {/* Advance Delivery Charge & Fake Order Prevention */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 to-amber-50/50 border border-pink-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#e2136e]" />
                          <span>Advance Delivery Charge Requirement (অগ্রিম ডেলিভারি চার্জ মোড)</span>
                        </label>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          ফেক অর্ডার ও অনাকাঙ্ক্ষিত কুরিয়ার রিটার্ন রোধ করতে ক্যাশ অন ডেলিভারিতে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশে গ্রহণ করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequireAdvanceDeliveryCharge(!requireAdvanceDeliveryCharge)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          requireAdvanceDeliveryCharge
                            ? 'bg-[#e2136e] text-white shadow-xs'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {requireAdvanceDeliveryCharge ? 'বাধ্যতামূলক (ON)' : 'ঐচ্ছিক (OFF)'}
                      </button>
                    </div>

                    {requireAdvanceDeliveryCharge && (
                      <div className="pt-2 border-t border-pink-200/60 space-y-2">
                        <label className="text-[11px] font-bold text-stone-800">
                          গ্রাহকের জন্য অগ্রিম পেমেন্ট নির্দেশনা মেসেজ:
                        </label>
                        <input
                          type="text"
                          value={advanceDeliveryNotice}
                          onChange={(e) => setAdvanceDeliveryNotice(e.target.value)}
                          placeholder="ফেক অর্ডার ও রিটার্ন রোধে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে।"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-pink-200 text-xs font-medium focus:outline-hidden focus:border-[#e2136e] text-stone-900"
                        />
                        <p className="text-[10px] text-pink-800 font-medium">
                          💡 পরামর্শ: গ্রাহক মোট বিলের সাথে স্পষ্ট দেখতে পাবেন "অগ্রিম প্রদেয়: ৳{insideDhakaDelivery}/৳{outsideDhakaDelivery}" এবং "ক্যাশ অন ডেলিভারি: ৳বাকি টাকা"।
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Customer Reviews Toggle */}
                <div className="pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Customer Reviews & Rating System
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Enable or disable product reviews and customer star ratings across all product pages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleCustomerReviews) {
                          onToggleCustomerReviews(!enableCustomerReviews);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        enableCustomerReviews
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {enableCustomerReviews ? 'ON (সক্রিয়)' : 'OFF (বন্ধ)'}
                    </button>
                  </div>
                </div>

                {/* bKash Payment & PGW API Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 bg-pink-50/60 rounded-2xl border border-pink-200/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs">
                          ৳
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          bKash Payment Gateway & Personal Number Settings
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        পার্সোনাল বিকাশ নম্বর (<strong className="font-mono text-[#e2136e]">{bkashConfig.personalNumber}</strong>) বা ভবিষ্যৎ অফিসিয়াল bKash PGW API Credentials কনফিগার করুন
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bkashConfig.enabled ? 'bg-pink-100 text-[#e2136e] border border-pink-200' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Status: {bkashConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-stone-700 border border-stone-200">
                          Mode: {bkashConfig.mode === 'GATEWAY' ? 'API Gateway' : `Manual (${bkashConfig.accountType})`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBkashModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#e2136e] hover:bg-[#c2105e] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure bKash</span>
                    </button>
                  </div>
                </div>

                {/* Courier Settings Card in Store Settings */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0a5c36]" />
                        <span className="text-xs font-bold text-stone-900">
                          One-Click Courier Integration (Steadfast & Pathao)
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        API Credentials, Auto-dispatch rules এবং Courier Portal সেটিংস কনফিগার করুন
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          courierConfig.steadfast.enabled ? 'bg-emerald-200 text-emerald-950' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Steadfast: {courierConfig.steadfast.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          courierConfig.pathao.enabled ? 'bg-red-200 text-red-950' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Pathao: {courierConfig.pathao.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCourierModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure API</span>
                    </button>
                  </div>
                </div>

                {/* Database Backup & Disaster Recovery Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-800" />
                          <span className="text-xs font-bold text-stone-900">
                            Database Backup & Disaster Recovery (ডাটাবেস ব্যাকআপ ও রিস্টোর)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          এক ক্লিকে সম্পূর্ণ স্টোরের ডাটা (Products, Orders, Categories, Reviews, Settings) অফলাইনে ডাউনলোড করে সংরক্ষণ করুন অথবা ব্যাকআপ ফাইল থেকে রিস্টোর করুন।
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {/* Export / Download Backup Button */}
                      <button
                        type="button"
                        disabled={isExportingBackup}
                        onClick={handleDownloadFullBackup}
                        className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isExportingBackup ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Exporting Backup...</span>
                          </>
                        ) : (
                          <>
                            <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Download Full Backup (JSON)</span>
                          </>
                        )}
                      </button>

                      {/* Restore From File Input Button */}
                      <label className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-stone-600" />
                        <span>Restore From Backup File</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleFileUploadForRestore}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="text-[10px] text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0a5c36] shrink-0" />
                      <span>ব্যাকআপ নেওয়া ফাইলটি যেকোনো সময় রিস্টোর করে পূর্বের সমস্ত ডেটা ফিরিয়ে আনা যাবে।</span>
                    </div>
                  </div>
                </div>

                {/* QR Code & Bottle Authenticity Stickers Card */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-2xl border border-amber-300/60 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-800" />
                          <span className="text-xs font-bold text-stone-900">
                            QR Code & Bottle Authenticity Stickers (আল-বারাকাহ ব্রান্ডিং কিউআর ও স্টিকার জেনারেটর)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          আপনার কাস্টম ডোমেইন <strong className="text-amber-900">https://albarakahpremium.com</strong> এবং খাঁটি সরিষার তেলের বোতলের জন্য হাই-রেজোলিউশন কিউআর কোড ও প্রিন্ট-রেডি বোতল স্টিকার তৈরি করে সরাসরি ডাউনলোড (PNG/SVG) করুন।
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQrModalProduct(null);
                          setIsQrModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2 shrink-0"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Open QR Studio</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleSaveDeliverySettings}
                    className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save All Store & Delivery Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: QR CODE & BOTTLE STICKER STUDIO */}
        {activeTab === 'qrcode' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            <div className="bg-gradient-to-br from-[#03251a] via-[#053828] to-[#0a5c36] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-amber-400/30">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>আল-বারাকাহ প্রিমিয়াম অফিশিয়াল কিউআর ও স্টিকার স্টুডিও</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-serif tracking-tight text-white">
                  ব্রান্ডিং কিউআর কোড ও প্রোডাক্ট অথেনটিসিটি স্টিকার তৈরি করুন
                </h2>
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                  কাস্টম ডোমেইন <strong className="text-amber-300">albarakahpremium.com</strong> এর সাথে সরিষার তেল ও অন্যান্য পণ্যের বোতলের গায়ের জন্য তৈরি করুন হাই-রেজোলিউশন (1200px) প্রিন্ট-রেডি লেবেল স্টিকার ও কিউআর কোড। গ্রাহক বোতলের কিউআর স্ক্যান করলেই প্রোডাক্টের সত্যতা যাচাই করতে পারবে।
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setQrModalProduct(null);
                      setIsQrModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>লঞ্চ করুন কিউআর ও বোতল স্টিকার জেনারেটর</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Product QR Grid */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base font-serif">
                    পণ্যের জন্য সরাসরি কিউআর ও স্টিকার তৈরি করুন
                  </h3>
                  <p className="text-xs text-stone-500">
                    যেকোনো প্রোডাক্ট সিলেক্ট করে এক ক্লিকে তার নির্দিষ্ট কিউআর কোড বা বোতল স্টিকার ডাউনলোড করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3 bg-stone-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.image || (prod as any).imageUrl}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 line-clamp-1">{prod.name}</div>
                        <div className="text-[11px] text-stone-500">{prod.category}</div>
                        <div className="text-[10px] font-mono text-emerald-700">albarakahpremium.com/?verify={prod.id}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setQrModalProduct(prod);
                        setIsQrModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>স্টিকার</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Add or Edit Product (Full Screen Spacious Interface) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-6xl h-full max-h-[96vh] shadow-2xl flex flex-col overflow-hidden border border-stone-200">
            {/* Top Header */}
            <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-stone-900 font-serif">
                      {prodFormId ? 'Edit Product (প্রোডাক্ট এডিট করুন)' : 'Add New Product (নতুন প্রোডাক্ট যোগ করুন)'}
                    </h3>
                    {prodFormId && (
                      <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                        ID: {prodFormId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    প্রোডাক্টের বিবরণ, মূল্য, ছবি ও লিংক পরিবর্তন করে সরাসরি লাইভ স্টোরে আপডেট করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body - 2 Columns */}
            <form onSubmit={handleSaveProductForm} className="flex-1 overflow-y-auto flex flex-col justify-between bg-stone-50/50">
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (7 cols): Basic Details & Pricing */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Card 1: Product Title & Auto-generated Slug */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <span>General Information</span>
                    </h4>
                    
                    <div>
                      <label className="block font-bold text-stone-800 text-xs mb-1.5">
                        Product Title / Name (প্রোডাক্টের নাম) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Deshi Authentic Mustard Oil 5 liter"
                        value={prodFormName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdFormName(val);
                          if (!prodFormId || !prodFormSlug) {
                            setProdFormSlug(generateSlug(val));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Auto URL (Slug) Section */}
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-stone-700 text-xs">
                          Auto-generated Product URL (Slug)
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          SEO Friendly Clean URL
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-stone-200">
                        <span className="text-xs font-mono text-stone-400 select-none">
                          /product/
                        </span>
                        <input
                          type="text"
                          placeholder="auto-generated-slug"
                          value={prodFormSlug}
                          onChange={(e) => setProdFormSlug(generateSlug(e.target.value))}
                          className="w-full text-xs font-mono font-medium text-emerald-900 focus:outline-none bg-transparent"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500">
                        কাস্টমার সরাসরি এই লিংকের মাধ্যমে প্রোডাক্ট পেজটি ব্রাউজ করতে পারবে।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Category (ক্যাটাগরি) *
                        </label>
                        <select
                          value={prodFormCategory}
                          onChange={(e) => setProdFormCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
                        >
                          {categories && categories.length > 0
                            ? categories.map((c) => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                              ))
                            : [
                                'Organic Foods',
                                'Premium Watches',
                                'Luxury Attar',
                                'Sunnah Products',
                                'Women Collection',
                                'Medicine & Health',
                                'Baby Toys',
                                'Combo',
                                'Offer Zone'
                              ].map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Promotional Badge (প্রোমো ব্যাজ)
                        </label>
                        <select
                          value={prodFormBadge}
                          onChange={(e) => setProdFormBadge(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
                        >
                          <option value="">None (কোনো ব্যাজ নেই)</option>
                          <option value="BESTSELLER">BESTSELLER (বেস্টসেলার)</option>
                          <option value="HOT">HOT (হট আইটেম)</option>
                          <option value="SALE">SALE (বিশেষ ছাড়)</option>
                          <option value="NEW">NEW (নতুন আগমন)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Pricing & Stock */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Pricing & Inventory (মূল্য ও স্টক)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block font-bold text-stone-800 text-xs mb-1.5">
                          Selling Price (৳ বিক্রয় মূল্য) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodFormPrice}
                            onChange={(e) => setProdFormPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-emerald-800 text-xs mb-1.5 flex items-center justify-between">
                          <span>কেনা দাম (Cost Price)</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">লাভের হিসাব</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="ক্রয় / উৎপাদন খরচ"
                            value={prodFormCostPrice}
                            onChange={(e) => setProdFormCostPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Original Price (৳ পূর্বের মূল্য)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="ঐচ্ছিক"
                            value={prodFormOriginalPrice}
                            onChange={(e) => setProdFormOriginalPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Stock Units (মজুদ সংখ্যা)
                        </label>
                        <input
                          type="number"
                          value={prodFormStock}
                          onChange={(e) => setProdFormStock(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Weight & Size Variants with 1-Click Quick Add Presets (Optional) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          Weight & Size Variants (ওজন ও সাইজ ভ্যারিয়েন্ট)
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          (ঐচ্ছিক / Optional) একাধিক ওজন বা সাইজ থাকলে নিচের Quick Add বাটন চাপুন
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Optional / ঐচ্ছিক
                      </span>
                    </div>

                    {/* Quick Add Presets (Matching user screenshot exactly) */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-bold text-stone-700 select-none mr-1">
                          Quick Add:
                        </span>
                        {QUICK_ADD_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleApplyQuickAdd(preset.variants)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-[11px] font-medium border border-stone-200 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Variant Input & Active Variants Pills */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="কাস্টম সাইজ লিখুন (যেমন: 250g, 3 Litre, XL)..."
                          value={customVariantInput}
                          onChange={(e) => setCustomVariantInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomVariant();
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomVariant}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          + Add
                        </button>
                        {prodFormSizes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setProdFormSizes([])}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                            title="সব ভ্যারিয়েন্ট মুছুন"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Active Variants List */}
                      {prodFormSizes.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-bold text-stone-500">যুক্ত সাইজসমূহ:</span>
                          {prodFormSizes.map((variant, vIdx) => (
                            <span
                              key={vIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200"
                            >
                              <span>{variant}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant)}
                                className="text-emerald-600 hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">
                          কোনো ভ্যারিয়েন্ট যোগ করা হয়নি (প্রোডাক্টটি সাধারণ একক পণ্য হিসেবে প্রদর্শিত হবে)।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Description */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                    <label className="block font-bold text-stone-800 text-xs">
                      Product Description (প্রোডাক্টের বিস্তারিত বিবরণ)
                    </label>
                    <textarea
                      rows={4}
                      value={prodFormDescription}
                      onChange={(e) => setProdFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      placeholder="প্রোডাক্টের গুণাগুণ, প্রস্তুত প্রণালী, ব্যবহারবিধি ও বিশেষত্ব লিখুন..."
                    />
                  </div>

                </div>

                {/* Right Column (5 cols): 3 Photo Uploads & Live Customer Storefront Card Preview */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* 3 Photos Upload Card */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-stone-800 text-xs">
                        প্রোডাক্টের ছবি (৩টি ছবি আপলোড করুন) *
                      </label>
                      <span className="text-[10px] text-stone-500 font-semibold">
                        মেইন ছবি + ২টি গ্যালারি
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[0, 1, 2].map((slotIdx) => {
                        const imgUrl = prodFormImages[slotIdx] || '';
                        const isPrimary = slotIdx === 0;

                        return (
                          <div key={slotIdx} className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isPrimary ? 'bg-orange-100 text-[#f38018]' : 'bg-stone-200 text-stone-700'
                              }`}>
                                {isPrimary ? 'ছবি ১ (মেইন)' : `ছবি ${slotIdx + 1}`}
                              </span>
                              {imgUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...prodFormImages];
                                    updated[slotIdx] = '';
                                    setProdFormImages(updated);
                                  }}
                                  className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                                >
                                  রিমুভ
                                </button>
                              )}
                            </div>

                            {/* Image Preview Box */}
                            <div className="w-full h-24 rounded-lg bg-white border border-stone-200 flex items-center justify-center overflow-hidden">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={`Slot ${slotIdx + 1}`}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium">ছবি নেই</span>
                              )}
                            </div>

                            {/* Upload from Device Button */}
                            <label className="flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>আপলোড</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleProductImageSlotUpload(slotIdx, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>

                            {/* URL input */}
                            <input
                              type="text"
                              value={imgUrl}
                              onChange={(e) => {
                                const updated = [...prodFormImages];
                                updated[slotIdx] = e.target.value;
                                setProdFormImages(updated);
                              }}
                              placeholder="URL দিন..."
                              className="w-full px-2 py-1 rounded-md bg-white border border-stone-200 text-[10px] text-stone-800 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Storefront Card Preview */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Live Storefront Preview
                      </h4>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        কাস্টমার যেভাবে দেখবে
                      </span>
                    </div>

                    <div className="max-w-[240px] mx-auto bg-white rounded-2xl border border-stone-200 p-3 shadow-sm space-y-2.5">
                      <div className="relative w-full h-36 bg-stone-50 rounded-xl overflow-hidden flex items-center justify-center">
                        {prodFormBadge && (
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md shadow-xs bg-[#0a5c36] text-white">
                            {prodFormBadge}
                          </span>
                        )}
                        <img
                          src={prodFormImages[0] || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80'}
                          alt="Preview"
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-emerald-800 uppercase">
                          {prodFormCategory}
                        </div>
                        <div className="text-xs font-bold text-stone-900 line-clamp-1">
                          {prodFormName || 'প্রোডাক্টের নাম লিখুন'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-amber-500 text-[10px] font-bold">
                          <span>★ 5.0 (1)</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1 border-t border-stone-100">
                        <span className="text-sm font-black text-emerald-900">
                          ৳{prodFormPrice || '0'}
                        </span>
                        {prodFormOriginalPrice && (
                          <span className="text-[11px] text-stone-400 line-through">
                            ৳{prodFormOriginalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Sticky Bottom Action Bar */}
              <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
                <div className="text-xs text-stone-500 hidden sm:block">
                  প্রোডাক্টটি সেভ করার সাথে সাথে লাইভ ওয়েবসাইটে তথ্য হালনাগাদ হবে।
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{prodFormId ? 'Save Changes (সেভ করুন)' : 'Add Product to Store (যোগ করুন)'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation (Permission / অনুমতি পপআপ) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  প্রোডাক্ট ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-stone-500">Delete Product Confirmation</p>
              </div>
            </div>

            {/* Product Snapshot Box */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
              <img
                src={productToDelete.image || (productToDelete.images && productToDelete.images[0])}
                alt={productToDelete.name}
                className="w-12 h-12 rounded-xl object-contain bg-white border border-stone-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 truncate">
                  {productToDelete.name}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                  <span className="bg-stone-200 px-1.5 py-0.2 rounded text-[10px] font-semibold text-stone-700">{productToDelete.category}</span>
                  <span className="font-bold text-emerald-800">৳{productToDelete.price}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
              ⚠️ আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি ডিলিট করতে চান? ডিলিট করলে এটি অনলাইন শপ ও ডাটাবেস থেকে মুছে যাবে।
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Product (ডিলিট করুন)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-stone-200 my-auto flex flex-col overflow-hidden">
            {/* Fixed Top Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a5c36] text-white flex items-center justify-center font-black shrink-0">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 font-serif leading-tight">
                    {editingCategoryId ? 'Edit Category (ক্যাটাগরি এডিট)' : 'Add New Category (নতুন ক্যাটাগরি)'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {editingCategoryId ? 'ক্যাটাগরির নাম, ছবি ও ব্যাজ আপডেট করুন' : 'শপে নতুন ক্যাটাগরি আইটেম যুক্ত করুন'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="category-form" onSubmit={handleSaveCategoryForm} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Category Name (ক্যাটাগরির নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={(e) => {
                    setCatFormName(e.target.value);
                    if (!editingCategoryId) {
                      setCatFormSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="যেমন: খাটি মধু ও ঘি / Watches / আতর"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              {/* Slug & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    URL Slug (লিংক স্লাগ)
                  </label>
                  <input
                    type="text"
                    value={catFormSlug}
                    onChange={(e) => setCatFormSlug(e.target.value)}
                    placeholder="organic-honey"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    Badge Tag (ঐচ্ছিক ব্যাজ)
                  </label>
                  <input
                    type="text"
                    value={catFormBadge}
                    onChange={(e) => setCatFormBadge(e.target.value)}
                    placeholder="যেমন: HOT, NEW, 100% PURE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick Badge Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-stone-400 font-bold">কুইক ব্যাজ:</span>
                {['HOT', 'NEW', '100% PURE', 'POPULAR', 'SALE', 'LUXURY', 'COMBO', 'BESTSELLER'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCatFormBadge(b)}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-orange-100 hover:text-[#f38018] text-stone-600 text-[10px] font-bold transition-colors cursor-pointer border border-stone-200"
                  >
                    +{b}
                  </button>
                ))}
              </div>

              {/* Category Image Section */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">
                    Category Thumbnail Image (ক্যাটাগরির ছবি) *
                  </label>
                  <span className="text-[10px] text-stone-400">আপলোড বা URL দিন</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {catFormImage ? (
                      <img
                        src={catFormImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ডিভাইস থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCategoryImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={catFormImage}
                        onChange={(e) => setCatFormImage(e.target.value)}
                        placeholder="বা Image URL পেস্ট করুন..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset image selector */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-stone-500 font-semibold">
                    অথবা স্যাম্পল ছবি নির্বাচন করুন:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
                    {CATEGORY_PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCatFormImage(preset.url)}
                        className={`p-1.5 rounded-lg text-left text-[10px] font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                          catFormImage === preset.url
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                            : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900">হোমপেজে দৃশ্যমানতা (Visibility)</div>
                  <div className="text-[10px] text-stone-500">অন থাকলে হোমপেজ স্লাইডার ও মেনুতে দেখাবে</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCatFormEnabled(!catFormEnabled)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-colors cursor-pointer shadow-2xs ${
                    catFormEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-300 hover:bg-stone-400 text-stone-700'
                  }`}
                >
                  {catFormEnabled ? 'ON (সক্রিয়)' : 'OFF (লুকানো)'}
                </button>
              </div>
            </form>

            {/* Fixed Bottom Action Buttons */}
            <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50/90 shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="submit"
                form="category-form"
                className="px-6 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingCategoryId ? 'Save Changes (সেভ করুন)' : 'Create Category (তৈরি করুন)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Category Confirmation */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  ক্যাটাগরি ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-stone-500">Delete Category Confirmation</p>
              </div>
            </div>

            {/* Category Snapshot Box */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
              <img
                src={categoryToDelete.image}
                alt={categoryToDelete.name}
                className="w-12 h-12 rounded-xl object-cover bg-white border border-stone-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 truncate">
                  {categoryToDelete.name}
                </div>
                <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                  /{categoryToDelete.slug}
                </div>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
              ⚠️ আপনি কি নিশ্চিতভাবে <strong>"{categoryToDelete.name}"</strong> ক্যাটাগরি মুছে ফেলতে চান?
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Order Confirmation */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  অর্ডার ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-stone-500">Delete Order Confirmation</p>
              </div>
            </div>

            {/* Order Snapshot Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                <span className="font-mono font-bold text-stone-900">
                  #{orderToDelete.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-stone-500 text-[11px]">
                  {new Date(orderToDelete.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">কাস্টমার নাম:</span>
                <span className="font-bold text-stone-900">{getCustomerName(orderToDelete)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">মোবাইল নম্বর:</span>
                <span className="font-mono font-semibold text-stone-800">{getCustomerPhone(orderToDelete)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">মোট বিল (Total):</span>
                <span className="font-bold text-[#0a5c36]">৳{Math.round(getOrderTotal(orderToDelete) * rate).toLocaleString()}</span>
              </div>
              {orderToDelete.items && orderToDelete.items.length > 0 && (
                <div className="pt-1 text-[11px] text-stone-500 truncate">
                  আইটেম: {orderToDelete.items.map(it => `${it.product?.name || 'Item'} (${it.quantity})`).join(', ')}
                </div>
              )}
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
              ⚠️ আপনি কি নিশ্চিতভাবে এই অর্ডারটি মুছে ফেলতে চান? এটি ফায়ারবেস ক্লাউড ডাটাবেজ থেকে স্থায়ীভাবে রিমুভ হয়ে যাবে।
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, ডিলিট করুন (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Modal: Order Details */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            {/* Header (Fixed Top) */}
            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0a5c36] border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-stone-900 font-serif leading-tight">
                    Order #{selectedOrderDetails.id.slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content (Scrollable Middle Section) */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 text-xs">
              {/* Customer Details Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <div className="font-bold text-stone-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>Customer Details:</span>
                </div>
                <div className="text-stone-900 font-bold text-xs">{getCustomerName(selectedOrderDetails)}</div>
                <div className="text-stone-700 font-medium">Phone: {getCustomerPhone(selectedOrderDetails)}</div>
                <div className="text-stone-700">Address: {getCustomerAddress(selectedOrderDetails)}</div>
                <div className="text-stone-500 text-[11px]">Zip: {getCustomerZip(selectedOrderDetails)}</div>

                {/* bKash Payment Details if available */}
                {(selectedOrderDetails.bkashTrxId || selectedOrderDetails.senderBkashNumber) && (
                  <div className="mt-2 pt-2 border-t border-pink-200/60 bg-pink-50/70 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e2136e] text-[11px] flex items-center gap-1">
                        <span>৳ bKash Payment Info</span>
                      </span>
                      {selectedOrderDetails.bkashTrxId && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrderDetails.bkashTrxId || '');
                            showToast('TrxID copied to clipboard!');
                          }}
                          className="text-[10px] font-bold text-[#e2136e] hover:underline cursor-pointer"
                        >
                          Copy TrxID
                        </button>
                      )}
                    </div>
                    {selectedOrderDetails.bkashTrxId && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-600">TrxID:</span>
                        <span className="font-mono font-black text-[#e2136e]">{selectedOrderDetails.bkashTrxId}</span>
                      </div>
                    )}
                    {selectedOrderDetails.senderBkashNumber && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-600">Sender Phone:</span>
                        <span className="font-mono font-bold text-stone-800">{selectedOrderDetails.senderBkashNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp Follow-up Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppReminder(selectedOrderDetails)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <span>হোয়াটসঅ্যাপে পেমেন্ট রিমাইন্ডার পাঠান (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* Delivery Payment Status Selector Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0a5c36]" />
                    <span>ডেলিভারি ও পেমেন্ট ভেরিফিকেশন স্ট্যাটাস:</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ADVANCE_PAID', label: '৳ Advance Paid', color: 'bg-emerald-600 text-white' },
                    { id: 'ADVANCE_PENDING', label: '⏳ Advance Pending', color: 'bg-amber-500 text-white' },
                    { id: 'VERIFIED', label: '✓ Verified Order', color: 'bg-teal-600 text-white' },
                    { id: 'FULL_PAID', label: '৳ Full bKash Paid', color: 'bg-pink-600 text-white' },
                    { id: 'COD_PENDING', label: '🚚 COD Pending', color: 'bg-stone-600 text-white' },
                    { id: 'FAKE_SUSPECTED', label: '⚠️ Suspected Fake', color: 'bg-rose-600 text-white' },
                  ].map((st) => {
                    const isSelected = selectedOrderDetails.deliveryPaymentStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleUpdateDeliveryPaymentStatus(selectedOrderDetails.id, st.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? `${st.color} shadow-xs ring-2 ring-stone-900/20`
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center justify-between text-xs">
                  <span>Purchased Items:</span>
                  <span className="text-stone-500 text-[11px] font-normal">
                    {selectedOrderDetails.items?.length || 0} item(s)
                  </span>
                </div>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-2xl p-3 bg-stone-50/50 max-h-48 overflow-y-auto">
                  {selectedOrderDetails.items?.map((it: any, idx: number) => {
                    const itName = it.product?.name || it.productNameSnapshot || 'Item';
                    const itPrice = it.product?.price || it.unitPriceSnapshot || it.price || 0;
                    const itQty = it.quantity || 1;
                    return (
                      <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                        <span className="text-stone-800 font-medium">{itName} × {itQty}</span>
                        <span className="font-bold text-stone-900">{symbol}{Math.round(itPrice * itQty * rate).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Amount & Balance Split Banner */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-stone-900 text-sm">
                  <span>সর্বমোট বিল (Total):</span>
                  <span className="text-emerald-900 font-black">৳{Math.round(getOrderTotal(selectedOrderDetails) * rate).toLocaleString()}</span>
                </div>
                {selectedOrderDetails.advanceAmount !== undefined && selectedOrderDetails.advanceAmount > 0 && (
                  <div className="flex justify-between items-center text-[#e2136e] font-bold">
                    <span>বিকাশে অগ্রিম প্রদেয় / পরিশোধিত:</span>
                    <span>৳{selectedOrderDetails.advanceAmount.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrderDetails.dueAmountOnDelivery !== undefined && (
                  <div className="flex justify-between items-center text-[#0a5c36] font-bold pt-1 border-t border-emerald-200/60">
                    <span>ক্যাশ অন ডেলিভারি বাকি (কুরিয়ার সংগ্রহ করবে):</span>
                    <span className="text-sm font-black">৳{selectedOrderDetails.dueAmountOnDelivery.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Courier Automation Card in Order Details */}
              <div className="pt-1">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#0a5c36]" />
                      <span className="font-bold text-xs text-stone-900">Courier Delivery Integration</span>
                    </div>
                    {selectedOrderDetails.courierConsignmentId ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                        {selectedOrderDetails.courierProvider || 'Courier'} Dispatched
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase border border-amber-200">
                        Not Dispatched
                      </span>
                    )}
                  </div>

                  {selectedOrderDetails.courierConsignmentId ? (
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Consignment ID:</span>
                        <span className="font-mono font-bold text-stone-900">{selectedOrderDetails.courierConsignmentId}</span>
                      </div>
                      {selectedOrderDetails.courierTrackingCode && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Tracking Code:</span>
                          <span className="font-mono font-bold text-[#0a5c36]">{selectedOrderDetails.courierTrackingCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-stone-500">Courier Status:</span>
                        <span className="font-bold text-stone-800 capitalize">{selectedOrderDetails.courierStatus || 'in_review'}</span>
                      </div>
                      {selectedOrderDetails.courierSentAt && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Dispatched At:</span>
                          <span className="text-stone-700">{new Date(selectedOrderDetails.courierSentAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-stone-600">
                        এক ক্লিকে অর্ডারটি পছন্দের কুরিয়ার সার্ভিসে পাঠান:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={courierDispatchingOrderId === selectedOrderDetails.id}
                          onClick={() => handleSendOrderToCourier(selectedOrderDetails, 'steadfast')}
                          className="py-2.5 px-3 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{courierDispatchingOrderId === selectedOrderDetails.id ? 'Sending...' : 'Send to Steadfast'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={courierDispatchingOrderId === selectedOrderDetails.id}
                          onClick={() => handleSendOrderToCourier(selectedOrderDetails, 'pathao')}
                          className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{courierDispatchingOrderId === selectedOrderDetails.id ? 'Sending...' : 'Send to Pathao'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer (Fixed Bottom) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-stone-200 flex items-center justify-between shrink-0 bg-stone-50/90">
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(true)}
                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Courier Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderToDelete(selectedOrderDetails);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Delete this order"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>অর্ডার ডিলিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Courier API Settings */}
      <CourierSettingsModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        config={courierConfig}
        onSave={(newCfg) => {
          if (onUpdateCourierConfig) {
            onUpdateCourierConfig(newCfg);
          }
          setIsCourierModalOpen(false);
          showToast('Courier API credentials saved successfully!');
        }}
      />

      {/* Modal: Restore Confirmation */}
      {showRestoreConfirmModal && pendingRestoreData && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  ডাটাবেস রিস্টোর নিশ্চিতকরণ (Confirm Restore)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  আপনি কি নির্বাচিত ব্যাকআপ ফাইলটি রিস্টোর করতে চান? এই ফাইলের ডাটা দিয়ে ফায়ারবেস ডাটাবেস আপডেট ও সিঙ্ক হবে।
                </p>
              </div>

              {/* Backup Summary details */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">ব্যাকআপ তারিখ:</span>
                  <span className="font-bold text-stone-800">
                    {pendingRestoreData.backupDate ? new Date(pendingRestoreData.backupDate).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">প্রোডাক্ট সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.products?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">ক্যাটাগরি সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.categories?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">অর্ডার রেকর্ড:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.orders?.length || 0} টি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">রিভিউ সংখ্যা:</span>
                  <span className="font-bold text-stone-800">{pendingRestoreData.data.reviews?.length || 0} টি</span>
                </div>
              </div>

              {restoreProgressMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0a5c36]" />
                  <span>{restoreProgressMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isRestoringBackup}
                  onClick={() => {
                    setShowRestoreConfirmModal(false);
                    setPendingRestoreData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  disabled={isRestoringBackup}
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRestoringBackup ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>রিস্টোর হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>হ্যাঁ, রিস্টোর করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Code & Bottle Authenticity Sticker Generator */}
      <QRCodeGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setQrModalProduct(null);
        }}
        products={products}
        defaultProduct={qrModalProduct}
        customDomain="https://albarakahpremium.com"
      />

      {/* Modal: High-Converting Facebook Ad & Sales Landing Page Customizer */}
      {selectedLandingProduct && (
        <LandingPageAdminModal
          isOpen={isLandingPageModalOpen}
          onClose={() => {
            setIsLandingPageModalOpen(false);
            setSelectedLandingProduct(null);
          }}
          product={selectedLandingProduct}
          onSaveLandingPage={handleSaveLandingPageConfig}
          onPreviewLandingPage={(prod) => {
            if (onPreviewLandingPage) {
              onPreviewLandingPage(prod);
            }
          }}
        />
      )}

      {/* Modal: Facebook Pixel, CAPI & Domain Verification */}
      <FacebookPixelSettingsModal
        isOpen={isPixelModalOpen}
        onClose={() => setIsPixelModalOpen(false)}
        config={facebookPixelConfig}
        onSaveConfig={(cfg) => {
          if (onUpdateFacebookPixelConfig) {
            onUpdateFacebookPixelConfig(cfg);
          }
        }}
      />

      {/* Modal: bKash PGW API & Personal Payment Gateway Settings */}
      <BKashSettingsModal
        isOpen={isBkashModalOpen}
        onClose={() => setIsBkashModalOpen(false)}
        config={bkashConfig}
        onSaveConfig={(cfg) => {
          if (onUpdateBkashConfig) {
            onUpdateBkashConfig(cfg);
          }
          showToast('bKash Payment settings saved successfully!');
        }}
      />
    </div>
  );
};
