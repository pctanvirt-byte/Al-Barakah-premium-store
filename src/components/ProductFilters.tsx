import React from 'react';
import { SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';
import { FilterState, Category, CategoryItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { TakaIcon } from './TakaIcon';

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalResults: number;
  currency: 'USD' | 'BDT';
  categories?: CategoryItem[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
  currency,
  categories = INITIAL_CATEGORIES,
}) => {
  const rate = 1;
  const symbol = '৳';

  // Filter only enabled categories
  const activeCategories = categories.filter((c) => c.enabled);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          <span>Filters ({totalResults})</span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Active Category Display (Selected from top Ghorer Bazar bar) */}
      {filters.category !== 'All' && (
        <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            <span>Active Category</span>
            <button
              type="button"
              onClick={() => onFilterChange({ category: 'All' })}
              className="text-[10px] text-emerald-700 hover:text-rose-600 font-bold cursor-pointer underline"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
            <span className="text-xs font-bold text-emerald-950 truncate">{filters.category}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Selected
            </span>
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Max Price
          </label>
          <span className="text-xs font-bold text-[#f38018] font-sans inline-flex items-center gap-0.5">
            <TakaIcon className="text-xs text-[#f38018]" />
            {filters.maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={10000}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#f38018]"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-sans">
          <span className="inline-flex items-center gap-0.5"><TakaIcon className="text-[9px]" />100</span>
          <span className="inline-flex items-center gap-0.5"><TakaIcon className="text-[9px]" />10,000</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Customer Rating
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 4, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => onFilterChange({ minRating: rating })}
              className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                filters.minRating === rating
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {rating === 0 ? 'All' : `${rating}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filters.onSaleOnly}
            onChange={(e) => onFilterChange({ onSaleOnly: e.target.checked })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <span className="font-medium">On Sale Only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <span className="font-medium">In Stock Only</span>
        </label>
      </div>

      {/* Quick Promotion banner */}
      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
        <div className="flex items-center gap-1 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Need Custom Database?</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-snug">
          New products added here update state instantly and can be synced with Cloud Firestore database anytime.
        </p>
      </div>
    </div>
  );
};
