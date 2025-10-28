import { apiRequest } from "./queryClient";
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

export interface AdminStats {
  totalProducts: number;
  lowStock: number;
  categories: number;
  totalValue: string;
}

// Auth API
export async function adminLogin(email: string, password: string) {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  return response.json();
}

export async function customerLogin(email: string, password: string) {
  const response = await apiRequest('POST', '/api/auth/customer-login', { email, password });
  return response.json();
}

export async function register(userData: {
  email: string;
  password: string;
  name: string;
  phone: string;
  district?: string;
  road?: string;
  additionalLandmark?: string;
}) {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  return response.json();
}

export async function getCurrentUser() {
  const response = await apiRequest('GET', '/api/auth/me');
  return response.json();
}

export async function updateUserProfile(profileData: {
  name?: string;
  phone?: string;
  district?: string;
  road?: string;
  additionalLandmark?: string;
}) {
  const response = await apiRequest('PUT', '/api/auth/profile', profileData);
  return response.json();
}

export async function getUserOrders() {
  const response = await apiRequest('GET', '/api/auth/orders');
  const result = await response.json();
  return result.data || [];
}

// Products API
export interface PaginatedProducts {
  items: any[];
  total: number;
}

export async function getProducts(filters?: {
  category?: string;
  inStock?: boolean;
  search?: string;
  sortBy?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  
  const response = await apiRequest('GET', `/api/products?${params}`);
  const result = await response.json();
  return result.data || [];
}

export async function getProductsPaginated(filters?: {
  category?: string;
  inStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  
  const response = await apiRequest('GET', `/api/products?${params}`);
  const result = await response.json();
  
  // Transform the response to match PaginatedProducts interface
  return {
    items: result.data || [],
    total: result.meta?.pagination?.total || 0
  };
}

export async function getProduct(id: string) {
  const response = await apiRequest('GET', `/api/products/${id}`);
  const result = await response.json();
  return result.data || result;
}

// Orders API
export async function createOrder(orderData: any) {
  const response = await apiRequest('POST', '/api/orders', orderData);
  return response.json();
}

export async function getCustomerOrders(phone: string) {
  const response = await apiRequest('GET', `/api/orders/customer/${phone}`);
  const result = await response.json();
  return result.data || [];
}

// Admin API (requires authentication)
export async function getAdminStats() {
  const response = await apiRequest('GET', '/api/admin/stats');
  const result = await response.json();
  return result.data || {};
}

// Analytics API (admin)
export async function getSalesAnalytics(params?: { from?: string; to?: string; interval?: 'day' | 'week' | 'month' }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.append('from', params.from);
  if (params?.to) qs.append('to', params.to);
  if (params?.interval) qs.append('interval', params.interval);
  const response = await apiRequest('GET', `/api/admin/analytics/sales?${qs.toString()}`);
  const result = await response.json();
  return result.data || {};
}

export async function getRevenueReport(params?: { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.append('from', params.from);
  if (params?.to) qs.append('to', params.to);
  if (params?.groupBy) qs.append('groupBy', params.groupBy);
  const response = await apiRequest('GET', `/api/admin/analytics/revenue?${qs.toString()}`);
  const result = await response.json();
  return result.data || {};
}

export async function getProductPerformance(params?: { from?: string; to?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.append('from', params.from);
  if (params?.to) qs.append('to', params.to);
  if (params?.limit) qs.append('limit', String(params.limit));
  const response = await apiRequest('GET', `/api/admin/analytics/products?${qs.toString()}`);
  const result = await response.json();
  return result.data || [];
}

export async function getInventoryReport() {
  const response = await apiRequest('GET', `/api/admin/analytics/inventory`);
  const result = await response.json();
  return result.data || {};
}

export async function getCustomerAnalytics(params?: { from?: string; to?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.append('from', params.from);
  if (params?.to) qs.append('to', params.to);
  if (params?.limit) qs.append('limit', String(params.limit));
  const response = await apiRequest('GET', `/api/admin/analytics/customers?${qs.toString()}`);
  const result = await response.json();
  return result.data || {};
}

export async function getAdminOrders() {
  const response = await apiRequest('GET', '/api/admin/orders');
  const result = await response.json();
  return result.data || [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const response = await apiRequest('PUT', `/api/admin/orders/${orderId}/status`, { status });
  return response.json();
}

export async function createProduct(productData: any) {
  const response = await apiRequest('POST', '/api/admin/products', productData);
  return response.json();
}

export async function updateProduct(productId: string, productData: any) {
  const response = await apiRequest('PUT', `/api/admin/products/${productId}`, productData);
  return response.json();
}

export async function deleteProduct(productId: string) {
  const response = await apiRequest('DELETE', `/api/admin/products/${productId}`);
  return response.json();
}

// Categories API
export async function getCategories() {
  const response = await apiRequest('GET', '/api/categories');
  const result = await response.json();
  return result.data || [];
}

export async function createCategory(categoryData: any) {
  const response = await apiRequest('POST', '/api/admin/categories', categoryData);
  return response.json();
}

export async function updateCategory(categoryId: string, categoryData: any) {
  const response = await apiRequest('PUT', `/api/admin/categories/${categoryId}`, categoryData);
  return response.json();
}

export async function deleteCategory(categoryId: string) {
  const response = await apiRequest('DELETE', `/api/admin/categories/${categoryId}`);
  return response.json();
}

export async function importCSV(file: File) {
  const formData = new FormData();
  formData.append('csvFile', file);
  
  const response = await fetch('/api/admin/products/import-csv', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  return response.json();
}

// Wishlist API (customer)
export async function getWishlist() {
  const response = await apiRequest('GET', '/api/wishlist');
  const result = await response.json();
  return result.data || [];
}

export async function addToWishlist(productId: string) {
  const response = await apiRequest('POST', '/api/wishlist', { productId });
  return response.json();
}

export async function removeFromWishlist(productId: string) {
  const response = await apiRequest('DELETE', `/api/wishlist/${productId}`);
  return response.json();
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/admin/products/upload-image', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error('Server returned non-JSON response');
  }
  
  return response.json();
}

// Helper function to set auth token
export function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// Add auth header to requests
export async function authenticatedRequest(method: string, url: string, data?: any) {
  const token = getAuthToken();
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  return response;
}
