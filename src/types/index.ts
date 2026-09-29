/**
 * Grocery Choice Customer App - Core Domain Types
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  inStock: boolean;
  active: boolean;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
  slug: string;
  itemCount?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface Address {
  id?: number;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  isDefault?: boolean;
  contactName?: string;
  contactPhone?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role: string;
  active?: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'ONLINE' | 'UPI';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  subtotalAmount?: number;
  deliveryFee?: number;
  handlingFee?: number;
  discountAmount?: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address | string;
  items: OrderItem[];
  estimatedDelivery?: string;
}

export interface CreateOrderPayload {
  customerId?: number;
  deliveryAddress: Address | string;
  paymentMethod: PaymentMethod;
  items: {
    productId: number;
    quantity: number;
  }[];
  deliveryNote?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  accentColor: string;
  categoryId?: number;
}
