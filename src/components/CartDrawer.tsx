import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, Sparkles } from 'lucide-react';
import { CartItem } from '../types';
import { PROMO_CODES } from '../data/products';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedCheckout: (discountPercent: number, appliedCode: string) => void;
  currency: 'USD' | 'BDT';
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  currency,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  // Lock body scroll when cart drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rate = currency === 'BDT' ? 120 : 1;
  const symbol = currency === 'BDT' ? '৳' : '$';

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountPercent = appliedPromo ? (PROMO_CODES[appliedPromo] || 0) : 0;
  const discountAmount = subtotal * discountPercent;
  const freeShippingThreshold = 25;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 1.00;
  const total = subtotal - discountAmount + shipping;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError('');
    } else {
      setPromoError('Invalid coupon code. Try BARAKAH10 or SUNNAH25');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-900" />
            <h2 className="font-bold text-base text-slate-900">Your Cart</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping banner */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">
              {subtotal >= freeShippingThreshold ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Unlocked Free Delivery!
                </span>
              ) : (
                <span>
                  Add <strong>{symbol}{((freeShippingThreshold - subtotal) * rate).toFixed(2)}</strong> more for FREE shipping
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-400 shadow-sm">
                <ShoppingBag className="w-10 h-10 stroke-[1.5] text-stone-500" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 
                  className="font-bold text-xl text-stone-900 font-serif"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                >
                  Your Cart is Empty
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Explore our premium collections and add premium alcohol-free attars or organic foods to your cart.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-98"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}-${idx}`}
                className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
              >
                {/* Thumb */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                  referrerPolicy="no-referrer"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Variant info */}
                  {(item.selectedColor || item.selectedSize) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    </div>
                  )}

                  {/* Price & Quantity stepper */}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-bold text-xs text-slate-900">
                      {symbol}{((item.product.price * item.quantity) * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center rounded border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                        className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-white space-y-4">
            {/* Promo code form */}
            {!appliedPromo ? (
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Coupon (e.g. WELCOME)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full text-xs py-2 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg uppercase placeholder:normal-case focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-rose-500 pl-1">{promoError}</p>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/70 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Promo {appliedPromo} applied ({Math.round(discountPercent * 100)}% off)</span>
                </div>
                <button
                  onClick={removePromo}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Calculations breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {symbol}{(subtotal * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({Math.round(discountPercent * 100)}%)</span>
                  <span>-{symbol}{(discountAmount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `${symbol}${(shipping * rate).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Estimated Total</span>
                <span>{symbol}{(total * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => onProceedCheckout(discountPercent, appliedPromo || '')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0A3828] hover:bg-[#072418] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20 active:scale-98 cursor-pointer"
              id="proceed-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
