/**
 * Grocery Choice Customer App - Formatters
 */
import type { Address, AddressType, OrderStatus } from '../types';

/**
 * Normalizes any address object (from backend, storage, or external input)
 * ensuring all required display and form fields (street, city, state, pincode, type)
 * are populated and safe to use without undefined errors.
 */
export function normalizeAddress(raw?: any): Address {
  if (!raw || typeof raw !== 'object') {
    return {
      street: 'Standard Delivery Address',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'HOME',
      isDefault: false
    };
  }

  // 1. Street normalization (supports street, addressLine1 + addressLine2, or deliveryAddressText)
  let street = '';
  if (typeof raw.street === 'string' && raw.street.trim()) {
    street = raw.street.trim();
  } else if (raw.addressLine1 || raw.addressLine2) {
    const parts = [raw.addressLine1, raw.addressLine2]
      .filter((p) => p !== undefined && p !== null && String(p).trim() !== '')
      .map((p) => String(p).trim());
    street = parts.join(', ');
  } else if (typeof raw.deliveryAddressText === 'string' && raw.deliveryAddressText.trim()) {
    street = raw.deliveryAddressText.trim();
  } else if (typeof raw.formattedAddress === 'string' && raw.formattedAddress.trim()) {
    street = raw.formattedAddress.trim();
  } else {
    street = 'Standard Delivery Address';
  }

  // 2. Pincode normalization
  let pincode = '';
  if (raw.pincode && String(raw.pincode).trim()) {
    pincode = String(raw.pincode).trim();
  } else if (raw.postalCode && String(raw.postalCode).trim()) {
    pincode = String(raw.postalCode).trim();
  } else if (raw.zipCode && String(raw.zipCode).trim()) {
    pincode = String(raw.zipCode).trim();
  } else {
    pincode = '751024';
  }

  // 3. Type normalization ('HOME' | 'WORK' | 'OTHER')
  let type: AddressType = 'HOME';
  const typeStr = String(raw.type || raw.label || '').toUpperCase();
  if (typeStr.includes('WORK') || typeStr.includes('OFFICE')) {
    type = 'WORK';
  } else if (typeStr.includes('OTHER')) {
    type = 'OTHER';
  } else {
    type = 'HOME';
  }

  // 4. Contact Name and Phone
  const contactName =
    raw.contactName ||
    raw.recipientName ||
    raw.customerName ||
    raw.receiverName ||
    undefined;

  const contactPhone =
    raw.contactPhone ||
    raw.recipientPhone ||
    raw.customerPhone ||
    raw.phone ||
    undefined;

  // 5. Landmark, City, State
  const landmark = raw.landmark && String(raw.landmark).trim() ? String(raw.landmark).trim() : undefined;
  const city = raw.city && String(raw.city).trim() ? String(raw.city).trim() : 'Bhubaneswar';
  const state = raw.state && String(raw.state).trim() ? String(raw.state).trim() : 'Odisha';

  // 6. AddressLine1 and AddressLine2 derivation for backend compatibility
  let addressLine1 = raw.addressLine1 ? String(raw.addressLine1).trim() : undefined;
  let addressLine2 = raw.addressLine2 ? String(raw.addressLine2).trim() : undefined;
  if (!addressLine1 && street) {
    if (street.includes(',')) {
      const parts = street.split(',');
      addressLine1 = parts[0].trim();
      addressLine2 = parts.slice(1).join(',').trim();
    } else {
      addressLine1 = street;
    }
  }

  return {
    id: typeof raw.id === 'number' ? raw.id : (raw.id && !isNaN(Number(raw.id)) ? Number(raw.id) : undefined),
    street,
    landmark,
    city,
    state,
    pincode,
    type,
    isDefault: Boolean(raw.isDefault),
    contactName: contactName ? String(contactName).trim() : undefined,
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    addressLine1,
    addressLine2,
    postalCode: pincode,
    userId: raw.userId ? Number(raw.userId) : undefined
  };
}

/**
 * Determines whether an order can be cancelled by the customer.
 * - Allowed: PLACED, PENDING, CONFIRMED
 * - Not allowed: PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
 */
