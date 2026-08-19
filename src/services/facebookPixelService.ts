import { FacebookPixelConfig, FacebookPixelEventLog, DEFAULT_FACEBOOK_PIXEL_CONFIG } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    facebookPixelLogs?: FacebookPixelEventLog[];
    facebookPixelListeners?: Array<(logs: FacebookPixelEventLog[]) => void>;
  }
}

// In-memory event store for live debugging in admin dashboard
let activeConfig: FacebookPixelConfig = { ...DEFAULT_FACEBOOK_PIXEL_CONFIG };
let pixelInitialized = false;
let currentPixelId = '';
const eventListeners: Set<(logs: FacebookPixelEventLog[]) => void> = new Set();
let eventHistory: FacebookPixelEventLog[] = [];

// Load cached logs from sessionStorage if available
try {
  const cached = sessionStorage.getItem('albarakah_fb_pixel_logs');
  if (cached) {
    eventHistory = JSON.parse(cached);
  }
} catch {
  // ignore
}

const notifyListeners = () => {
  try {
    sessionStorage.setItem('albarakah_fb_pixel_logs', JSON.stringify(eventHistory.slice(0, 30)));
  } catch {
    // ignore
  }
  eventListeners.forEach((fn) => {
    try {
      fn([...eventHistory]);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
};

const addEventLog = (
  eventName: string,
  data: Record<string, any>,
  method: 'Browser Pixel' | 'Conversions API (CAPI)' | 'Both',
  status: 'SUCCESS' | 'WARNING' | 'TEST' = 'SUCCESS'
) => {
  const logItem: FacebookPixelEventLog = {
    id: `px-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName,
    timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    data,
    method,
    status,
  };
  eventHistory = [logItem, ...eventHistory.slice(0, 49)];
  notifyListeners();
};

export const subscribeToPixelLogs = (callback: (logs: FacebookPixelEventLog[]) => void) => {
  eventListeners.add(callback);
  callback([...eventHistory]);
  return () => {
    eventListeners.delete(callback);
  };
};

export const getPixelLogs = (): FacebookPixelEventLog[] => {
  return [...eventHistory];
};

export const clearPixelLogs = () => {
  eventHistory = [];
  try {
    sessionStorage.removeItem('albarakah_fb_pixel_logs');
  } catch {
    // ignore
  }
  notifyListeners();
};

/**
 * Updates or injects the Meta Domain Verification tag in document head
 */
export const updateDomainVerificationMeta = (codeOrTag?: string) => {
  if (typeof document === 'undefined') return;

  const existingMeta = document.querySelector('meta[name="facebook-domain-verification"]');

  if (!codeOrTag || !codeOrTag.trim()) {
    if (existingMeta) {
      existingMeta.remove();
    }
    return;
  }

  // Extract clean code if the user pasted full tag: <meta name="facebook-domain-verification" content="XYZ" />
  let cleanCode = codeOrTag.trim();
  const match = cleanCode.match(/content=["']([^"']+)["']/i);
  if (match && match[1]) {
    cleanCode = match[1];
  } else {
    cleanCode = cleanCode.replace(/[<>"'=]/g, '').trim();
  }

  if (existingMeta) {
    existingMeta.setAttribute('content', cleanCode);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'facebook-domain-verification');
    meta.setAttribute('content', cleanCode);
    document.head.appendChild(meta);
  }
};

/**
 * Initializes the Facebook Pixel script in document head
 */
export const initFacebookPixel = (config: FacebookPixelConfig) => {
  activeConfig = { ...config };

  // Always update domain verification meta tag
  if (config.domainVerificationCode) {
    updateDomainVerificationMeta(config.domainVerificationCode);
  }

  if (!config.enabled || !config.pixelId || !config.pixelId.trim()) {
    return;
  }

  const cleanPixelId = config.pixelId.trim();

  // If already initialized with this exact ID, avoid duplicating snippet
  if (pixelInitialized && currentPixelId === cleanPixelId) {
    return;
  }

  currentPixelId = cleanPixelId;

  if (typeof window !== 'undefined') {
    /* eslint-disable */
    if (!window.fbq) {
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        if (s && s.parentNode) {
          s.parentNode.insertBefore(t, s);
        } else {
          b.head.appendChild(t);
        }
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    /* eslint-enable */

    try {
      window.fbq('init', cleanPixelId);
      pixelInitialized = true;

      if (config.trackPageView) {
        window.fbq('track', 'PageView');
        addEventLog('PageView (Init)', { pixelId: cleanPixelId }, 'Browser Pixel', 'SUCCESS');
      }
    } catch (e) {
      console.warn('Facebook Pixel init warning:', e);
    }
  }
};

/**
 * Sends event via Conversions API (CAPI) directly to Meta Graph API
 */
const sendToCapi = async (
  eventName: string,
  eventId: string,
  customData: Record<string, any>,
  userData: Record<string, any> = {}
) => {
  if (!activeConfig.enableCapi || !activeConfig.accessToken || !activeConfig.pixelId) {
    return;
  }

  try {
    const payload: Record<string, any> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: typeof window !== 'undefined' ? window.location.href : 'https://albarakahpremium.com',
          action_source: 'website',
          user_data: {
            client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            ...userData,
          },
          custom_data: customData,
        },
      ],
    };

    if (activeConfig.testEventCode && activeConfig.testEventCode.trim()) {
      payload.test_event_code = activeConfig.testEventCode.trim();
    }

    const endpoint = `https://graph.facebook.com/v19.0/${activeConfig.pixelId.trim()}/events?access_token=${activeConfig.accessToken.trim()}`;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.events_received) {
          addEventLog(`${eventName} (CAPI)`, { eventId, customData, response: resData }, 'Conversions API (CAPI)', 'SUCCESS');
        } else if (resData.error) {
          addEventLog(`${eventName} (CAPI Error)`, { error: resData.error.message }, 'Conversions API (CAPI)', 'WARNING');
        }
      })
      .catch((err) => {
        console.warn('Facebook CAPI request error:', err);
      });
  } catch (err) {
    console.warn('CAPI error:', err);
  }
};

