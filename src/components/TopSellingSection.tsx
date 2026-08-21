import React, { useState } from 'react';
import { Flame, ShoppingCart, Check, ArrowLeftRight } from 'lucide-react';
import { Product } from '../types';
import { TopSellingSectionConfig, TopSellingItem, DEFAULT_TOP_SELLING_CONFIG } from '../types/topSelling';
import { INITIAL_PRODUCTS } from '../data/products';

interface TopSellingSectionProps {
  config?: TopSellingSectionConfig;
  products: Product[];
  compareProducts?: Product[];
  onToggleCompare?: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onOpenProductModal: (product: Product) => void;
}

export const TopSellingSection: React.FC<TopSellingSectionProps> = ({
  config = DEFAULT_TOP_SELLING_CONFIG,
  products,
  compareProducts = [],
  onToggleCompare,
  onAddToCart,
  onBuyNow,
  onOpenProductModal,
}) => {
  const [addedItems, setAddedItems] = useState<{ [id: string]: boolean }>({});

  if (!config.enabled) return null;

  // Resolve items from config.items or fallback to default to ensure exactly 4 items (2x2 grid)
  const rawItems = 
    config.items && config.items.length > 0
      ? config.items
      : DEFAULT_TOP_SELLING_CONFIG.items;

  let itemsToRender: TopSellingItem[] = rawItems.filter((i) => i.enabled !== false);
  
  // Guarantee exactly 4 items in 2 lines (2 in line 1, 2 in line 2)
  while (itemsToRender.length < 4) {
    const idx = itemsToRender.length;
    itemsToRender.push(DEFAULT_TOP_SELLING_CONFIG.items[idx] || {
      id: `top-banner-${idx + 1}`,
      name: `স্পেশাল অফার ${idx + 1}`,
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      price: 950,
      originalPrice: 1200,
      badge: 'HOT DEAL',
    });
  }
  itemsToRender = itemsToRender.slice(0, 4);

  // Helper to convert a TopSellingItem to a full Product object
  const resolveProduct = (item: TopSellingItem, index: number): Product => {
    const itemPrice = item.overridePrice ?? item.price;
    const itemOrigPrice = item.overrideOriginalPrice ?? item.originalPrice;
    const itemBadge = (item.badgeText || item.badge || 'HOT DEAL') as any;
    const itemCustomImg = item.image && item.image.trim() !== '' ? item.image.trim() : '';

    if (item.productId) {
      const foundInProps = products.find((p) => p.id === item.productId || (item.name && p.name.toLowerCase() === item.name.toLowerCase()));
      if (foundInProps) {
        const finalImg = itemCustomImg || foundInProps.image;
        return {
          ...foundInProps,
          name: item.name && item.name.trim() !== '' ? item.name : foundInProps.name,
          price: itemPrice || foundInProps.price,
          originalPrice: itemOrigPrice ?? foundInProps.originalPrice,
          weight: item.overrideWeight || foundInProps.weight,
          image: finalImg,
          badge: itemBadge,
        };
      }
    }

    const fallbackImgs = [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    ];
    const finalFallback = itemCustomImg || fallbackImgs[index % fallbackImgs.length];

    // Synthetic product fallback
    return {
      id: item.productId || item.id || `custom-banner-${index + 1}`,
      name: item.name || `স্পেশাল অফার ${index + 1}`,
      category: 'Top Selling',
      price: itemPrice || 950,
      originalPrice: itemOrigPrice || 1200,
      weight: item.overrideWeight || '১ কেজি',
      rating: 5.0,
      reviewCount: 240,
      image: finalFallback,
      images: [finalFallback],
      description: `${item.name || 'Premium Product'} - ১০০% খাঁটি প্রিমিয়াম কোয়ালিটি পণ্য।`,
      features: ['১০০% খাঁটি ও প্রিমিয়াম গ্রেড', 'অরিজিনাল কোয়ালিটি নিশ্চিত', 'ক্যাশ অন ডেলিভারি সুবিধা'],
      inStock: true,
      stockCount: 50,
      badge: itemBadge,
      tags: ['top selling', 'bestseller']
    };
  };

  const handleAdd = (e: React.MouseEvent, prod: Product, itemId: string) => {
    e.stopPropagation();
    onAddToCart(prod, 1);
    setAddedItems((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 1500);
  };

  const handleOrder = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    onBuyNow(prod, 1);
  };

  const handleCompareClick = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(prod);
    }
  };

  return (
    <section 
      id="top-selling-section"
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6"
    >
      {/* Centered Heading */}
      {config.title && (
        <div className="text-center mb-3 sm:mb-5">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#113149] tracking-tight font-sans">
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* 2 Lines with 2 Banners in each line (2x2 = 4 Banners) with clean, unzoomed framing */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2 sm:gap-4 md:gap-5">
        {itemsToRender.map((item, index) => {
          const resolvedProduct = resolveProduct(item, index);
          const currentPrice = Number(item.price || resolvedProduct.price || 0);
          const origPrice = Number(item.originalPrice ?? resolvedProduct.originalPrice ?? 0);
          const discountAmount = origPrice > currentPrice ? origPrice - currentPrice : 0;
          const badgeText = item.badge || item.badgeText || resolvedProduct.badge || '';
          const isAdded = Boolean(addedItems[item.id]);
          const isCompared = compareProducts.some((p) => p.id === resolvedProduct.id);

          return (
            <div
              key={item.id || index}
              id={`top-selling-banner-card-${item.id || index}`}
              onClick={() => onOpenProductModal(resolvedProduct)}
              className="group bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative cursor-pointer"
            >
              <div>
                {/* Banner / Product Image Container - Auto Contain with clean bounds */}
                <div className="w-full h-[140px] sm:h-[200px] md:h-[240px] bg-white flex items-center justify-center p-2 relative overflow-hidden">
                  {/* Badge */}
                  {badgeText && (
                    <div className="absolute top-2 left-2 z-10">
                      <span 
                        style={{ backgroundColor: item.badgeBgColor || '#ef4444', color: item.badgeTextColor || '#ffffff' }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-black uppercase shadow-xs tracking-wide"
                      >
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        <span>{badgeText}</span>
                      </span>
                    </div>
                  )}

                  {/* Top Right: Compare Button */}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={(e) => handleCompareClick(e, resolvedProduct)}
                      className={`absolute top-2 right-2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isCompared
                          ? 'bg-[#f38018] text-white shadow-xs'
                          : 'bg-stone-100/90 hover:bg-stone-200 text-stone-600 hover:text-[#f38018]'
                      }`}
                      title={isCompared ? 'In Comparison' : 'Compare Product'}
                    >
                      <ArrowLeftRight className="w-3 h-3 stroke-[2.4]" />
                    </button>
                  )}

                  {/* Banner Image - strictly fitted without aggressive cropping or zooming */}
                  <img
                    src={item.image || resolvedProduct.image}
                    alt={item.name || resolvedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                {/* Info Section */}
                <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-left border-t border-stone-100">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1 leading-snug group-hover:text-[#f38018] transition-colors">
                    {item.name || resolvedProduct.name}
                  </h3>

                  <div className="mt-1 flex items-baseline gap-1.5 font-bengali flex-wrap">
                    <span className="text-sm sm:text-base md:text-lg font-black text-[#f38018] tracking-tight">
                      ৳{currentPrice.toLocaleString()}
                    </span>
                    {origPrice > currentPrice && (
                      <span className="text-[11px] sm:text-xs text-stone-400 line-through">
                        ৳{origPrice.toLocaleString()}
                      </span>
                    )}
                    {discountAmount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold text-[#15803d] bg-[#dcfce7]">
                        Save ৳{discountAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Order & Cart Buttons */}
              <div className="p-2 sm:p-3 pt-0 flex gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleOrder(e, resolvedProduct)}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold py-1.5 sm:py-2 px-1.5 rounded-lg text-[11px] sm:text-xs text-center shadow-xs transition-all active:scale-[0.98]"
                >
                  অর্ডার করুন
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAdd(e, resolvedProduct, item.id)}
                  className={`px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-[11px] sm:text-xs flex items-center justify-center transition-all ${
                    isAdded
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-rose-200 text-rose-600 hover:bg-rose-50 bg-white'
                  }`}
                  title="কার্ট-এ যোগ করুন"
                >
                  {isAdded ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TopSellingSection;


