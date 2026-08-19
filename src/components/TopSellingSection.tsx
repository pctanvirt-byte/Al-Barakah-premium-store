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
  onOpenProductModal,
}) => {
  const [addedItems, setAddedItems] = useState<{ [id: string]: boolean }>({});

  if (!config.enabled) return null;

  // Resolve items from config.items or fallback to default
  const itemsToRender: TopSellingItem[] = 
    config.items && config.items.length > 0
      ? config.items
      : DEFAULT_TOP_SELLING_CONFIG.items;

  if (itemsToRender.length === 0) return null;

  // Helper to convert a TopSellingItem to a full Product object
  const resolveProduct = (item: TopSellingItem): Product => {
    if (item.productId) {
      const foundInProps = products.find((p) => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
      if (foundInProps) {
        return {
          ...foundInProps,
          name: item.name || foundInProps.name,
          price: item.price || foundInProps.price,
          originalPrice: item.originalPrice ?? foundInProps.originalPrice,
          image: item.image || foundInProps.image,
        };
      }
      const foundInInitial = INITIAL_PRODUCTS.find((p) => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
      if (foundInInitial) {
        return {
          ...foundInInitial,
          name: item.name || foundInInitial.name,
          price: item.price || foundInInitial.price,
          originalPrice: item.originalPrice ?? foundInInitial.originalPrice,
          image: item.image || foundInInitial.image,
        };
      }
    }

    // Synthetic product fallback
    return {
      id: item.productId || item.id,
      name: item.name,
      category: 'Top Selling',
      price: item.price,
      originalPrice: item.originalPrice,
      rating: 5.0,
      reviewCount: 240,
      image: item.image,
      images: [item.image],
      description: `${item.name} - ১০০% খাঁটি প্রিমিয়াম কোয়ালিটি পণ্য।`,
      features: ['১০০% খাঁটি ও প্রিমিয়াম গ্রেড', 'অরিজিনাল কোয়ালিটি নিশ্চিত', 'ক্যাশ অন ডেলিভারি সুবিধা'],
      inStock: true,
      stockCount: 50,
      badge: 'BESTSELLER',
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

  const handleCompareClick = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(prod);
    }
  };

  return (
    <section 
      id="top-selling-section"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
    >
      {/* Centered Heading with Clean Font matching Ghorer Bazar */}
      <div className="text-center mb-4 sm:mb-7">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#113149] tracking-tight font-sans">
          {config.title || 'Top Selling Products'}
        </h2>
      </div>

      {/* 2-Column Grid on Mobile, Tab, and PC (2 products per line) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-5 md:gap-6">
        {itemsToRender.map((item) => {
          const resolvedProduct = resolveProduct(item);
          const currentPrice = Number(item.price || resolvedProduct.price || 0);
          const origPrice = Number(item.originalPrice ?? resolvedProduct.originalPrice ?? 0);
          const discountAmount = origPrice > currentPrice ? origPrice - currentPrice : 0;
          const badgeText = item.badge || resolvedProduct.badge || '';
          const isAdded = Boolean(addedItems[item.id]);
          const isCompared = compareProducts.some((p) => p.id === resolvedProduct.id);

          return (
            <div
              key={item.id}
              onClick={() => onOpenProductModal(resolvedProduct)}
              className="group bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between relative cursor-pointer"
            >
              <div>
                {/* Product Image Container with subtle Glass-morphism hover effect */}
                <div className="w-full h-36 sm:h-52 md:h-60 lg:h-64 flex items-center justify-center p-1 sm:p-3 bg-white rounded-lg sm:rounded-xl relative overflow-hidden transition-all duration-300">
                  {/* Badge */}
                  {badgeText && (
                    <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-white bg-[#ef4444] shadow-2xs">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
                        <span>{badgeText}</span>
                      </span>
                    </div>
                  )}

                  {/* Top Right: Compare Button */}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={(e) => handleCompareClick(e, resolvedProduct)}
                      className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isCompared
                          ? 'bg-[#f38018] text-white shadow-xs'
                          : 'bg-stone-100/90 hover:bg-stone-200 text-stone-600 hover:text-[#f38018]'
                      }`}
                      title={isCompared ? 'In Comparison (তুলনা থেকে সরান)' : 'Compare Product (পণ্য তুলনা করুন)'}
                      aria-label="Toggle compare"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.4]" />
                    </button>
                  )}

                  <img
                    src={item.image || resolvedProduct.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Subtle Glass-morphism backdrop-filter overlay on hover */}
                  <div className="absolute inset-0 bg-stone-900/[0.03] backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none rounded-lg sm:rounded-xl" />
                </div>

                {/* Product Info */}
                <div className="mt-2 sm:mt-2.5 text-left">
                  {/* Product Title */}
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#f38018] transition-colors min-h-[2rem] sm:min-h-[2.4rem]">
                    {item.name}
                  </h3>

                  {/* Price & Strikeout */}
                  <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 font-bengali flex-wrap">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-[#f38018] tracking-tight select-none">
                      ৳{currentPrice.toLocaleString()}
                    </span>
                    {origPrice > currentPrice && (
                      <span className="text-xs sm:text-sm text-stone-400 line-through select-none">
                        ৳{origPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Auto-Discount Save Badge (Shows ONLY when discountAmount > 0) */}
                  {discountAmount > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold text-[#15803d] bg-[#dcfce7] font-bengali">
                        Save ৳{discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add To Cart Button (Full-width outline orange button matching Ghorer Bazar) */}
              <div className="mt-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleAdd(e, resolvedProduct, item.id)}
                  className={`w-full py-1.5 sm:py-2 px-2 rounded-lg border font-bold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 shadow-2xs active:scale-[0.98] cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-[#f38018] text-[#f38018] hover:bg-[#f38018] hover:text-white bg-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Add To Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};


