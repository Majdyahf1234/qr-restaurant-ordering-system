import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const url = config.url || '';

    const isPublicRequest =
      url.startsWith('/qr/validate') ||
      url.startsWith('/qr/session/') ||
      url.startsWith('/public/');

    if (token && !isPublicRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const hasToken = !!localStorage.getItem('token');

    const isPublicRequest =
      url.startsWith('/qr/validate') ||
      url.startsWith('/qr/session/') ||
      url.startsWith('/public/');

    if (error.response?.status === 401) {
      if (hasToken && !isPublicRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Menu API
export const menuApi = {
  getCategories: () => api.get('/menu/categories'),
  getCategory: (id: string) => api.get(`/menu/categories/${id}`),
  createCategory: (data: any) => api.post('/menu/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  
  getItems: (params?: any) => api.get('/menu/items', { params }),
  getItem: (id: string) => api.get(`/menu/items/${id}`),
  createItem: (data: any) => api.post('/menu/items', data),
  updateItem: (id: string, data: any) => api.put(`/menu/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  updateAvailability: (id: string, isAvailable: boolean) =>
    api.patch(`/menu/items/${id}/availability`, { isAvailable }),
};

// Table API
export const tableApi = {
  getTables: () => api.get('/tables'),
  getTable: (id: string) => api.get(`/tables/${id}`),
  createTable: (data: any) => api.post('/tables', data),
  updateTable: (id: string, data: any) => api.put(`/tables/${id}`, data),
  deleteTable: (id: string) => api.delete(`/tables/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tables/${id}/status`, { status }),
  getSessions: (id: string) => api.get(`/tables/${id}/sessions`),
  closeTable: (id: string) => api.post(`/tables/${id}/close`),
};

// QR API
export const qrApi = {
  generate: (tableId: string) => api.post(`/qr/generate/${tableId}`),
  validate: (token: string) => api.post('/qr/validate', { token }),
  getSession: (token: string) => api.get(`/qr/session/${token}`),
  print: (tableId: string) => api.post(`/qr/print/${tableId}`),
  deactivate: (sessionId: string) => api.post(`/qr/deactivate/${sessionId}`),
};

// Order API
export const orderApi = {
  getOrders: (params?: any) => api.get('/orders', { params }),
  getActiveOrders: () => api.get('/orders/active'),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  getOrdersByTable: (tableId: string) => api.get(`/orders/table/${tableId}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (itemId: string, status: string) =>
    api.patch(`/orders/items/${itemId}/status`, { status }),
  addItems: (id: string, items: any[]) =>
    api.post(`/orders/${id}/items`, { items }),
  removeItem: (itemId: string) => api.delete(`/orders/items/${itemId}`),
  requestBill: (id: string) => api.post(`/orders/${id}/bill`),
  getCustomerCurrentOrder: (token: string) => api.get(`/orders/customer/current/${token}`),

addCustomerItems: (id: string, data: any) =>
  api.post(`/orders/customer/${id}/items`, data),

requestCustomerBill: (id: string, data: any) =>
  api.post(`/orders/customer/${id}/bill`, data),


};

// Admin API
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}/status`, { isActive }),
  
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings: any[]) => api.put('/admin/settings', { settings }),
  
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  getRestaurantInfo: () => api.get('/admin/restaurant-info'),
  updateRestaurantInfo: (data: any) => api.put('/admin/restaurant-info', data),
};

// Kitchen API
export const kitchenApi = {
  getOrders: () => api.get('/kitchen/orders'),
  getOrder: (id: string) => api.get(`/kitchen/orders/${id}`),
  markItemPreparing: (itemId: string) =>
    api.post(`/kitchen/items/${itemId}/preparing`),
  markItemReady: (itemId: string) =>
    api.post(`/kitchen/items/${itemId}/ready`),
  markOrderReady: (orderId: string) =>
    api.post(`/kitchen/orders/${orderId}/ready`),
  getStats: () => api.get('/kitchen/stats'),
};

// Reports API
export const reportApi = {
  getSales: (params: any) => api.get('/reports/sales', { params }),
  getItems: (params: any) => api.get('/reports/items', { params }),
  getTables: (params: any) => api.get('/reports/tables', { params }),
  getWaiters: (params: any) => api.get('/reports/waiters', { params }),
  exportCSV: (type: string, params: any) =>
    api.get('/reports/export/csv', { params: { type, ...params } }),
  exportPDF: (type: string, params: any) =>
    api.get('/reports/export/pdf', { params: { type, ...params } }),
};

// Public API
export const publicApi = {
  getRestaurantInfo: () => api.get('/public/restaurant-info'),
  getMenu: () => api.get('/public/menu'),
  getCategories: () => api.get('/public/categories'),
};

export default api;
