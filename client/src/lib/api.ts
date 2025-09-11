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
export async function login(email: string, password: string) {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  return response.json();
}

// Products API
export async function getProducts(filters?: {
  category?: string;
  inStock?: boolean;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.search) params.append('search', filters.search);
  
  const response = await apiRequest('GET', `/api/products?${params}`);
  return response.json();
}

export async function getProduct(id: string) {
  const response = await apiRequest('GET', `/api/products/${id}`);
  return response.json();
}

// Orders API
export async function createOrder(orderData: any) {
  const response = await apiRequest('POST', '/api/orders', orderData);
  return response.json();
}

export async function getCustomerOrders(phone: string) {
  const response = await apiRequest('GET', `/api/orders/customer/${phone}`);
  return response.json();
}

// Admin API (requires authentication)
export async function getAdminStats() {
  const response = await apiRequest('GET', '/api/admin/stats');
  return response.json();
}

export async function getAdminOrders() {
  const response = await apiRequest('GET', '/api/admin/orders');
  return response.json();
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
  return response.json();
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
