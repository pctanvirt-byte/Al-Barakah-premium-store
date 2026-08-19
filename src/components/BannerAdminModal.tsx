import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon, 
  Sparkles, 
  Tag, 
  Check, 
  Layers, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { HeroBannerConfig, HeroSlide, PromoCard, CategoryItem, Product } from '../types';
import { DEFAULT_HERO_CONFIG } from './HeroBanner';

interface BannerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HeroBannerConfig;
  onSaveConfig: (newConfig: HeroBannerConfig) => void;
  categories: CategoryItem[];
  products: Product[];
}

export const BannerAdminModal: React.FC<BannerAdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  categories,
  products,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'SLIDES' | 'PROMO'>('SLIDES');
  const [slides, setSlides] = useState<HeroSlide[]>(config?.slides || DEFAULT_HERO_CONFIG.slides);
  const [promoCard, setPromoCard] = useState<PromoCard>(config?.promoCard || DEFAULT_HERO_CONFIG.promoCard);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide_${Date.now()}`,
      badge: 'নতুন অফার',
      title: 'নতুন ধামাকা অফার ব্যানার',
      subtitle: 'প্রিমিয়াম কোয়ালিটি নিশ্চিত ডেলিভারি',
      ctaText: 'অর্ডার করুন',
      targetType: 'category',
      targetValue: categories[0]?.name || 'Organic Foods',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1400&auto=format&fit=crop&q=85',
      enabled: true,
    };
    setSlides([newSlide, ...slides]);
  };

  const handleUpdateSlide = (id: string, updates: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert('You must have at least one hero slide.');
      return;
    }
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    const newConfig: HeroBannerConfig = {
      slides,
      promoCard,
    };
    onSaveConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all banners to default Ghorer Bazar style banners?')) {
      setSlides(DEFAULT_HERO_CONFIG.slides);
      setPromoCard(DEFAULT_HERO_CONFIG.promoCard);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Hero & Promo Banners Manager</h2>
              <p className="text-xs text-stone-500">Customize main slider carousel and right promo cards</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset to original template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-white px-6">
          <button
            onClick={() => setActiveSubTab('SLIDES')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSubTab === 'SLIDES'
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Main Slider Carousel ({slides.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PROMO')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSubTab === 'PROMO'
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Right Promo Banner Card</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50">
          
          {/* TAB 1: MAIN SLIDER CAROUSEL */}
          {activeSubTab === 'SLIDES' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Carousel Slides</h3>
                  <p className="text-xs text-stone-500">Each slide can link to a specific category or single product.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-3.5 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </button>
              </div>

              {/* Slide List */}
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 transition-all hover:border-stone-300"
                  >
                    {/* Top Row: Index, Status, Delete */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-stone-800">Slide ID: {slide.id}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-600">
                          <input
                            type="checkbox"
                            checked={slide.enabled}
                            onChange={(e) => handleUpdateSlide(slide.id, { enabled: e.target.checked })}
                            className="rounded text-[#FF6A00] focus:ring-[#FF6A00]"
                          />
                          <span>Enabled</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left side: Image & Preview */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Banner Image URL
                          </label>
                          <div className="relative">
                            <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="url"
                              value={slide.image}
                              onChange={(e) => handleUpdateSlide(slide.id, { image: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full py-2 pl-9 pr-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Image Preview */}
                        <div className="relative h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                            <span className="text-[11px] text-white font-medium truncate">{slide.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Texts & Click Target */}
                      <div className="space-y-3">
                        {/* Title */}
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Headline / Offer Title
                          </label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                            placeholder="e.g. প্রতি কেজি সুক্কারি খেজুরে ২০০ টাকা ছাড়!"
                            className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none font-medium"
                          />
                        </div>

                        {/* Subtitle & Badge */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              Badge Tag
                            </label>
                            <input
                              type="text"
                              value={slide.badge}
                              onChange={(e) => handleUpdateSlide(slide.id, { badge: e.target.value })}
                              placeholder="স্পেশাল ছাড়"
                              className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={slide.ctaText}
                              onChange={(e) => handleUpdateSlide(slide.id, { ctaText: e.target.value })}
                              placeholder="অর্ডার করুন"
                              className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Subtitle */}
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Subtitle / Description
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle || ''}
                            onChange={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })}
                            placeholder="সরাসরি মদিনা থেকে আমদানিকৃত প্রিমিয়াম গ্রেড খেজুর"
                            className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                          />
                        </div>

                        {/* Click Target Navigation */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              When Clicked, Go To:
                            </label>
                            <select
                              value={slide.targetType}
                              onChange={(e) => handleUpdateSlide(slide.id, { targetType: e.target.value as any })}
                              className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none font-medium"
                            >
                              <option value="category">Category Page</option>
                              <option value="product">Specific Product</option>
                              <option value="all">All Products</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              Select Target Value:
                            </label>
                            {slide.targetType === 'category' ? (
                              <select
                                value={slide.targetValue}
                                onChange={(e) => handleUpdateSlide(slide.id, { targetValue: e.target.value })}
                                className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            ) : slide.targetType === 'product' ? (
                              <select
                                value={slide.targetValue}
                                onChange={(e) => handleUpdateSlide(slide.id, { targetValue: e.target.value })}
                                className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name.substring(0, 30)}...</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                disabled
                                value="Catalog (All Items)"
                                className="w-full py-2 px-2 text-xs bg-stone-100 text-stone-500 border border-stone-200 rounded-xl"
                              />
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

          {/* TAB 2: RIGHT PROMO BANNER */}
          {activeSubTab === 'PROMO' && (
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Right Side Promo Card</h3>
                  <p className="text-xs text-stone-500">Highlighted special discount offer on the right side</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-600">
                  <input
                    type="checkbox"
                    checked={promoCard.enabled}
                    onChange={(e) => setPromoCard((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded text-[#FF6A00] focus:ring-[#FF6A00]"
                  />
                  <span>Display Promo Card</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Promo Image */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Promo Image URL
                    </label>
                    <input
                      type="url"
                      value={promoCard.image}
                      onChange={(e) => setPromoCard((prev) => ({ ...prev, image: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                    />
                  </div>

                  <div className="relative h-44 rounded-xl overflow-hidden border border-stone-200 bg-[#FFF7ED]">
                    <img
                      src={promoCard.image}
                      alt={promoCard.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-between p-3 text-white">
                      <span className="self-start px-2 py-0.5 rounded-full bg-[#FF6A00] text-[10px] font-bold">
                        {promoCard.badge || 'PROMO'}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold">{promoCard.title}</h4>
                        <p className="text-[11px] text-stone-200">{promoCard.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Promo Title
                    </label>
                    <input
                      type="text"
                      value={promoCard.title}
                      onChange={(e) => setPromoCard((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. এখন হানি নাটসে ১০% ছাড়!"
                      className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={promoCard.badge || ''}
                        onChange={(e) => setPromoCard((prev) => ({ ...prev, badge: e.target.value }))}
                        placeholder="১০% ছাড়"
                        className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Action Text
                      </label>
                      <input
                        type="text"
                        value={promoCard.ctaText || ''}
                        onChange={(e) => setPromoCard((prev) => ({ ...prev, ctaText: e.target.value }))}
                        placeholder="অর্ডার করুন"
                        className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={promoCard.subtitle || ''}
                      onChange={(e) => setPromoCard((prev) => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="কাঠবাদাম, কাজুবাদাম, পেস্তা ও মধুর পুষ্টিকর ব্লেন্ড"
                      className="w-full py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Click Action:
                      </label>
                      <select
                        value={promoCard.targetType}
                        onChange={(e) => setPromoCard((prev) => ({ ...prev, targetType: e.target.value as any }))}
                        className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none font-medium"
                      >
                        <option value="category">Category Page</option>
                        <option value="product">Specific Product</option>
                        <option value="all">All Products</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Target Page:
                      </label>
                      {promoCard.targetType === 'category' ? (
                        <select
                          value={promoCard.targetValue}
                          onChange={(e) => setPromoCard((prev) => ({ ...prev, targetValue: e.target.value }))}
                          className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      ) : promoCard.targetType === 'product' ? (
                        <select
                          value={promoCard.targetValue}
                          onChange={(e) => setPromoCard((prev) => ({ ...prev, targetValue: e.target.value }))}
                          className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#FF6A00] focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name.substring(0, 30)}...</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value="Catalog (All Items)"
                          className="w-full py-2 px-2 text-xs bg-stone-100 text-stone-500 border border-stone-200 rounded-xl"
                        />
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#0A3828] hover:bg-[#07271c] text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Apply Live</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
