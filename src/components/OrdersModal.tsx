import React, { useState } from 'react';
import { 
  X, 
  Search, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Check
} from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currency: 'USD' | 'BDT';
  initialTrackingId?: string;
  onOpenAuth?: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  initialTrackingId = '',
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'TRACK'>('TRACK');
  const [orderIdInput, setOrderIdInput] = useState(initialTrackingId);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  if (!isOpen) return null;

  const rate = 1;
  const symbol = '৳';

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const query = orderIdInput.trim().toUpperCase();

    if (!query) {
      setSearchError('Please enter your Order ID (e.g. AB-123456)');
      return;
    }

    // Try finding order in orders list or localStorage
    const allStoredOrders: Order[] = JSON.parse(localStorage.getItem('albarakah_orders') || '[]');
    const combinedOrders = [...orders, ...allStoredOrders];

    const found = combinedOrders.find((o) => {
      const oid = (o.id || '').toUpperCase();
      const numOnly = oid.replace(/\D/g, '');
      const queryNum = query.replace(/\D/g, '');
      return oid === query || oid.includes(query) || (numOnly && queryNum && numOnly === queryNum);
    });

    setHasSearched(true);
    if (found) {
      setSearchedOrder(found);
      setSearchError('');
    } else {
      setSearchedOrder(null);
      setSearchError(`No order found matching "${orderIdInput}". Please check your Order ID or contact support.`);
    }
  };

  const getStepIndex = (status?: string) => {
    const s = (status || 'Pending').toLowerCase();
    if (s.includes('deliver')) return 3;
    if (s.includes('ship') || s.includes('courier')) return 2;
    if (s.includes('process') || s.includes('confirm')) return 1;
    return 0; // Placed / Pending
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-[480px] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="orders-track-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Tabs: LOGIN / REGISTER | TRACK ORDER (Matching Screenshot 2026-08-15 151115.png) */}
        <div className="flex border-b border-stone-100 px-6 pt-5 bg-white">
          <button
            type="button"
            onClick={() => {
              if (onOpenAuth) {
                onClose();
                onOpenAuth();
              }
            }}
            className="pb-3.5 font-bold text-xs sm:text-[13px] tracking-wider transition-all cursor-pointer mr-6 uppercase text-stone-400 hover:text-stone-700"
          >
            LOGIN / REGISTER
          </button>

          <button
            type="button"
            className="pb-3.5 font-bold text-xs sm:text-[13px] tracking-wider transition-all cursor-pointer flex items-center gap-1.5 uppercase text-[#FF5722] relative"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>TRACK ORDER</span>
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF5722] rounded-full" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          
          {/* Centered Orange Search Icon in Soft Circle (Exact match to screenshot) */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-orange-50/80 border border-orange-100 flex items-center justify-center text-[#FF5722] shadow-2xs">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center">
            <h2 
              className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-serif"
              style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
            >
              Order Tracking
            </h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Enter your unique Order ID to track its real-time processing and delivery status.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrackSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Order ID <span className="text-stone-900">*</span>
              </label>
              <input
                type="text"
                required
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="AB-123456"
                className="w-full px-4 py-3 text-center font-mono font-medium rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-colors uppercase tracking-wider"
              />
            </div>

            {/* Solid Orange Button: 🔍 TRACK ORDER */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>TRACK ORDER</span>
            </button>
          </form>

          {/* Error message */}
          {searchError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Tracked Result Details */}
          {searchedOrder && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 animate-in fade-in">
              {/* Order ID & Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase">Order ID</span>
                  <p className="font-mono font-bold text-sm text-stone-900">{searchedOrder.id}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>{searchedOrder.status || 'Processing'}</span>
                  </span>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div>
                <p className="text-xs font-bold text-stone-800 mb-2">Delivery Timeline</p>
                <div className="grid grid-cols-4 gap-1 text-center">
                  {[
                    { label: 'Placed', icon: Check },
                    { label: 'Confirmed', icon: Clock },
                    { label: 'Shipped', icon: Truck },
                    { label: 'Delivered', icon: CheckCircle2 }
                  ].map((step, idx) => {
                    const currentIdx = getStepIndex(searchedOrder.status);
                    const isDone = idx <= currentIdx;
                    const Icon = step.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                          isDone 
                            ? 'bg-[#0A3828] text-white shadow-xs' 
                            : 'bg-stone-200 text-stone-400'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] ${isDone ? 'font-bold text-stone-900' : 'text-stone-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <p className="text-xs font-bold text-stone-800">Items in Order</p>
                {searchedOrder.items?.map((it: any, idx: number) => {
                  const itName = it.product?.name || it.productNameSnapshot || 'Product Item';
                  const itImg = it.product?.image || it.product?.imageUrl || it.productImageSnapshot || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                  const itPrice = it.product?.price || it.unitPriceSnapshot || it.price || 0;
                  const itQty = it.quantity || 1;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs text-stone-700 bg-white p-2 rounded-xl border border-stone-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={itImg} alt={itName} className="w-9 h-9 rounded-lg object-cover border border-stone-100 shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{itName}</p>
                          <p className="text-[11px] text-stone-400">Qty: {itQty}</p>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 shrink-0">
                        {symbol}{(itPrice * itQty * rate).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shipping & Payment summary */}
              <div className="pt-2 border-t border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Recipient:</span>
                  <span className="font-semibold text-stone-900">{searchedOrder.customer?.fullName || (searchedOrder as any).shippingAddress?.name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Address:</span>
                  <span className="font-semibold text-stone-900 truncate max-w-[200px]">{searchedOrder.customer?.address || (searchedOrder as any).shippingAddress?.address || 'Dhaka, Bangladesh'}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-950 pt-1 border-t border-stone-200/60">
                  <span>Total Paid/Payable:</span>
                  <span className="text-[#0A3828] text-sm">{symbol}{((searchedOrder.total ?? (searchedOrder as any).totalAmount ?? searchedOrder.subtotal ?? 0) * rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* User's recent orders list if logged in and hasn't searched */}
          {!searchedOrder && orders.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs font-bold text-stone-700 mb-2.5">Your Recent Orders</p>
              <div className="space-y-2">
                {orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setOrderIdInput(ord.id);
                      setSearchedOrder(ord);
                      setSearchError('');
                    }}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-orange-50/50 border border-stone-200/80 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-stone-900">{ord.id}</span>
                      <span className="text-[11px] text-stone-500 block">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length || 1} items
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#FF5722]">
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