/**
 * 1. Track PageView
 */
export const trackFbPageView = (pageName?: string) => {
  if (!activeConfig.enabled || !activeConfig.trackPageView) return;

  const eventId = `pv-${Date.now()}`;
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView', { page: pageName || window.location.pathname }, { eventID: eventId });
  }

  addEventLog('PageView', { path: pageName || (typeof window !== 'undefined' ? window.location.pathname : '/') }, 'Browser Pixel');
};

/**
 * 2. Track ViewContent (When user views product modal or product landing page)
 */
export const trackFbViewContent = (
  product: { id: string; name: string; price: number; category?: string; currency?: string },
  currencyParam?: string
) => {
  if (!activeConfig.enabled || !activeConfig.trackViewContent) return;

  const eventId = `vc-${product.id}-${Date.now()}`;
  const currency = currencyParam || product.currency || activeConfig.customCurrency || 'BDT';
  const customData = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    content_category: product.category || 'General',
    value: product.price,
    currency: currency,
  };

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', customData, { eventID: eventId });
  }

  sendToCapi('ViewContent', eventId, customData);
  addEventLog('ViewContent', customData, activeConfig.enableCapi && activeConfig.accessToken ? 'Both' : 'Browser Pixel');
};

/**
 * 3. Track AddToCart (When user adds product to bag)
 */
export const trackFbAddToCart = (
  product: { id: string; name: string; price: number; quantity?: number; category?: string; currency?: string },
  quantityParam?: number,
  priceParam?: number,
  currencyParam?: string
) => {
  if (!activeConfig.enabled || !activeConfig.trackAddToCart) return;

  const qty = quantityParam !== undefined ? quantityParam : (product.quantity || 1);
  const price = priceParam !== undefined ? priceParam : product.price;
  const eventId = `atc-${product.id}-${Date.now()}`;
  const currency = currencyParam || product.currency || activeConfig.customCurrency || 'BDT';
  const customData = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    content_category: product.category || 'General',
    value: price * qty,
    currency: currency,
    num_items: qty,
  };

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', customData, { eventID: eventId });
  }

  sendToCapi('AddToCart', eventId, customData);
  addEventLog('AddToCart', customData, activeConfig.enableCapi && activeConfig.accessToken ? 'Both' : 'Browser Pixel');
};

/**
 * 4. Track InitiateCheckout (When user opens checkout or begins order form)
 */
