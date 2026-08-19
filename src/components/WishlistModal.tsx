import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowLeft, Info, LogIn } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  currency: 'USD' | 'BDT';
  onOpenAuth?: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  currency,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const rate = currency === 'BDT' ? 120 : 1;
  const symbol = currency === 'BDT' ? '৳' : '$';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="wishlist-modal-view"
      >
        {/* Top Header Row with Back to Shop */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO SHOP</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title & Subtitle */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className="w-4 h-4 fill-rose-600" />
            </div>
            <h2 
              className="text-xl sm:text-2xl font-bold text-stone-900 font-serif"
              style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
            >
              My Wishlist
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Save your favorite premium items here and add them to cart anytime.
          </p>
        </div>

        {/* Guest Notification Banner (Exact from Screenshot 2026-08-15 151201.png) */}
        {!user && (
          <div className="mx-6 my-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Keep Your Wishlist Forever</h4>
                <p className="text-[11px] text-amber-800/90">
                  You are using as a guest. Register/Login to access your wishlist from any computer or mobile.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="shrink-0 px-4 py-2 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>LOGIN NOW</span>
            </button>
          </div>
        )}

        {/* Items List or Empty State */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto">
                <Heart className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 
                className="font-bold text-lg text-stone-900 font-serif"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                Your Wishlist is Empty
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Explore our premium collections and click the heart icon on any product to save it here.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2.5 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            wishlist.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-stone-200 bg-white shrink-0 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider font-serif">
                      {prod.category}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{prod.name}</h4>
                    <div className="text-xs sm:text-sm font-extrabold text-[#0A3828] mt-0.5">
                      {symbol}{(prod.price * rate).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onAddToCart(prod);
                      onRemoveFromWishlist(prod);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0A3828] hover:bg-[#072418] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(prod)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