export function isOrderCancellable(status?: OrderStatus | string | null): boolean {
  if (!status) return false;
  return status === 'PLACED' || status === 'PENDING' || status === 'CONFIRMED';
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  return `₹${num.toFixed(num % 1 === 0 ? 0 : 2)}`;
}

export function formatUnit(unit: string | undefined | null): string {
  if (!unit) return '1 pc';
  const u = unit.trim().toUpperCase();
  switch (u) {
    case 'PIECE':
    case 'PC':
      return '1 pc';
    case 'KG':
      return '1 kg';
    case 'GM':
    case 'G':
      return '500 g';
    case 'LTR':
    case 'L':
      return '1 L';
    case 'ML':
      return '500 ml';
    case 'PACK':
    case 'PKT':
      return '1 pack';
    case 'BUNCH':
      return '1 bunch';
    default:
      return unit;
  }
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function formatOrderNumber(orderNumber: string | undefined | null): string {
  if (!orderNumber) return '#GC-0000';
  return orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
}

export interface FormattedOrderAddress {
  formattedAddress: string;
  recipientName: string;
  recipientPhone: string;
  addressType: string;
}

/**
 * Robust, null-safe address formatter for order details.
 * Supports:
 * - String addresses (deliveryAddress or deliveryAddressText)
 * - Structured Address objects
 * - Undefined/null/missing addresses with graceful quick-commerce fallbacks
 */
export function formatOrderAddress(order?: {
  deliveryAddress?: any;
  deliveryAddressText?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
} | null): FormattedOrderAddress {
  if (!order) {
    return {
      formattedAddress: 'Standard Delivery Address',
      recipientName: 'Valued Customer',
      recipientPhone: '',
      addressType: 'HOME'
    };
  }

  const addr: any = order.deliveryAddress;
  const addrText: any = order.deliveryAddressText;

  let formattedAddress = 'Standard Delivery Address';

  if (typeof addr === 'string' && addr.trim().length > 0) {
    formattedAddress = addr.trim();
  } else if (typeof addrText === 'string' && addrText.trim().length > 0) {
    formattedAddress = addrText.trim();
  } else if (addr && typeof addr === 'object') {
    const parts: string[] = [];
    const street = addr.street || [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ');
    if (street && String(street).trim()) parts.push(String(street).trim());
    if (addr.landmark && String(addr.landmark).trim()) parts.push(String(addr.landmark).trim());
    if (addr.city && String(addr.city).trim()) parts.push(String(addr.city).trim());

    let stateZip = '';
    if (addr.state && String(addr.state).trim()) stateZip += String(addr.state).trim();
    const pin = addr.pincode || addr.postalCode;
    if (pin && String(pin).trim()) {
      stateZip = stateZip ? `${stateZip} - ${String(pin).trim()}` : String(pin).trim();
    }
    if (stateZip) parts.push(stateZip);

    if (parts.length > 0) {
      formattedAddress = parts.join(', ');
    }
  }

  const recipientName =
    (addr && typeof addr === 'object' && addr.contactName ? String(addr.contactName) : null) ||
    order.customerName ||
    'Valued Customer';

  const recipientPhone =
    (addr && typeof addr === 'object' && addr.contactPhone ? String(addr.contactPhone) : null) ||
    order.customerPhone ||
    '';

  const addressType =
    (addr && typeof addr === 'object' && addr.type ? String(addr.type).toUpperCase() : null) ||
    'HOME';

  return {
    formattedAddress,
    recipientName,
    recipientPhone,
    addressType
  };
}

/**
 * Normalizes an order returned by the backend to guarantee consistent address fields.
 * Spring Boot returns `deliveryAddressText` and `deliveryAddressId`.
 * This normalizer ensures `deliveryAddress` is always available.
 */
export function normalizeOrder<T = any>(raw: T): T {
  if (!raw || typeof raw !== 'object') return raw;
  const anyRaw = raw as any;
  const addressText =
    anyRaw.deliveryAddressText ||
    (typeof anyRaw.deliveryAddress === 'string' ? anyRaw.deliveryAddress : undefined);

  return {
    ...anyRaw,
    deliveryAddress: anyRaw.deliveryAddress || addressText || 'Standard Delivery Address',
    deliveryAddressText:
      addressText ||
      (typeof anyRaw.deliveryAddress === 'string' ? anyRaw.deliveryAddress : undefined)
  };
}


