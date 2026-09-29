/**
 * Grocery Choice Customer App - Cart Context & Provider
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product } from '@/types';
import { storageService } from '@/storage/storage';
import { APP_CONFIG } from '@/constants/config';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalMrp: number;
  totalSavings: number;
  deliveryFee: number;
  handlingFee: number;
  totalAmount: number;
  isFreeDelivery: boolean;
  amountToFreeDelivery: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  getItemQuantity: (productId: number) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  totalMrp: 0,
  totalSavings: 0,
  deliveryFee: APP_CONFIG.STANDARD_DELIVERY_FEE,
  handlingFee: APP_CONFIG.HANDLING_FEE,
  totalAmount: 0,
  isFreeDelivery: false,
  amountToFreeDelivery: APP_CONFIG.FREE_DELIVERY_THRESHOLD,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  getItemQuantity: () => 0,
  clearCart: () => {}
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore cart on boot
  useEffect(() => {
    let isMounted = true;
    async function loadCart() {
      try {
        const saved = await storageService.getCartItems();
        if (isMounted && saved && Array.isArray(saved)) {
          setItems(saved);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }
    loadCart();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to storage after initial load
  useEffect(() => {
    if (isLoaded) {
      storageService.setCartItems(items);
    }
  }, [items, isLoaded]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const newQty = prev[existingIndex].quantity + quantity;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: newQty * product.sellingPrice
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity,
          lineTotal: quantity * product.sellingPrice
        }
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
            lineTotal: quantity * item.product.sellingPrice
          };
        }
        return item;
      });
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const getItemQuantity = (productId: number): number => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalMrp = items.reduce(
    (sum, item) => sum + item.quantity * (item.product.mrp || item.product.sellingPrice),
    0
  );
  const totalSavings = Math.max(0, totalMrp - subtotal);

  const isFreeDelivery = subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD || subtotal === 0;
  const amountToFreeDelivery = Math.max(0, APP_CONFIG.FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : APP_CONFIG.STANDARD_DELIVERY_FEE;
  const handlingFee = subtotal === 0 ? 0 : APP_CONFIG.HANDLING_FEE;
  const totalAmount = subtotal === 0 ? 0 : subtotal + deliveryFee + handlingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        totalMrp,
        totalSavings,
        deliveryFee,
        handlingFee,
        totalAmount,
        isFreeDelivery,
        amountToFreeDelivery,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
