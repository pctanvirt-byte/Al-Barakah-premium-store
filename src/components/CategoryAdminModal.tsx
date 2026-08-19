import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Power, 
  Sparkles, 
  Image as ImageIcon,
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CategoryItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';

interface CategoryAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

export const CategoryAdminModal: React.FC<CategoryAdminModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatBadge, setNewCatBadge] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  // Toggle single category ON/OFF
  const handleToggle = (id: string) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    );
    onUpdateCategories(updated);
  };

  // Toggle ALL ON or ALL OFF
  const handleToggleAll = (status: boolean) => {
    const updated = categories.map((cat) => ({ ...cat, enabled: status }));
    onUpdateCategories(updated);
  };

  // Reorder Category (Move Up / Down)
  const handleReorder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onUpdateCategories(reordered);
  };

  // Reset to initial 9 categories
  const handleResetToDefault = () => {
    if (window.confirm('Reset categories to default 9 items?')) {
      onUpdateCategories(INITIAL_CATEGORIES);
    }
  };

  // Add new category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
      image: newCatImage.trim() || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      badge: newCatBadge.trim() || undefined,
      enabled: true,
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatImage('');
    setNewCatBadge('');
    setShowAddForm(false);
  };

  // Delete category
  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to remove this category?')) {
      onUpdateCategories(categories.filter((c) => c.id !== id));
    }
  };

  const enabledCount = categories.filter((c) => c.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF6A00] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif flex items-center gap-2">
                <span>Category Management (Admin Panel)</span>
              </h2>
              <p className="text-xs text-stone-300">
                Turn categories ON or OFF to control what appears in the slider & store catalog.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              {enabledCount} Active
            </span>
            <span className="text-stone-400">/</span>
            <span>{categories.length} Total Categories</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleAll(true)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Turn All ON
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Turn All OFF
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
              title="Reset to 9 default categories"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-stone-100 space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`pt-3 first:pt-0 flex items-center justify-between gap-4 p-3 rounded-xl transition-all ${
                cat.enabled ? 'bg-white border border-stone-200/80 shadow-2xs' : 'bg-stone-50/70 border border-dashed border-stone-200 opacity-60'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-stone-400 w-5">#{index + 1}</span>
                
                {/* Thumbnail Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-stone-900 truncate">{cat.name}</h4>
                    {cat.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-[#FF6A00] text-white text-[9px] font-bold uppercase">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">/{cat.slug}</span>
                </div>
              </div>

              {/* Right Controls: Reorder + Status Switch + Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleReorder(index, 'up')}
                    className={`p-1 rounded text-stone-600 transition-colors ${
                      index === 0
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer bg-white shadow-2xs'
                    }`}
                    title="Move Up (আগে নিন)"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === categories.length - 1}
                    onClick={() => handleReorder(index, 'down')}
                    className={`p-1 rounded text-stone-600 transition-colors ${
                      index === categories.length - 1
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer bg-white shadow-2xs'
                    }`}
                    title="Move Down (পিছে নিন)"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Switch (ON / OFF) */}
                <button
                  onClick={() => handleToggle(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    cat.enabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                  id={`admin-cat-toggle-${cat.id}`}
                >
                  {cat.enabled ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>ON (Active)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>OFF (Hidden)</span>
                    </>
                  )}
                </button>

                {/* Delete button (if user created extra) */}
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Category Trigger / Form */}
          {showAddForm ? (
            <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                  <span>Add New Category</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Silk Scarves"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={newCatBadge}
                    onChange={(e) => setNewCatBadge(e.target.value)}
                    placeholder="e.g. Hot Deal"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF6A00] hover:bg-[#E55F00] rounded-lg shadow-xs cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#FF6A00] text-stone-600 hover:text-[#FF6A00] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Category</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Changes save automatically to your active store session.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Done & Close
          </button>
        </div>

      </div>
    </div>
  );
};