export const trackFbInitiateCheckout = (
  items: Array<any>,
  totalAmount: number,
  currency: string = 'BDT'
) => {
  if (!activeConfig.enabled || !activeConfig.trackInitiateCheckout) return;

  const eventId = `ic-${Date.now()}`;
  const customData = {
    content_ids: items.map((i) => i.id || i.product?.id || ''),
    content_type: 'product',
    value: totalAmount,
    currency: currency || activeConfig.customCurrency || 'BDT',
    num_items: items.reduce((acc, item) => acc + (item.quantity || 1), 0),
  };

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', customData, { eventID: eventId });
  }

  sendToCapi('InitiateCheckout', eventId, customData);
  addEventLog('InitiateCheckout', customData, activeConfig.enableCapi && activeConfig.accessToken ? 'Both' : 'Browser Pixel');
};

/**
 * 5. Track Purchase (When order is successfully submitted)
 */
export const trackFbPurchase = (order: {
  id: string;
  totalAmount?: number;
  subtotalAmount?: number;
  total?: number;
  currency?: string;
  items?: Array<{ id: string; name: string; price: number; quantity?: number }>;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customer?: any;
}) => {
  if (!activeConfig.enabled || !activeConfig.trackPurchase) return;

  const orderValue = order.totalAmount ?? order.total ?? order.subtotalAmount ?? 0;
  const currency = order.currency || activeConfig.customCurrency || 'BDT';
  const eventId = `pur-${order.id}`;

  const items = order.items || [];
  const contentIds = items.map((item) => item.id || 'item');

  const customData = {
    content_ids: contentIds.length > 0 ? contentIds : [order.id],
    content_type: 'product',
    value: orderValue,
    currency: currency,
    num_items: items.reduce((acc, item) => acc + (item.quantity || 1), 1),
    order_id: order.id,
  };

  const userData: Record<string, any> = {};
  const phone = order.customerPhone || order.customer?.phone;
  const email = order.customerEmail || order.customer?.email;
  const name = order.customerName || order.customer?.fullName;

  if (phone) userData.ph = phone.replace(/[^0-9+]/g, '');
  if (email) userData.em = email.trim().toLowerCase();
  if (name) userData.fn = name.trim();

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', customData, { eventID: eventId });
  }

  sendToCapi('Purchase', eventId, customData, userData);
  addEventLog('Purchase (অর্ডার সম্পন্ন)', { orderId: order.id, value: orderValue, currency, itemsCount: items.length }, activeConfig.enableCapi && activeConfig.accessToken ? 'Both' : 'Browser Pixel', 'SUCCESS');
};

/**
 * Test Event Sender for Meta Events Manager verification
 */
export const sendTestPixelEvent = (
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  customParam?: any
) => {
  const eventId = `test-${eventName.toLowerCase()}-${Date.now()}`;
  const currency = activeConfig.customCurrency || 'BDT';

  let customData: Record<string, any> = {
    test_mode: true,
    currency,
  };

  switch (eventName) {
    case 'PageView':
      customData = { page: '/test-event', title: 'Al Barakah Test' };
      break;
    case 'ViewContent':
      customData = {
        content_name: 'টেস্ট প্রিমিয়াম ঘানিভাঙা সরিষার তেল (৫ লিটার)',
        content_ids: ['prod-mustard-oil-5l'],
        content_type: 'product',
        value: 1350,
        currency,
      };
      break;
    case 'AddToCart':
      customData = {
        content_name: 'টেস্ট প্রিমিয়াম ঘানিভাঙা সরিষার তেল (৫ লিটার)',
        content_ids: ['prod-mustard-oil-5l'],
        content_type: 'product',
        value: 1350,
        currency,
        num_items: 1,
      };
      break;
    case 'InitiateCheckout':
      customData = {
        content_ids: ['prod-mustard-oil-5l'],
        content_type: 'product',
        value: 1350,
        currency,
        num_items: 1,
      };
      break;
    case 'Purchase':
      customData = {
        content_ids: ['prod-mustard-oil-5l'],
        content_type: 'product',
        value: 1350,
        currency,
        order_id: `TEST-${Date.now().toString().slice(-5)}`,
        num_items: 1,
      };
      break;
  }

  if (customParam) {
    customData = { ...customData, ...customParam };
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, customData, { eventID: eventId });
  }

  sendToCapi(eventName, eventId, customData);
  addEventLog(`TEST: ${eventName}`, customData, activeConfig.enableCapi && activeConfig.accessToken ? 'Both' : 'Browser Pixel', 'TEST');
};
