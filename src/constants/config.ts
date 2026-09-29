/**
 * Grocery Choice Customer App - Global Configuration & Constants
 */

export const APP_CONFIG = {
  APP_NAME: 'Grocery Choice',
  TAGLINE: 'Fresh Groceries Delivered in Minutes',
  APP_VERSION: '1.0.0',

  // Backend API URL (Production fallback + env override)
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'https://grocery-choice-backend-production.up.railway.app/api',

  // Delivery & Quick Commerce Defaults
  DELIVERY_SLA_MINUTES: '10-15 MINS',
  FREE_DELIVERY_THRESHOLD: 199, // ₹199 minimum for free delivery
  STANDARD_DELIVERY_FEE: 25,    // ₹25 standard fee
  HANDLING_FEE: 4,              // ₹4 standard handling fee

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,

  // Fallback Product Image
  FALLBACK_PRODUCT_IMAGE:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'gc_auth_token',
    USER_PROFILE: 'gc_user_profile',
    CART_ITEMS: 'gc_cart_items',
    DELIVERY_ADDRESS: 'gc_active_address',
    SAVED_ADDRESSES: 'gc_saved_addresses',
    RECENT_SEARCHES: 'gc_recent_searches'
  }
};
