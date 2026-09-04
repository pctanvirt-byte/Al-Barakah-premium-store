import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  PhoneCall, 
  Star, 
  Clock, 
  Sparkles, 
  Flame, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  MessageCircle, 
  Package, 
  RotateCcw, 
  Award, 
  ThumbsUp, 
  ExternalLink,
  ChevronLeft,
  ShoppingBag,
  HelpCircle,
  X,
  Share2,
  Check,
  Copy
} from 'lucide-react';
import { Product, Order, DeliveryConfig, DEFAULT_DELIVERY_CONFIG, LandingPageVariant, BKashPaymentConfig, DEFAULT_BKASH_CONFIG } from '../types';
import { AlBarakahLogo } from './AlBarakahLogo';
import { getCalculatedPrice } from '../utils/pricing';

interface ProductLandingPageProps {
  product: Product;
  onClose: () => void;
  onPlaceOrder: (order: Partial<Order>) => Promise<Order | void> | void;
  deliveryConfig?: DeliveryConfig;
  bkashConfig?: BKashPaymentConfig;
  onOpenCheckout?: (prod: Product, qty: number, variant?: LandingPageVariant) => void;
  onOpenStore?: () => void;
}

export const ProductLandingPage: React.FC<ProductLandingPageProps> = ({
  product,
  onClose,
  onPlaceOrder,
  deliveryConfig = DEFAULT_DELIVERY_CONFIG,
  bkashConfig = DEFAULT_BKASH_CONFIG,
  onOpenCheckout,
  onOpenStore,
}) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  // Dynamic landing page configuration with robust fallbacks
  const lpConfig = product.landingPage || {};
  const isOilProduct = (product.name || '').includes('তেল') || (product.name || '').toLowerCase().includes('oil');

  // Sanitize any leftover mustard oil copy if this product is not mustard oil
  const sanitizeText = (txt?: string, fallback: string = ''): string => {
    if (!txt) return fallback;
    if (!isOilProduct && (txt.includes('সরিষা') || txt.includes('তেল') || txt.includes('ঘানি') || txt.includes('ঝাঁঝ') || txt.includes('৫ লিটার') || txt.includes('ফ্যামিলি প্যাক'))) {
      return fallback;
    }
    if (txt.includes('৫ লিটার ফ্যামিলি প্যাক')) {
      return fallback;
    }
    return txt;
  };

  const headline = product.name;
  const subheadline = product.description;
  const highlightBadge = '🔥 সীমিত সময়ের স্পেশাল অফার';
  const bannerNote = '🎉 ১০০% আসল ও বিশুদ্ধ প্রিমিয়াম কোয়ালিটি পণ্য • সারা বাংলাদেশে দ্রুত হোম ডেলিভারি!';
  const customerHelpline = (lpConfig.customerHelpline && lpConfig.customerHelpline !== '01712-345678')
    ? lpConfig.customerHelpline
    : '01316534171';
  
  // Construct variants strictly from product.sizes if present
  const parsedVariantsFromSizes: LandingPageVariant[] = (product.sizes && product.sizes.length > 0)
    ? product.sizes.map((s, idx) => {
        const baseVar = product.sizes![0];
        const price = getCalculatedPrice(product.price, baseVar, s);
        const originalPrice = product.originalPrice ? getCalculatedPrice(product.originalPrice, baseVar, s) : undefined;
        return {
          id: `var-size-${idx}`,
          label: s,
          size: s,
          price,
          originalPrice,
          isPopular: idx === 0,
          freeDelivery: false,
        };
      })
    : [];

  const defaultVariants: LandingPageVariant[] = parsedVariantsFromSizes.length > 0
    ? parsedVariantsFromSizes
    : (lpConfig.variants && lpConfig.variants.length > 0 && !(
        !isOilProduct && lpConfig.variants.some(v => v.label?.includes('লিটার') || v.label?.includes('তেল'))
      ))
    ? lpConfig.variants
    : [
        {
          id: 'v-standard',
          label: product.weight || product.name,
          size: product.weight || 'Standard',
          price: product.price,
          originalPrice: product.originalPrice,
          isPopular: true,
          freeDelivery: false,
        }
      ];

  const [selectedVariant, setSelectedVariant] = useState<LandingPageVariant>(
    defaultVariants.find(v => v.isPopular) || defaultVariants[0]
  );

  // Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'ADVANCE_DELIVERY' | 'FULL_BKASH'>('ADVANCE_DELIVERY');
  const [senderBkashNumber, setSenderBkashNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 38, seconds: 45 });
  const [liveViewers] = useState(() => Math.floor(Math.random() * 18) + 32);

  // Active images
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80'];

  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToForm = () => {
    const formElement = formRef.current || document.getElementById('order-form-section');
    const container = document.getElementById('albarakah-sales-landing-page');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (container && typeof formElement.offsetTop === 'number') {
        container.scrollTo({ top: Math.max(0, formElement.offsetTop - 70), behavior: 'smooth' });
      }
      setTimeout(() => {
        const nameInput = formElement.querySelector('input[type="text"]') as HTMLInputElement | null;
        if (nameInput) {
          nameInput.focus();
        }
      }, 350);
    }
  };

  // Calculations
  const unitPrice = selectedVariant.price;
  const subtotal = unitPrice * quantity;
  
  // Delivery Fee calculation: Strict ৳80 inside Dhaka and ৳160 outside Dhaka
  const isFreeDeliveryApplicable = Boolean(
    deliveryConfig.enableFreeDelivery && 
    (deliveryConfig.freeDeliveryThreshold || 0) > 0 && 
    subtotal >= (deliveryConfig.freeDeliveryThreshold || 0)
  );

  const getDeliveryFee = () => {
    if (isFreeDeliveryApplicable) return 0;
    if (deliveryLocation === 'inside_dhaka') return deliveryConfig.insideDhakaCharge ?? 80;
    return deliveryConfig.outsideDhakaCharge ?? 160;
  };

  const deliveryFee = getDeliveryFee();
  const grandTotal = subtotal + deliveryFee;

  const advancePayable = isFreeDeliveryApplicable
    ? 0
    : (paymentMethod === 'FULL_BKASH' ? grandTotal : deliveryFee);

  const dueOnDelivery = isFreeDeliveryApplicable
    ? grandTotal
    : (paymentMethod === 'FULL_BKASH' ? 0 : subtotal);

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?landing=${product.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyBkash = () => {
    const num = bkashConfig.personalNumber || '01316534171';
    navigator.clipboard.writeText(num);
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = deliveryAddress.trim();

    if (!cleanName) {
      setValidationError('দয়া করে আপনার পুরো নাম লিখুন।');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setValidationError('দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      setValidationError('দয়া করে আপনার পূর্ণ ঠিকানা (বাসা নং, রোড, থানা, জেলা) লিখুন।');
      return;
    }

    if (advancePayable > 0) {
      if (!senderBkashNumber.trim() || senderBkashNumber.trim().length < 10) {
        setValidationError('দয়া করে যে বিকাশ নম্বর থেকে ডেলিভারি চার্জ পাঠিয়েছেন তা লিখুন।');
        return;
      }
      if (!bkashTrxId.trim() || bkashTrxId.trim().length < 4) {
        setValidationError('দয়া করে বিকাশের ৮-১০ ডিজিটের ট্রানজেকশন আইডি (TrxID) লিখুন।');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const locationLabel = deliveryLocation === 'inside_dhaka'
        ? 'ঢাকা সিটি (Inside Dhaka)'
        : 'ঢাকার বাইরে (Outside Dhaka)';

      const methodLabel = advancePayable === 0
        ? 'Cash on Delivery (ক্যাশ অন ডেলিভারি)'
        : (paymentMethod === 'ADVANCE_DELIVERY' 
            ? 'Cash on Delivery (bKash Advance Delivery Charge)'
            : 'bKash (Full Payment)');

      const orderPayload: Partial<Order> = {
        id: `ALB-${Date.now().toString().slice(-6)}`,
        customerName: cleanName,
        customerPhone: cleanPhone,
        deliveryAddress: cleanAddress,
        cityDistrict: locationLabel,
        subtotalAmount: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: grandTotal,
        currency: 'BDT',
        paymentMethod: methodLabel,
        paymentStatus: advancePayable > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        paidAmount: advancePayable,
        dueAmount: dueOnDelivery,
        orderStatus: 'PENDING',
        notes: orderNotes.trim() ? `[Landing Page] ${orderNotes.trim()}` : '[Landing Page Direct Order]',
        createdAt: new Date().toISOString(),
        paymentDetails: advancePayable > 0 ? {
          senderNumber: senderBkashNumber.trim(),
          trxId: bkashTrxId.trim().toUpperCase(),
          advancePaid: advancePayable,
          dueOnDelivery: dueOnDelivery,
        } : undefined,
        items: [
          {
            id: `item-${Date.now()}`,
            productId: product.id,
            productNameSnapshot: `${product.name} (${selectedVariant.label})`,
            productImageSnapshot: allImages[0] || product.image,
            unitPriceSnapshot: unitPrice,
            quantity: quantity,
            selectedSize: selectedVariant.size,
            totalPrice: subtotal,
          }
        ],
        customer: {
          fullName: cleanName,
          email: '',
          phone: cleanPhone,
          address: cleanAddress,
          city: locationLabel,
          paymentMethod: methodLabel,
        }
      };

      const res = await onPlaceOrder(orderPayload);
      setOrderSuccess((res as Order) || (orderPayload as Order));
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order submission error:', err);
      setIsSubmitting(false);
      setValidationError('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন বা সরাসরি কল করুন।');
    }
  };

  const keyBenefits = (product.features && product.features.length > 0)
    ? product.features
    : (lpConfig.keyBenefits && lpConfig.keyBenefits.length > 0 && !(
        !isOilProduct && lpConfig.keyBenefits.some(b => b.includes('তেল') || b.includes('ঝাঁঝ') || b.includes('ঘানি'))
      ))
    ? lpConfig.keyBenefits
    : [
        '১০০% আসল ও বিশুদ্ধ প্রিমিয়াম মান',
        'নিরাপদ ও আকর্ষণীয় স্বাস্থ্যসম্মত প্যাকেজিং',
        'সারা বাংলাদেশে দ্রুত ও বিশ্বস্ত হোম ডেলিভারি',
        'বিকাশে সহজ অগ্রিম ডেলিভারি চার্জ পরিশোধ'
      ];

  const trustPoints = lpConfig.trustPoints || [
    'বিকাশে ডেলিভারি চার্জ পরিশোধের পর ক্যাশ অন ডেলিভারিতে বাকি মূল্য',
    'সারা বাংলাদেশে ২-৩ কার্যদিবসে দ্রুত হোম ডেলিভারি',
    'নিরাপদ, ফুড-গ্রেড ও লিক-প্রুফ সুরক্ষিত প্যাকেজিং',
    '২৪/৭ কাস্টমার সাপোর্ট ও সার্বক্ষণিক হেল্পলাইন সেবা'
  ];

  const faqs = lpConfig.faqs || [
    {
      question: 'পণ্য কীভাবে ডেলিভারি পাব এবং টাকা কীভাবে দেব?',
      answer: 'অর্ডারের সময় শুধুমাত্র ডেলিভারি চার্জ বিকাশে অগ্রিম পরিশোধ করবেন। আমাদের ডেলিভারি ম্যান আপনার ঠিকানায় পার্সেল পৌঁছে দিলে পণ্যের মূল দাম ক্যাশ পরিশোধ করে পার্সেল গ্রহণ করবেন।'
    },
    {
      question: 'পণ্য পছন্দ না হলে বা কোনো সমস্যা থাকলে কী করব?',
      answer: 'ডেলিভারি ম্যানের উপস্থিতিতে পণ্য যাচাই করে নিতে পারবেন। কোনো প্রকার ত্রুটি বা অসঙ্গতি থাকলে সাথে সাথে আমাদের হেল্পলাইনে জানালে দ্রুত সমাধান দেওয়া হবে।'
    },
    {
      question: 'কতদিনের মধ্যে ডেলিভারি সম্পন্ন হবে?',
      answer: 'ঢাকার ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে দেশের যেকোনো জেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।'
    }
  ];

  // Clean description parser
  const renderFormattedDescription = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    return (
      <div className="space-y-3 pt-2 text-stone-700 leading-relaxed text-sm sm:text-base">
        {lines.map((line, idx) => {
          const isBullet = line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || line.startsWith('✨') || line.startsWith('⭐') || line.startsWith('✅');
          const cleanLine = isBullet ? line.replace(/^[*•\-\s✨⭐✅]+/, '').trim() : line;
          
          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✦</span>
                <span className="font-medium text-stone-800 text-sm sm:text-base">{cleanLine}</span>
              </div>
            );
          }

          if (line.endsWith(':') || (line.length < 60 && (line.includes('Attar') || line.includes('বৈশিষ্ট্য') || line.includes('উপকারিতা') || line.includes('ব্যবহারবিধি')))) {
            return (
              <h4 key={idx} className="font-bold text-stone-900 text-base sm:text-lg pt-2 text-emerald-950 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
                <span>{line}</span>
              </h4>
            );
          }

          return (
            <p key={idx} className="text-stone-700 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-50 text-stone-900 font-sans pb-24 selection:bg-emerald-500 selection:text-white" id="albarakah-sales-landing-page">
      
      {/* 1. TOP URGENCY ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-900 text-white text-xs sm:text-sm py-2.5 px-4 sticky top-0 z-40 shadow-md border-b border-emerald-800/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <div className="flex items-center gap-2 flex-wrap justify-center font-medium">
            <span className="bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded text-[11px] animate-pulse">
              HOT OFFER
            </span>
            <span>{bannerNote}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold bg-black/40 px-2.5 py-1 rounded-md border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>অফার শেষ হতে বাকি: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
            
            <a 
              href={`tel:${customerHelpline}`}
              className="hidden md:flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>হেল্পলাইন: {customerHelpline}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 py-3 px-4 sticky top-10 sm:top-10 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlBarakahLogo className="h-9 sm:h-11 w-auto" />
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 block leading-none">
                100% Pure & Authentic
              </span>
              <span className="text-xs text-stone-500 font-medium">আল-বারাকাহ প্রিমিয়াম অর্গানিক</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShareLink}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer border border-stone-300"
              title="ফেসবুক অ্যাডের লিংক কপি করুন"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'শেয়ার / অ্যাড লিংক'}</span>
            </button>

            {onOpenStore && (
              <button
                onClick={onOpenStore}
                type="button"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>মেইন শপ দেখুন</span>
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. ORDER SUCCESS OVERLAY SCREEN (IF ORDER PLACED) */}
      {orderSuccess && (
        <div className="max-w-2xl mx-auto my-8 p-6 sm:p-10 bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              অর্ডার সফলভাবে গৃহীত হয়েছে!
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              ধন্যবাদ, {orderSuccess.customerName || customerName}!
            </h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              আপনার অর্ডারটি আমাদের সিস্টেমে সফলভাবে জমা হয়েছে। আমাদের প্রতিনিধি দ্রুত আপনার সাথে ফোনে যোগাযোগ করে ডেলিভারি কনফার্ম করবেন।
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-sans">অর্ডার ট্র্যাকিং আইডি:</span>
              <span className="font-bold text-emerald-700">{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-sans">পণ্য:</span>
              <span className="font-bold text-stone-800">{product.name} ({selectedVariant.label})</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-sans">পরিমাণ:</span>
              <span className="font-bold text-stone-800">{quantity} টি</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-sans">পেমেন্ট মেথড:</span>
              <span className="font-bold text-stone-800">ক্যাশ অন ডেলিভারি</span>
            </div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-1 font-sans">
              <span>সর্বমোট প্রদেয় টাকা:</span>
              <span className="text-emerald-700 font-mono text-lg">৳{(orderSuccess.totalAmount || grandTotal).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`tel:${customerHelpline}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              <span>হেল্পলাইনে কল করুন ({customerHelpline})</span>
            </a>

            <button
              onClick={() => {
                setOrderSuccess(null);
                if (onOpenStore) onOpenStore();
                else onClose();
              }}
              type="button"
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl transition-all"
            >
              আরও কেনাকাটা করুন
            </button>
          </div>
        </div>
      )}

      {!orderSuccess && (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-12 sm:space-y-16">
          
          {/* 4. HERO SECTION */}
          <section className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Media Column (Gallery & Real Photos) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center p-4 group">
                  <img 
                    src={allImages[selectedImgIndex] || allImages[0]} 
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* 100% Authentic Quality Badge */}
                  <div className="absolute top-4 left-4 bg-emerald-800/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>১০০% খাঁটি ও আসল পণ্য</span>
                  </div>

                  {/* Discount percentage tag */}
                  {selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md animate-bounce">
                      {Math.round(((selectedVariant.originalPrice - selectedVariant.price) / selectedVariant.originalPrice) * 100)}% ছাড়
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImgIndex(idx)}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0 cursor-pointer ${
                          selectedImgIndex === idx 
                            ? 'border-emerald-600 ring-2 ring-emerald-500/30' 
                            : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Social Proof Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                    <span>বর্তমানে <strong>{liveViewers} জন</strong> এই পেজটি দেখছেন</span>
                  </div>
                  <span className="text-red-700 font-bold">স্টক সীমিত!</span>
                </div>
              </div>

              {/* Product Headline & Fast CTA */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Special Highlight Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{highlightBadge}</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 leading-tight">
                  {headline}
                </h1>

                {/* Rating & Verified Tag */}
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-stone-800">৫.০ / ৫.০</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    ৪৫০+ ভেরিফায়েড কাস্টমার রিভিউ
                  </span>
                </div>

                {/* Clean, formatted description */}
                <div className="border-t border-b border-stone-100 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                    পণ্য বিবরণী ও বিশেষত্ব
                  </span>
                  {renderFormattedDescription(subheadline || product.description)}
                </div>

                {/* Interactive Package Cards */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    প্যাকেজ সাইজ নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {defaultVariants.map((variant) => {
                      const isSelected = selectedVariant.id === variant.id;
                      return (
                        <div
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          {variant.isPopular && (
                            <span className="absolute -top-2.5 right-2 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              বেস্ট সেলার
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{variant.label}</div>
                            {variant.freeDelivery && (
                              <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                                🚚 ফ্রি ডেলিভারি
                              </span>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-baseline gap-2">
                            <span className="text-lg font-black text-emerald-700">
                              ৳{variant.price.toLocaleString()}
                            </span>
                            {variant.originalPrice && variant.originalPrice > variant.price && (
                              <span className="text-xs text-stone-400 line-through">
                                ৳{variant.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick CTA Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (onOpenCheckout) {
                        onOpenCheckout(product, quantity, selectedVariant);
                      } else {
                        scrollToForm();
                      }
                    }}
                    type="button"
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-emerald-700/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>👉 এখনই অর্ডার করুন</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <a
                    href={`tel:${customerHelpline}`}
                    className="px-5 py-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 border border-stone-300"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-700" />
                    <span>কল করুন</span>
                  </a>
                </div>

                {/* Micro guarantees */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-stone-600 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>বিকাশে অগ্রিম ডেলিভারি চার্জ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>চেক করে বাকি মূল্য পরিশোধ</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* 5. WHY OUR PRODUCT IS 100% PURE & AUTHENTIC */}
          <section className="space-y-8 text-center">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 px-3.5 py-1 rounded-full">
                কেন আল-বারাকাহ প্রিমিয়াম সেরা?
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                {sanitizeText(lpConfig.featuresTitle, `কেন আমাদের ${product.name} অনন্য ও সেরা?`)}
              </h2>
              <p className="text-stone-600 text-sm sm:text-base">
                {sanitizeText(lpConfig.featuresSubtitle, 'আমরা কোনো প্রকার ক্ষতিকর উপাদান বা ভেজাল ছাড়া বিশুদ্ধ প্রিমিয়াম মানের পণ্য সরবরাহ করি।')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs text-left space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
                  🛡️
                </div>
                <h3 className="font-bold text-stone-900 text-lg">১০০% আসল ও খাঁটি পণ্য</h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  সরাসরি বিশ্বস্ত ও খাঁটি উৎস থেকে বাছাইকৃত উপাদান দিয়ে সর্বোচ্চ মান নিশ্চিত করা হয়।
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs text-left space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                  🌿
                </div>
                <h3 className="font-bold text-stone-900 text-lg">সম্পূর্ণ নির্ভেজাল ও নিরাপদ</h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  কোনো ক্ষতিকর রাসায়নিক বা অস্বাস্থ্যকর উপাদান নেই, সম্পূর্ণ স্বাস্থ্যসম্মত ও হালাল।
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs text-left space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl">
                  🚚
                </div>
                <h3 className="font-bold text-stone-900 text-lg">সারা দেশে দ্রুত ডেলিভারি</h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  ঢাকার ভেতরে ও দেশের প্রতিটি জেলায় দ্রুত ও নিরাপদ হোম ডেলিভারি সেবা।
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs text-left space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl">
                  🤝
                </div>
                <h3 className="font-bold text-stone-900 text-lg">যাচাই করে গ্রহণের সুবিধা</h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিশ্চিত হয়ে তবেই বাকি মূল্য পরিশোধের সুযোগ।
                </p>
              </div>

            </div>
          </section>

          {/* 6. KEY BENEFITS BULLETS */}
          <section className="bg-gradient-to-br from-emerald-900 via-stone-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-800/60 px-3.5 py-1 rounded-full border border-emerald-500/30">
                  গুণগত নিশ্চয়তা ও সেবা
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-snug">
                  {sanitizeText(lpConfig.benefitsTitle, `${product.name}-এর বিশেষ বৈশিষ্ট্য ও প্রিমিয়াম গুণাবলী`)}
                </h2>
                <ul className="space-y-3.5 text-stone-200 text-sm sm:text-base">
                  {keyBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-400/40">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center space-y-4">
                <Award className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">১০০% গ্রাহক সন্তুষ্টি গ্যারান্টি</h3>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  আল-বারাকাহ প্রিমিয়ামের প্রতিটি পণ্য অত্যন্ত যত্ন ও স্বাস্থ্যসম্মত পরিবেশে প্যাক করা হয়। আপনার সন্তুষ্টিই আমাদের প্রথম অগ্রাধিকার।
                </p>
                <button
                  onClick={() => {
                    if (onOpenCheckout) {
                      onOpenCheckout(product, quantity, selectedVariant);
                    } else {
                      scrollToForm();
                    }
                  }}
                  type="button"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl transition-all shadow-lg text-sm sm:text-base cursor-pointer"
                >
                  এখনই অর্ডার করুন
                </button>
              </div>
            </div>
          </section>

          {/* 7. AUTHENTICITY & MONEY BACK GUARANTEE */}
          <section className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-stone-900 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-extrabold text-amber-950">
                  {sanitizeText(lpConfig.guaranteeTitle, 'আমাদের ১০০% খাঁটি মান ও সন্তুষ্টির নিশ্চয়তা')}
                </h3>
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                  {sanitizeText(lpConfig.guaranteeText, 'আল-বারাকাহ প্রিমিয়ামে আমরা প্রতিটি গ্রাহকের সন্তুষ্টিকে সর্বোচ্চ প্রাধান্য দিই। পার্সেল হাতে পেয়ে গুণগত মান দেখে নিয়ে তবেই বাকি মূল্য পরিশোধ করবেন। বিন্দুমাত্র অসন্তুষ্টি থাকলে সাথে সাথে আমাদের হেল্পলাইনে কল করে সমাধান নিতে পারবেন।')}
                </p>
              </div>
            </div>
          </section>

          {/* 8. DIRECT CASH ON DELIVERY WITH BKASH ADVANCE CHARGE ORDER FORM */}
          <section ref={formRef} id="order-form-section" className="scroll-mt-24">
            <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-2xl overflow-hidden">
              
              {/* Form Top Title */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-black/30 px-3 py-1 rounded-full">
                  ক্যাশ অন ডেলিভারি (বিকাশে অগ্রিম ডেলিভারি চার্জ)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black">
                  অর্ডার করতে নিচের ফর্মটি পূরণ করুন
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-md mx-auto">
                  আপনার তথ্য ও ডেলিভারি এলাকা নির্বাচন করে অর্ডার সম্পন্ন করুন।
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitOrder} className="p-6 sm:p-10 space-y-6">
                
                {/* Direct Checkout Modal Option */}
                {onOpenCheckout && (
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
                    <div className="text-xs sm:text-sm text-emerald-950 space-y-0.5">
                      <span className="font-extrabold text-sm sm:text-base block text-emerald-900">
                        ⚡ সরাসরি আমাদের ফুল চেকআউটে অর্ডার করুন
                      </span>
                      <span className="text-stone-600">
                        ঢাকার ভেতরে ৳৮০ • ঢাকার বাইরে ৳১৬০ • সম্পূর্ণ নিরাপদ বিকাশ ও ক্যাশ অন ডেলিভারি
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenCheckout(product, quantity, selectedVariant)}
                      className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-extrabold rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>সরাসরি চেকআউট পেজে যান</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Validation error display */}
                {validationError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-700 text-sm font-semibold flex items-center gap-2">
                    <X className="w-5 h-5 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* 1. Package Size Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-stone-800">
                    ১. প্যাকেজ ও সাইজ সিলেক্ট করুন: <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {defaultVariants.map((variant) => {
                      const isSelected = selectedVariant.id === variant.id;
                      return (
                        <label
                          key={variant.id}
                          className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                              : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="selected_package"
                              checked={isSelected}
                              onChange={() => setSelectedVariant(variant)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-bold text-sm">{variant.label}</div>
                              {variant.freeDelivery && (
                                <div className="text-[11px] text-emerald-700 font-semibold">ফ্রি ডেলিভারি</div>
                              )}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-base text-emerald-800">
                            ৳{variant.price}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Customer Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-stone-800">
                    ২. আপনার পুরো নাম: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-base outline-hidden transition-all bg-white"
                  />
                </div>

                {/* 3. Customer Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-stone-800">
                    ৩. মোবাইল নম্বর: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-base font-mono outline-hidden transition-all bg-white"
                  />
                  <span className="text-xs text-stone-500 block">
                    অর্ডার কনফার্মেশনের জন্য আপনার সচল মোবাইল নম্বর লিখুন।
                  </span>
                </div>

                {/* 4. Full Delivery Address */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-stone-800">
                    ৪. সম্পূর্ণ ঠিকানা (বাসার নম্বর, রোড, থানা, জেলা): <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="বাসা নং, রোড নং, এলাকা, থানা ও জেলা লিখুন..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 text-sm outline-hidden transition-all bg-white"
                  />
                </div>

                {/* 5. Delivery Location (Inside vs Outside Dhaka) */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-stone-800">
                    ৫. আপনার ডেলিভারি এলাকা সিলেক্ট করুন:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        deliveryLocation === 'inside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="delivery_loc"
                          checked={deliveryLocation === 'inside_dhaka'}
                          onChange={() => setDeliveryLocation('inside_dhaka')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm">ঢাকার ভেতরে (Inside Dhaka)</span>
                      </div>
                      <span className="font-mono text-sm">
                        {isFreeDeliveryApplicable ? 'ফ্রি' : `৳${deliveryConfig.insideDhakaCharge ?? 80}`}
                      </span>
                    </label>

                    <label
                      className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        deliveryLocation === 'outside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="delivery_loc"
                          checked={deliveryLocation === 'outside_dhaka'}
                          onChange={() => setDeliveryLocation('outside_dhaka')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm">ঢাকার বাইরে (Outside Dhaka)</span>
                      </div>
                      <span className="font-mono text-sm">
                        {isFreeDeliveryApplicable ? 'ফ্রি' : `৳${deliveryConfig.outsideDhakaCharge ?? 160}`}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 6. Quantity Selector */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-sm font-bold text-stone-800">প্যাকেজ সংখ্যা (পরিমাণ):</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 7. bKash Advance Payment Options */}
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-bold text-stone-800">
                    ৭. পেমেন্ট মেথড (শুধুমাত্র বিকাশ):
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'ADVANCE_DELIVERY'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'ADVANCE_DELIVERY'}
                          onChange={() => setPaymentMethod('ADVANCE_DELIVERY')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-bold">ক্যাশ অন ডেলিভারি</div>
                          <div className="text-xs text-stone-500 font-normal">
                            অগ্রিম ডেলিভারি চার্জ বিকাশ (৳{deliveryFee})
                          </div>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'FULL_BKASH'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'FULL_BKASH'}
                          onChange={() => setPaymentMethod('FULL_BKASH')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-bold">সম্পূর্ণ বিকাশ পেমেন্ট</div>
                          <div className="text-xs text-stone-500 font-normal">
                            মোট বিল ৳{grandTotal} বিকাশ করুন
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* bKash Payment Details Box */}
                  {advancePayable > 0 && (
                    <div className="p-4 bg-pink-50/70 rounded-2xl border border-pink-200 space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-pink-600 text-white text-xs font-black flex items-center justify-center">
                            ৳
                          </span>
                          <span className="text-xs font-bold text-pink-900">
                            বিকাশ পার্সোনাল নম্বর (Send Money):
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900 bg-white px-2.5 py-1 rounded-md border border-pink-200 text-sm">
                            {bkashConfig.personalNumber || '01316534171'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyBkash}
                            className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedBkash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedBkash ? 'কপি হয়েছে' : 'কপি'}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-pink-800 leading-relaxed">
                        বিকাশ অ্যাপ থেকে <strong>Send Money</strong> করে প্রদেয় <strong>৳{advancePayable}</strong> পাঠিয়ে নিচের বক্সে আপনার বিকাশ নম্বর ও ট্রানজেকশন আইডি লিখুন:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            প্রেরকের বিকাশ নম্বর: <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={senderBkashNumber}
                            onChange={(e) => setSenderBkashNumber(e.target.value)}
                            placeholder="যে নম্বর থেকে পাঠিয়েছেন"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            বিকাশ ট্রানজেকশন আইডি (TrxID): <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={bkashTrxId}
                            onChange={(e) => setBkashTrxId(e.target.value)}
                            placeholder="যেমন: BL7A8X9K"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Live Order Summary Breakdown */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>পণ্যের মূল্য ({selectedVariant.label} x {quantity}):</span>
                    <span className="font-mono font-bold text-stone-800">৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {deliveryFee === 0 ? 'ফ্রি (FREE)' : `৳${deliveryFee}`}
                    </span>
                  </div>
                  <div className="border-t border-stone-300 pt-2 flex justify-between text-stone-700">
                    <span className="font-bold">বিকাশে প্রদেয় অগ্রিম চার্জ:</span>
                    <span className="font-mono font-bold text-pink-700">৳{advancePayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-black text-stone-900 pt-1 border-t border-dashed border-stone-300">
                    <span>পণ্য হাতে পেয়ে বাকি প্রদেয়:</span>
                    <span className="text-emerald-700 font-mono text-xl">৳{dueOnDelivery.toLocaleString()}</span>
                  </div>
                </div>

                {/* 9. Big Green Pulse Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                      <span>
                        ✅ অর্ডার কনফার্ম করুন {advancePayable > 0 ? `(অগ্রিম বিকাশ: ৳${advancePayable})` : `(৳${grandTotal})`}
                      </span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-stone-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>নিরাপদ বিকাশ লেনদেন ও শতভাগ বিশ্বস্ত ডেলিভারি সেবা।</span>
                </p>

              </form>
            </div>
          </section>

          {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
          <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                সাধারণ প্রশ্নোত্তর
              </span>
              <h2 className="text-2xl font-extrabold text-stone-900">
                গ্রাহকদের সচরাচর করা কিছু প্রশ্ন
              </h2>
            </div>

            <div className="divide-y divide-stone-200 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-4 space-y-1.5 text-left">
                  <h3 className="font-bold text-stone-900 text-base flex items-start gap-2">
                    <span className="text-emerald-700 font-mono">Q.</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </main>
      )}

      {/* 10. STICKY MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 sm:hidden z-40 shadow-2xl flex items-center justify-between gap-3">
        <div className="leading-tight">
          <span className="text-[11px] text-stone-500 block">
            {advancePayable > 0 ? 'অগ্রিম ডেলিভারি চার্জ:' : 'মোট মূল্য:'}
          </span>
          <span className="text-lg font-black text-emerald-700 font-mono">
            ৳{(advancePayable > 0 ? advancePayable : grandTotal).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${customerHelpline}`}
            className="p-3 bg-stone-100 text-stone-800 rounded-xl border border-stone-300 flex items-center justify-center"
            aria-label="Call helpline"
          >
            <PhoneCall className="w-5 h-5 text-emerald-700" />
          </a>

          <button
            onClick={() => {
              if (onOpenCheckout) {
                onOpenCheckout(product, quantity, selectedVariant);
              } else {
                scrollToForm();
              }
            }}
            type="button"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>অর্ডার করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
