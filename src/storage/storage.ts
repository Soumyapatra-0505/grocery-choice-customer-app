/**
 * Grocery Choice Customer App - Persistent Storage Module
 * High reliability AsyncStorage wrapper with in-memory fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/constants/config';
import { Address, CartItem, User } from '@/types';

// In-memory fallback dictionary for test or unsupported environments
const memoryFallback = new Map<string, string>();

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }
      const memVal = memoryFallback.get(key);
      return memVal ? (JSON.parse(memVal) as T) : null;
    } catch {
      const memVal = memoryFallback.get(key);
      return memVal ? (JSON.parse(memVal) as T) : null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    memoryFallback.set(key, serialized);
    try {
      await AsyncStorage.setItem(key, serialized);
    } catch {
      // Memory fallback is already populated
    }
  },

  async remove(key: string): Promise<void> {
    memoryFallback.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Memory fallback already cleared
    }
  },

  async clear(): Promise<void> {
    memoryFallback.clear();
    try {
      await AsyncStorage.clear();
    } catch {
      // Handled
    }
  }
};

// Convenience helpers
export const storageService = {
  // Auth Token
  getAuthToken: () => storage.get<string>(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN),
  setAuthToken: (token: string) => storage.set(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token),
  removeAuthToken: () => storage.remove(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN),

  // User Profile
  getUserProfile: () => storage.get<User>(APP_CONFIG.STORAGE_KEYS.USER_PROFILE),
  setUserProfile: (user: User) => storage.set(APP_CONFIG.STORAGE_KEYS.USER_PROFILE, user),
  removeUserProfile: () => storage.remove(APP_CONFIG.STORAGE_KEYS.USER_PROFILE),

  // Cart Items
  getCartItems: () => storage.get<CartItem[]>(APP_CONFIG.STORAGE_KEYS.CART_ITEMS),
  setCartItems: (items: CartItem[]) => storage.set(APP_CONFIG.STORAGE_KEYS.CART_ITEMS, items),
  clearCartItems: () => storage.remove(APP_CONFIG.STORAGE_KEYS.CART_ITEMS),

  // Active Delivery Address
  getActiveAddress: () => storage.get<Address>(APP_CONFIG.STORAGE_KEYS.DELIVERY_ADDRESS),
  setActiveAddress: (address: Address) =>
    storage.set(APP_CONFIG.STORAGE_KEYS.DELIVERY_ADDRESS, address),

  // Saved Addresses List
  getSavedAddresses: () => storage.get<Address[]>(APP_CONFIG.STORAGE_KEYS.SAVED_ADDRESSES),
  setSavedAddresses: (addresses: Address[]) =>
    storage.set(APP_CONFIG.STORAGE_KEYS.SAVED_ADDRESSES, addresses),

  // Recent Searches
  getRecentSearches: () => storage.get<string[]>(APP_CONFIG.STORAGE_KEYS.RECENT_SEARCHES),
  addRecentSearch: async (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    const existing = (await storage.get<string[]>(APP_CONFIG.STORAGE_KEYS.RECENT_SEARCHES)) || [];
    const updated = [clean, ...existing.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
    await storage.set(APP_CONFIG.STORAGE_KEYS.RECENT_SEARCHES, updated);
  }
};
