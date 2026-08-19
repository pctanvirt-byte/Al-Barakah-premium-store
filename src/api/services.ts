import { Product, Order, UserProfile } from '../types';
import { fetchApi } from './client';

export const productsApi = {
  async getAll(params?: {
    category?: string;
    search?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.inStockOnly) query.set('inStockOnly', 'true');
    if (params?.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
    if (params?.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const data = await fetchApi<any[]>(`/api/products${qs ? `?${qs}` : ''}`);
    return data.map(item => ({
      ...item,
      category: item.categoryName || item.category || 'All',
    }));
  },

  async getById(id: string): Promise<Product> {
    const item = await fetchApi<any>(`/api/products/${id}`);
    return {
      ...item,
      category: item.categoryName || item.category || 'All',
    };
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetchApi<any>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return {
      ...res,
      price: Number(res.price),
      originalPrice: res.originalPrice ? Number(res.originalPrice) : undefined,
      category: res.categoryName || 'All',
    };
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
  }
};

export const ordersApi = {
  async create(orderData: any): Promise<{ success: boolean; order: any }> {
    return fetchApi<{ success: boolean; order: any }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async track(trackingCode: string): Promise<Order> {
    return fetchApi<Order>(`/api/orders/track/${encodeURIComponent(trackingCode)}`);
  },

  async getMyOrders(): Promise<Order[]> {
    return fetchApi<Order[]>('/api/orders/my-orders');
  },

  async getAllAdmin(): Promise<Order[]> {
    return fetchApi<Order[]>('/api/admin/orders');
  },

  async updateStatus(id: string, orderStatus: string, paymentStatus?: string): Promise<Order> {
    return fetchApi<Order>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus, paymentStatus }),
    });
  }
};

export const couponsApi = {
  async validate(code: string, subtotal?: number): Promise<{
    code: string;
    discountPercent: number;
    maxDiscountAmount: number | null;
    minOrderAmount: number;
  }> {
    return fetchApi('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    });
  }
};

export const wishlistApi = {
  async get(): Promise<Product[]> {
    const items = await fetchApi<any[]>('/api/wishlist');
    return items.map(item => ({
      ...item,
      category: item.categoryName || item.category || 'All',
    }));
  },

  async toggle(productId: string): Promise<{ added: boolean; message: string }> {
    return fetchApi(`/api/wishlist/${productId}`, {
      method: 'POST',
    });
  }
};
