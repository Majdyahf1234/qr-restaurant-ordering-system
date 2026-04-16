export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RECEPTION' | 'WAITER' | 'KITCHEN';
  isActive: boolean;
}

export interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  isActive: boolean;
  qrSessions?: QRSession[];
  orders?: Order[];
}

export interface QRSession {
  id: string;
  tableId: string;
  token: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  table?: Table;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isPublic: boolean;
  sortOrder: number;
  category?: Category;
}

export interface Order {
  id: string;
  tableId: string;
  qrSessionId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  taxAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  table?: Table;
  items?: OrderItem[];
  placedBy?: User;
  servedBy?: User;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  menuItem?: MenuItem;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: Record<string, string>;
  logoUrl?: string;
}

export interface DashboardStats {
  tables: {
    total: number;
    occupied: number;
    free: number;
  };
  orders: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    active: number;
    pending: number;
  };
  revenue: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
  };
  topItems: Array<{
    name: string;
    quantity: number;
  }>;
  counts: {
    menuItems: number;
    staff: number;
  };
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
}
