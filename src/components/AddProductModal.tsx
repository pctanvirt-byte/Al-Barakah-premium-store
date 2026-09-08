import React, { useState } from 'react';
import { X, PlusCircle, Layers, Upload, Crop, ZoomIn, Check } from 'lucide-react';
import { Product, Category } from '../types';
import { CATEGORIES } from '../data/products';
import { ImageCropZoomModal } from './ImageCropZoomModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  currency: 'USD' | 'BDT';
}

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

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  currency,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<Category>('Organic Foods');
  const [price, setPrice] = useState('49.99');
  const [originalPrice, setOriginalPrice] = useState('69.99');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
    '',
    ''
  ]);
  const [description, setDescription] = useState('High precision premium lifestyle product crafted with high quality durable materials.');
  const [stockCount, setStockCount] = useState('25');
  const [badge, setBadge] = useState<'SALE' | 'HOT' | 'NEW' | 'BESTSELLER' | ''>('NEW');
  const [sizes, setSizes] = useState<string[]>([]);
  const [customVariant, setCustomVariant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Crop / Zoom Modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    slotIndex: number;
    imageSrc: string;
  }>({
    isOpen: false,
    slotIndex: 0,
    imageSrc: ''
  });

  if (!isOpen) return null;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageSlotUpload = (slotIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropModal({
          isOpen: true,
          slotIndex,
          imageSrc: e.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = (croppedDataUrl: string) => {
    const updated = [...images];
    updated[cropModal.slotIndex] = croppedDataUrl;
    setImages(updated);
  };

  const handleApplyQuickAdd = (variants: string[]) => {
    const combined = Array.from(new Set([...sizes, ...variants]));
    setSizes(combined);
  };

  const handleAddCustom = () => {
    if (!customVariant.trim()) return;
    const trimmed = customVariant.trim();
    if (!sizes.includes(trimmed)) {
      setSizes([...sizes, trimmed]);
    }
    setCustomVariant('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const validImages = images.filter(img => Boolean(img && img.trim()));
      const primaryImg = validImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
      const allImages = validImages.length > 0 ? validImages : [primaryImg];
      const finalSlug = slug.trim() || generateSlug(name);

      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        slug: finalSlug,
        category: category === 'All' ? 'Organic Foods' : category,
        price: parseFloat(price) || 29.99,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        rating: 5.0,
        reviewCount: 1,
        image: primaryImg,
        images: allImages,
        description: description.trim(),
        features: ['Premium Build Quality', 'Warranty Covered', 'Authentic Goods'],
        inStock: true,
        stockCount: parseInt(stockCount) || 10,
        badge: badge ? badge : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        tags: [category.toLowerCase(), 'new-arrival']
      };

      await onAddProduct(newProd);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0a5c36] flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">Add New Product to Store</h2>
              <p className="text-[11px] text-slate-500">নতুন প্রোডাক্টের তথ্য ও ছবি যুক্ত করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!slug) setSlug(generateSlug(val));
              }}
              placeholder="e.g. Deshi Authentic Mustard Oil 5 liter"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 font-medium"
            />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 text-[11px]">Auto URL (Slug)</label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">SEO Slug</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-mono text-[11px]">/product/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
              >
                {CATEGORIES.filter(c => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Units</label>
              <input
                type="number"
                min="1"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (BDT ৳)</label>
              <input
                type="number"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Original Price (Optional ৳)</label>
              <input
                type="number"
                step="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Quick Add Size/Weight Variants */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Weight / Size Variants (ঐচ্ছিক)
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                Optional
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 select-none mr-1">Quick Add:</span>
              {QUICK_ADD_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyQuickAdd(preset.variants)}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 rounded-md text-[10px] font-medium transition-all cursor-pointer shadow-2xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Custom size (e.g. 250g)..."
                value={customVariant}
                onChange={(e) => setCustomVariant(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-emerald-800"
              >
                + Add
              </button>
            </div>

            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sizes.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[11px] font-semibold"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => setSizes(sizes.filter((v) => v !== s))}
                      className="text-emerald-700 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3 Images Upload Slots */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">৩টি ছবি আপলোড করুন (3 Images)</label>
              <span className="text-[10px] text-slate-500">মেইন + গ্যালারি</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const img = images[slotIdx] || '';
                return (
                  <div key={slotIdx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 block">
                        {slotIdx === 0 ? 'মেইন ছবি' : `ছবি ${slotIdx + 1}`}
                      </span>
                      {img && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...images];
                            updated[slotIdx] = '';
                            setImages(updated);
                          }}
                          className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                        >
                          রিমুভ
                        </button>
                      )}
                    </div>
                    <div className="relative w-full h-16 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                      {img ? (
                        <>
                          <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => {
                              setCropModal({
                                isOpen: true,
                                slotIndex: slotIdx,
                                imageSrc: img
                              });
                            }}
                            className="absolute inset-0 bg-stone-950/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[10px] font-bold transition-opacity cursor-pointer backdrop-blur-2xs"
                            title="জুম ও ক্রপ করুন"
                          >
                            <Crop className="w-3 h-3 text-emerald-400" />
                            <span>জুম / ক্রপ</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-400">ছবি নেই</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded cursor-pointer transition-colors">
                        <Upload className="w-2.5 h-2.5" />
                        <span>আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageSlotUpload(slotIdx, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {img && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropModal({
                              isOpen: true,
                              slotIndex: slotIdx,
                              imageSrc: img
                            });
                          }}
                          className="p-1 rounded bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 cursor-pointer transition-colors border border-stone-200"
                          title="ছবি জুম ও ক্রপ করুন"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Promotional Badge</label>
            <div className="flex gap-2">
              {['', 'NEW', 'HOT', 'SALE', 'BESTSELLER'].map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBadge(b as any)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    badge === b
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {b || 'None'}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Sticky Fixed Bottom Footer - 100% Visible on All Screens */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>সরাসরি ফায়ারবেস ডাটাবেজে যুক্ত হবে</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer transition-colors"
            >
              Cancel (বাতিল)
            </button>
            <button
              id="btn-save-product"
              type="submit"
              form="add-product-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'Save Product (প্রোডাক্ট সেভ করুন)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Crop & Zoom Modal */}
      <ImageCropZoomModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        onClose={() => setCropModal({ ...cropModal, isOpen: false })}
        onApply={handleCropApply}
        title="প্রোডাক্ট ছবির পজিশন, জুম ও ক্রপ ঠিক করুন"
      />
    </div>
  );
};
