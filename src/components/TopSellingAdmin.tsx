import React, { useState } from 'react';
import { 
  Flame, 
  Check, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Sparkles, 
  RotateCcw,
  Upload,
  Tag,
  Power,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';
import { TopSellingSectionConfig, TopSellingItem, DEFAULT_TOP_SELLING_CONFIG } from '../types/topSelling';

interface TopSellingAdminProps {
  config?: TopSellingSectionConfig;
  products: Product[];
  onSaveConfig: (newConfig: TopSellingSectionConfig) => void;
}

export const TopSellingAdmin: React.FC<TopSellingAdminProps> = ({
  config = DEFAULT_TOP_SELLING_CONFIG,
  products,
  onSaveConfig,
}) => {
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [title, setTitle] = useState(config.title || 'Top Selling Products');
  const [items, setItems] = useState<TopSellingItem[]>(() => {
    if (config.items && config.items.length > 0) {
      return config.items;
    }
    return DEFAULT_TOP_SELLING_CONFIG.items;
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const handleToggleEnabled = () => {
    setEnabled(!enabled);
  };

  const handleImageFileUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleUpdateItem(index, 'image', e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateItem = (index: number, field: keyof TopSellingItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleSelectProductForCard = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (!selectedProd) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: selectedProd.id,
      name: selectedProd.name,
      price: selectedProd.price,
      originalPrice: selectedProd.originalPrice,
      image: selectedProd.image,
      badge: updated[index].badge || 'Best Selling',
    };
    setItems(updated);
  };

  const handleAddNewItem = () => {
    const newItem: TopSellingItem = {
      id: `top-${Date.now()}`,
      name: 'New Top Selling Product',
      price: 1500,
      originalPrice: 1800,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      badge: 'Best Selling',
    };
    setItems([...items, newItem]);
    setActiveItemIndex(items.length);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (activeItemIndex === index) {
      setActiveItemIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setItems(updated);
    if (activeItemIndex === index) setActiveItemIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setItems(updated);
    if (activeItemIndex === index) setActiveItemIndex(index + 1);
  };

  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি ডিফল্ট ৪টি টপ সেলিং প্রোডাক্ট (সরিষার তেল, ঘড়ি, আতর, আজওয়া খেজুর) রিস্টোর করতে চান?')) {
      setItems(DEFAULT_TOP_SELLING_CONFIG.items);
      setTitle(DEFAULT_TOP_SELLING_CONFIG.title);
    }
  };

  const handleSave = () => {
    const newConfig: TopSellingSectionConfig = {
      enabled,
      title: title.trim() || 'Top Selling Products',
      subtitle: '',
      items: items.map((it, idx) => ({
        ...it,
        id: it.id || `top-${idx + 1}`,
        badge: it.badge || 'Best Selling',
        price: Number(it.price) || 0,
        originalPrice: it.originalPrice ? Number(it.originalPrice) : undefined,
      })),
    };

    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl w-full">
      {/* Top Banner Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#f38018] flex items-center justify-center border border-orange-200/80 shrink-0">
            <Flame className="w-7 h-7 fill-[#f38018]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                Top Selling Products Section Editor
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Editor
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              হোমপেজের ক্যাটাগরি স্লাইডারের নিচে দেখানো ৪টি টপ সেলিং প্রোডাক্ট কার্ড এডিট, নতুন ছবি আপলোড বা পরিবর্তন করুন।
            </p>
          </div>
        </div>

        {/* Global Toggle & Reset */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="ডিফল্ট ৪টি প্রোডাক্ট রিস্টোর করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              enabled
                ? 'bg-[#0a5c36] text-white hover:bg-[#08482a]'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{enabled ? 'সেকশন চালু (ON)' : 'সেকশন বন্ধ (OFF)'}</span>
          </button>
        </div>
      </div>

      {/* Title Settings */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f38018]" />
            সেকশন হেডিং সেটিংস
          </h3>
          <span className="text-xs text-stone-400">
            মোট কার্ড সংখ্যা: <strong className="text-stone-800">{items.length}</strong> টি
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">
            Section Title (ইংরেজি শিরোনাম)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Top Selling Products"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#f38018]"
          />
        </div>
      </div>

      {/* Product Cards List & Direct Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            টপ সেলিং প্রোডাক্ট কার্ডসমূহ ({items.length})
          </h3>

          <button
            type="button"
            onClick={handleAddNewItem}
            className="px-3.5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কার্ড যোগ করুন</span>
          </button>
        </div>

        {/* Cards Grid / List */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const savings = item.originalPrice && item.originalPrice > item.price
              ? item.originalPrice - item.price
              : 0;

            return (
              <div
                key={item.id || index}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 relative transition-all"
              >
                {/* Header of each Card: Index, Name preview, Order Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-100 text-[#f38018] text-xs font-black flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-bold text-stone-900 truncate max-w-md">
                      {item.name || 'Untitled Card'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 shrink-0">
                      {item.badge || 'Best Selling'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Quick Import from Catalog dropdown */}
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-stone-400" />
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectProductForCard(index, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        <option value="" disabled>স্টোর ক্যাটালগ থেকে লোড করুন</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (৳{p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className={`p-1.5 rounded-lg border border-stone-200 ${
                        index === 0 ? 'text-stone-300 bg-stone-50' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                      }`}
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className={`p-1.5 rounded-lg border border-stone-200 ${
                        index === items.length - 1 ? 'text-stone-300 bg-stone-50' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                      }`}
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                      title="কার্ডটি মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form fields for this card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Image Preview & Upload / URL */}
                  <div className="md:col-span-3 space-y-2">
                    <div className="w-full h-32 rounded-xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center overflow-hidden relative group">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-stone-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[11px]">ছবি নেই</span>
                        </div>
                      )}
                    </div>

                    {/* Direct File Upload button */}
                    <div className="space-y-1.5">
                      <label className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#f38018] text-[11px] font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড (Device)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileUpload(index, e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      <input
                        type="text"
                        value={item.image || ''}
                        onChange={(e) => handleUpdateItem(index, 'image', e.target.value)}
                        placeholder="অথবা Image URL লিখুন..."
                        className="w-full px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-800 focus:outline-none focus:border-[#f38018]"
                      />
                    </div>
                  </div>

                  {/* Title & Badge */}
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        প্রোডাক্টের নাম (Title)
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                        placeholder="Deshi Authentic Mustard Oil 5 liter"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#f38018]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        ব্যাজ টেক্সট (Badge)
                      </label>
                      <input
                        type="text"
                        value={item.badge || 'Best Selling'}
                        onChange={(e) => handleUpdateItem(index, 'badge', e.target.value)}
                        placeholder="Best Selling"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#f38018]"
                      />
                    </div>
                  </div>

                  {/* Pricing: Current Price & Original Price */}
                  <div className="md:col-span-4 space-y-3 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/80">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        বিক্রয় মূল্য (Price in ৳)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#f38018]">৳</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(index, 'price', Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#f38018]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">
                        আসল মূল্য (Original Price in ৳)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">৳</span>
                        <input
                          type="number"
                          value={item.originalPrice || ''}
                          onChange={(e) => handleUpdateItem(index, 'originalPrice', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="ডিসকাউন্ট না থাকলে খালি রাখুন"
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#f38018]"
                        />
                      </div>
                    </div>

                    {savings > 0 && (
                      <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md text-center">
                        কাস্টমার সেভ করবে: ৳{savings.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Save Button */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-stone-600">
          পরিবর্তন করার পর নিচে <strong>"Save Changes"</strong> বাটনে ক্লিক করলে তা সরাসরি ডাটাবেসে সেভ হবে।
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {savedSuccess && (
            <div className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#f38018] hover:bg-[#e07010] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes (সংরক্ষণ করুন)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
