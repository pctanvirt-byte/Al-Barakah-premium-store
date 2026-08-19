import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Package, 
  Heart, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Phone, 
  Mail, 
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Order, Product } from '../types';
import { fetchApi } from '../api/client';

export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  isDefault: boolean;
}

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  wishlist: Product[];
  onRemoveFromWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  currency?: 'USD' | 'BDT';
  onOpenOrderTrack?: (trackingCode: string) => void;
}

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  currency = 'BDT',
  onOpenOrderTrack
}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const userEmailLower = user?.email?.toLowerCase().trim() || profile?.email?.toLowerCase().trim();
  const isSuperAdmin = userEmailLower === 'pctanvirt@gmail.com' || userEmailLower === 'albarakahpremium10@gmail.com' || isAdmin || profile?.role === 'admin' || profile?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ORDERS' | 'ADDRESSES' | 'WISHLIST'>('PROFILE');
  
  // User profile state
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    try {
      const saved = localStorage.getItem('albarakah_user_addresses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'addr_1',
        name: profile?.name || user?.displayName || 'My Home',
        phone: '01700000000',
        address: 'House #12, Road #4, Dhanmondi',
        district: 'Dhaka',
        isDefault: true,
      }
    ];
  });

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    district: 'Dhaka',
    isDefault: false,
  });

  useEffect(() => {
    if (profile?.name || user?.displayName) {
      setName(profile?.name || user?.displayName || '');
    }
  }, [profile, user]);

  useEffect(() => {
    try {
      localStorage.setItem('albarakah_user_addresses', JSON.stringify(addresses));
    } catch (e) {}
  }, [addresses]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const stored = localStorage.getItem('albarakah_customer_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = name;
        parsed.phone = phone;
        localStorage.setItem('albarakah_customer_user', JSON.stringify(parsed));
      }
      setProfileSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.address || !addressForm.phone) return;

    if (editingAddressId) {
      setAddresses(prev => prev.map(addr => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            ...addressForm,
          };
        }
        return addressForm.isDefault ? { ...addr, isDefault: false } : addr;
      }));
      setEditingAddressId(null);
    } else {
      const newAddr: UserAddress = {
        id: `addr_${Date.now()}`,
        ...addressForm,
      };
      if (newAddr.isDefault || addresses.length === 0) {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })).concat(newAddr));
      } else {
        setAddresses(prev => [...prev, newAddr]);
      }
    }

    setAddressForm({ name: '', phone: '', address: '', district: 'Dhaka', isDefault: false });
    setIsAddingAddress(false);
  };

  const handleEditAddress = (addr: UserAddress) => {
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      district: addr.district,
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id,
    })));
  };

  // User's orders
  const userEmail = (user?.email || profile?.email || '').toLowerCase();
  const userOrders = orders.filter(o => 
    (o.customerEmail && o.customerEmail.toLowerCase() === userEmail) ||
    (o.customer?.email && o.customer.email.toLowerCase() === userEmail)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="customer-dashboard-modal"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : (user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 leading-tight">
                  {profile?.name || user?.displayName || 'Customer Dashboard'}
                </h2>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {user?.email || profile?.email || 'customer@albarakah.store'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Fully Clean & White Responsive) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-white overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('PROFILE'); setIsAddingAddress(false); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'border-[#0A3828] text-[#0A3828]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => { setActiveTab('ORDERS'); setIsAddingAddress(false); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'border-[#0A3828] text-[#0A3828]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({userOrders.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('ADDRESSES'); setIsAddingAddress(false); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ADDRESSES'
                ? 'border-[#0A3828] text-[#0A3828]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('WISHLIST'); setIsAddingAddress(false); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'WISHLIST'
                ? 'border-[#0A3828] text-[#0A3828]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div className="max-w-xl mx-auto space-y-6">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
                  Personal Information
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#0A3828] focus:ring-1 focus:ring-[#0A3828]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || profile?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-xs text-stone-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Account email is verified and cannot be changed.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-[#0A3828] focus:ring-1 focus:ring-[#0A3828]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-[#0A3828] hover:bg-[#072418] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { signOut(); onClose(); }}
                    className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-12 bg-white border border-stone-200 rounded-2xl p-8">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-stone-800">No orders placed yet</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    When you purchase items from Al Barakah, all tracking updates and receipts will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => {
                    const trackingId = order.trackingCode || order.id;
                    const status = order.orderStatus || order.status || 'PENDING';
                    const amount = order.totalAmount || order.total || 0;
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent';

                    return (
                      <div 
                        key={order.id}
                        className="bg-white border border-stone-200 rounded-2xl p-4.5 hover:border-emerald-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-stone-900">
                              Order #{trackingId}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'DELIVERED' || status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <span>Placed on: {date}</span>
                            <span>Total: <strong className="text-stone-900">৳{amount.toLocaleString()}</strong></span>
                            <span>Items: {order.items?.length || 1}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenOrderTrack && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenOrderTrack(trackingId);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Live Track</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES (Address Book Editor) */}
          {activeTab === 'ADDRESSES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Delivery Addresses</h3>
                  <p className="text-xs text-stone-500">Manage your shipping destinations for fast checkout</p>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => {
                      setAddressForm({
                        name: profile?.name || user?.displayName || '',
                        phone: '',
                        address: '',
                        district: 'Dhaka',
                        isDefault: addresses.length === 0,
                      });
                      setEditingAddressId(null);
                      setIsAddingAddress(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0A3828] hover:bg-[#072418] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleSaveAddress} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Recipient Name / Label
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        placeholder="e.g. Home, Office, Tanvir"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0A3828]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0A3828]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Detailed Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.address}
                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        placeholder="House/Holding no, Road no, Area"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0A3828]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        City / District
                      </label>
                      <select
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:border-[#0A3828]"
                      >
                        <option value="Dhaka">Dhaka (Inside City)</option>
                        <option value="Chattogram">Chattogram</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Rajshahi">Rajshahi</option>
                        <option value="Khulna">Khulna</option>
                        <option value="Barishal">Barishal</option>
                        <option value="Rangpur">Rangpur</option>
                        <option value="Mymensingh">Mymensingh</option>
                        <option value="Other">Other District</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-stone-300 text-[#0A3828] focus:ring-[#0A3828]"
                    />
                    <span>Set as primary default shipping address</span>
                  </label>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0A3828] hover:bg-[#072418] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className={`bg-white border rounded-2xl p-4.5 transition-all relative ${
                        addr.isDefault ? 'border-emerald-500 shadow-xs' : 'border-stone-200'
                      }`}
                    >
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      )}

                      <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{addr.name}</span>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                        {addr.address}, {addr.district}
                      </p>
                      
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-1.5">
                        <Phone className="w-3 h-3" />
                        <span>{addr.phone}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100 text-xs">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                          >
                            Set as default
                          </button>
                        )}

                        {addresses.length > 1 && (
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-rose-500 hover:text-rose-700 font-semibold ml-auto flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'WISHLIST' && (
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-12 bg-white border border-stone-200 rounded-2xl p-8">
                  <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-stone-800">Your wishlist is empty</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Tap the heart icon on any product to save it here for later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wishlist.map((prod) => (
                    <div 
                      key={prod.id}
                      className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={prod.image} 
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {prod.name}
                          </h4>
                          <div className="text-xs font-bold text-[#0A3828] mt-0.5">
                            {currency === 'BDT' ? `৳${prod.price.toLocaleString()}` : `$${prod.price.toFixed(2)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onAddToCart && (
                          <button
                            onClick={() => onAddToCart(prod)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-[#0A3828] hover:text-white transition-colors cursor-pointer"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        )}
                        {onRemoveFromWishlist && (
                          <button
                            onClick={() => onRemoveFromWishlist(prod.id)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Al Barakah Verified Secure Customer Portal</span>
          </div>
          <span>Logged in as <strong>{user?.email || profile?.email}</strong></span>
        </div>
      </div>
    </div>
  );
};
