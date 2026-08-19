import { CourierConfig, Order } from '../types';

export const DEFAULT_COURIER_CONFIG: CourierConfig = {
  steadfast: {
    enabled: false,
    apiKey: '',
    secretKey: '',
    baseUrl: 'https://portal.steadfast.com.bd',
  },
  pathao: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    storeId: '',
    baseUrl: 'https://api-hermes.pathao.com',
  },
  defaultCourier: 'steadfast',
  autoSendOnConfirm: false,
};

export interface SendCourierResult {
  success: boolean;
  provider: 'steadfast' | 'pathao';
  consignmentId?: string;
  trackingCode?: string;
  status?: string;
  message: string;
  raw?: any;
  error?: string;
}

/**
 * Send an order to Steadfast Courier through secure backend API
 */
export async function sendOrderToSteadfast(
  order: Order,
  config: CourierConfig['steadfast']
): Promise<SendCourierResult> {
  if (!config.apiKey || !config.secretKey) {
    return {
      success: false,
      provider: 'steadfast',
      message: 'Steadfast API Key এবং Secret Key কনফিগার করা নেই। অনুগ্রহ করে Settings থেকে যুক্ত করুন।',
      error: 'Missing API credentials',
    };
  }

  try {
    const res = await fetch('/api/courier/steadfast/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        baseUrl: config.baseUrl,
        order,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        provider: 'steadfast',
        message: data.error || 'Steadfast-এ পার্সেল পাঠানো ব্যর্থ হয়েছে।',
        error: data.error,
        raw: data,
      };
    }

    return {
      success: true,
      provider: 'steadfast',
      consignmentId: data.consignmentId,
      trackingCode: data.trackingCode,
      status: data.status,
      message: data.message || 'Steadfast কুরিয়ারে সফলভাবে এন্ট্রি সম্পন্ন হয়েছে!',
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'steadfast',
      message: error.message || 'সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।',
      error: error.message,
    };
  }
}

/**
 * Send an order to Pathao Courier through secure backend API
 */
export async function sendOrderToPathao(
  order: Order,
  config: CourierConfig['pathao']
): Promise<SendCourierResult> {
  if (!config.clientId || !config.clientSecret || !config.username || !config.password) {
    return {
      success: false,
      provider: 'pathao',
      message: 'Pathao ক্রেডেনশিয়াল (Client ID, Secret, Username, Password) কনফিগার করা নেই।',
      error: 'Missing Pathao credentials',
    };
  }

  try {
    const res = await fetch('/api/courier/pathao/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: config.username,
        password: config.password,
        storeId: config.storeId,
        baseUrl: config.baseUrl,
        order,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        provider: 'pathao',
        message: data.error || 'Pathao-তে পার্সেল পাঠানো ব্যর্থ হয়েছে।',
        error: data.error,
        raw: data,
      };
    }

    return {
      success: true,
      provider: 'pathao',
      consignmentId: data.consignmentId,
      trackingCode: data.trackingCode,
      status: data.status,
      message: data.message || 'Pathao কুরিয়ারে সফলভাবে এন্ট্রি সম্পন্ন হয়েছে!',
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'pathao',
      message: error.message || 'সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।',
      error: error.message,
    };
  }
}

/**
 * Universal One-Click Dispatcher based on active provider
 */
export async function dispatchOrderToCourier(
  order: Order,
  courierConfig: CourierConfig,
  preferredProvider?: 'steadfast' | 'pathao'
): Promise<SendCourierResult> {
  const provider = preferredProvider || courierConfig.defaultCourier || 'steadfast';

  if (provider === 'steadfast') {
    return sendOrderToSteadfast(order, courierConfig.steadfast);
  } else if (provider === 'pathao') {
    return sendOrderToPathao(order, courierConfig.pathao);
  } else {
    return {
      success: false,
      provider: 'steadfast',
      message: 'কোনো কুরিয়ার সার্ভিস সক্রিয় করা নেই।',
      error: 'No active courier provider',
    };
  }
}
