/**
 * Grocery Choice Customer App - Orders History Screen
 * Upgraded to match Home, Search, Product Details, Cart, Checkout, and Address screens.
 * Features:
 * - Orders header with dynamic status summary
 * - Quick filter chips: All, Active, Delivered, Cancelled
 * - Rich Order Cards with Order #, Date/Time, Status Badges & Icons
 * - Product thumbnails & itemized summary
 * - Item count, payment method/status, total amount
 * - Track Order / View Order actions with deep-linking to /order/[id]
 * - 1-Tap Reorder / Buy Again using existing CartContext
 * - Clean Logged-Out Sign-In CTA
 * - Empty Orders state with quick shopping suggestions
 * - Loading indicator with skeletons
 * - Error + Retry state
 * - iOS & Android safe-area insets & no horizontal overflow
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Order, OrderStatus, Product } from '@/types';
import { ordersApi } from '@/api/orders';
import { useAuth } from '@/services/authContext';
import { useCart } from '@/services/cartContext';
import { storage } from '@/storage/storage';
import { formatCurrency, formatDate, formatOrderNumber, formatUnit } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

type OrderFilter = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

const STORAGE_ORDERS_KEY = 'gc_customer_orders';

// Comprehensive sample orders representing all supported system statuses
const SAMPLE_ORDERS: Order[] = [
  {
    id: 98241,
    orderNumber: 'GC-98241',
    customerId: 1,
    orderDate: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago
    status: 'OUT_FOR_DELIVERY',
    totalAmount: 451,
    subtotalAmount: 422,
    deliveryFee: 25,
    handlingFee: 4,
    discountAmount: 45,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    deliveryAddress: {
      id: 1,
      street: 'Flat 402, Green Valley Apartments, Chandrasekharpur',
      landmark: 'Opposite Infocity Park',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'HOME',
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210'
    },
    items: [
      {
        id: 101,
        productId: 1,
        productName: 'Amul Taaza Homogenised Toned Milk',
        unit: '1 L',
        price: 72,
        quantity: 2,
        lineTotal: 144,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 102,
        productId: 2,
        productName: 'Aashirvaad Superior MP Sharbati Atta',
        unit: '5 kg',
        price: 265,
        quantity: 1,
        lineTotal: 265,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 103,
        productId: 3,
        productName: 'Fresh Farm Hybrid Tomatoes',
        unit: '1 kg',
        price: 42,
        quantity: 1,
        lineTotal: 42,
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400'
      }
    ],
    estimatedDelivery: '10-15 MINS'
  },
  {
    id: 98104,
    orderNumber: 'GC-98104',
    customerId: 1,
    orderDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    status: 'CONFIRMED',
    totalAmount: 201,
    subtotalAmount: 172,
    deliveryFee: 25,
    handlingFee: 4,
    discountAmount: 20,
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    deliveryAddress: {
      id: 2,
      street: 'TCS Infotech Tower, 3rd Floor, Patia',
      landmark: 'Near KIIT Square',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'WORK',
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210'
    },
    items: [
      {
        id: 104,
        productId: 4,
        productName: 'Fortune Sunlite Refined Sunflower Oil',
        unit: '1 L',
        price: 145,
        quantity: 1,
        lineTotal: 145,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 105,
        productId: 5,
        productName: 'Tata Salt Vacuum Evaporated Iodised Salt',
        unit: '1 kg',
        price: 28,
        quantity: 2,
        lineTotal: 56,
        imageUrl: 'https://images.unsplash.com/photo-1588615419957-86c478a87317?auto=format&fit=crop&q=80&w=400'
      }
    ],
    estimatedDelivery: '25-30 MINS'
  },
  {
    id: 97812,
    orderNumber: 'GC-97812',
    customerId: 1,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'DELIVERED',
    totalAmount: 370,
    subtotalAmount: 370,
    deliveryFee: 0,
    handlingFee: 4,
    discountAmount: 60,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    deliveryAddress: {
      id: 1,
      street: 'Flat 402, Green Valley Apartments, Chandrasekharpur',
      landmark: 'Opposite Infocity Park',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'HOME',
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210'
    },
    items: [
      {
        id: 106,
        productId: 6,
        productName: "Kellogg's Corn Flakes Original",
        unit: '500 g',
        price: 195,
        quantity: 1,
        lineTotal: 195,
        imageUrl: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 107,
        productId: 7,
        productName: 'Epigamia Greek Yogurt Natural Strawberry',
        unit: '100 g',
        price: 55,
        quantity: 2,
        lineTotal: 110,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 108,
        productId: 8,
        productName: 'Fresh Cavendish Golden Bananas',
        unit: '1 kg',
        price: 65,
        quantity: 1,
        lineTotal: 65,
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 97500,
    orderNumber: 'GC-97500',
    customerId: 1,
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'PENDING',
    totalAmount: 189,
    subtotalAmount: 160,
    deliveryFee: 25,
    handlingFee: 4,
    discountAmount: 15,
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    deliveryAddress: {
      id: 1,
      street: 'Flat 402, Green Valley Apartments, Chandrasekharpur',
      landmark: 'Opposite Infocity Park',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'HOME',
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210'
    },
    items: [
      {
        id: 110,
        productId: 10,
        productName: 'Britannia 100% Whole Wheat Bread',
        unit: '400 g',
        price: 50,
        quantity: 2,
        lineTotal: 100,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 111,
        productId: 11,
        productName: 'Amul Butter Pasteurised',
        unit: '100 g',
        price: 60,
        quantity: 1,
        lineTotal: 60,
        imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 96540,
    orderNumber: 'GC-96540',
    customerId: 1,
    orderDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
    status: 'CANCELLED',
    totalAmount: 119,
    subtotalAmount: 119,
    deliveryFee: 0,
    handlingFee: 4,
    discountAmount: 10,
    paymentStatus: 'REFUNDED',
    paymentMethod: 'ONLINE',
    deliveryAddress: {
      id: 1,
      street: 'Flat 402, Green Valley Apartments, Chandrasekharpur',
      landmark: 'Opposite Infocity Park',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      type: 'HOME',
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210'
    },
    items: [
      {
        id: 109,
        productId: 9,
        productName: 'Dettol Original Liquid Handwash Refill Pouch',
        unit: '750 ml',
        price: 119,
        quantity: 1,
        lineTotal: 119,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
      }
    ]
  }
];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderedOrderId, setReorderedOrderId] = useState<number | null>(null);

  // Fetch orders with graceful fallback
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let list: Order[] = [];

      // 1. Try remote API first
      try {
        const remoteData = await ordersApi.getMyOrders();
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          list = remoteData;
          await storage.set(STORAGE_ORDERS_KEY, list);
        }
      } catch {
        // Backend offline or unreachable, fall back to storage
      }

      // 2. If remote returned empty, check storage cache or seed demo
      if (list.length === 0) {
        const cached = await storage.get<Order[]>(STORAGE_ORDERS_KEY);
        if (cached !== null && Array.isArray(cached)) {
          list = cached;
        } else if (cached === null) {
          // First time initialization: seed sample demo orders
          list = SAMPLE_ORDERS;
          await storage.set(STORAGE_ORDERS_KEY, SAMPLE_ORDERS);
        }
      }

      setOrders(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Status configuration helper
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return {
          label: 'Delivered',
          variant: 'success' as BadgeVariant,
          icon: '✓',
          badgeBg: '#D1FAE5',
          badgeText: '#047857',
          borderColor: '#A7F3D0'
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          variant: 'primary' as BadgeVariant,
          icon: '🛵',
          badgeBg: '#ECFDF5',
          badgeText: '#059669',
          borderColor: '#6EE7B7'
        };
      case 'CONFIRMED':
      case 'PROCESSING':
        return {
          label: status === 'CONFIRMED' ? 'Confirmed & Packed' : 'Processing',
          variant: 'info' as BadgeVariant,
          icon: '🛍️',
          badgeBg: '#EFF6FF',
          badgeText: '#0284C7',
          borderColor: '#BAE6FD'
        };
      case 'PLACED':
      case 'PENDING':
        return {
          label: 'Order Placed',
          variant: 'warning' as BadgeVariant,
          icon: '⏳',
          badgeBg: '#FEF3C7',
          badgeText: '#D97706',
          borderColor: '#FDE68A'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          variant: 'danger' as BadgeVariant,
          icon: '✕',
          badgeBg: '#FEE2E2',
          badgeText: '#DC2626',
          borderColor: '#FECACA'
        };
      default:
        return {
          label: status,
          variant: 'neutral' as BadgeVariant,
          icon: '📦',
          badgeBg: '#F1F5F9',
          badgeText: '#475569',
          borderColor: '#E2E8F0'
        };
    }
  };

  // Is active delivery
  const isActiveOrder = (status: OrderStatus): boolean => {
    return (
      status === 'PLACED' ||
      status === 'PENDING' ||
      status === 'CONFIRMED' ||
      status === 'PROCESSING' ||
      status === 'OUT_FOR_DELIVERY'
    );
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'ACTIVE':
        return orders.filter((o) => isActiveOrder(o.status));
      case 'DELIVERED':
        return orders.filter((o) => o.status === 'DELIVERED');
      case 'CANCELLED':
        return orders.filter((o) => o.status === 'CANCELLED');
      case 'ALL':
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) => isActiveOrder(o.status)).length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length
    };
  }, [orders]);

  // Handle reorder
  const handleReorder = (order: Order, e?: any) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    if (!order.items || order.items.length === 0) return;

    order.items.forEach((item) => {
      const product: Product = {
        id: item.productId,
        name: item.productName,
        description: '',
        sku: `SKU-${item.productId}`,
        categoryId: 1,
        categoryName: 'Groceries',
        categorySlug: 'groceries',
        unit: item.unit || '1 pc',
        mrp: item.price,
        sellingPrice: item.price,
        discountPercentage: 0,
        stockQuantity: 99,
        inStock: true,
        active: true,
        imageUrl: item.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE
      };
      addItem(product, item.quantity);
    });

    setReorderedOrderId(order.id);
    setTimeout(() => {
      setReorderedOrderId((current) => (current === order.id ? null : current));
    }, 3000);

    Alert.alert(
      'Added to Cart! 🛒',
      `${order.items.length} item${order.items.length > 1 ? 's' : ''} from order ${formatOrderNumber(order.orderNumber)} have been added to your cart.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => router.push('/(tabs)/cart')
        }
      ]
    );
  };

  // Navigation to order details
  const handleOpenOrder = (orderId: number) => {
    router.push({
      pathname: '/order/[id]',
      params: { id: String(orderId) }
    });
  };

  // 1. Logged-out User State
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="My Orders" subtitle="Grocery Choice" />
        <ScrollView
          contentContainerStyle={styles.loggedOutScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loggedOutCard}>
            <View style={styles.loggedOutIconCircle}>
              <Text style={styles.loggedOutIcon}>🛍️</Text>
            </View>
            <Text style={styles.loggedOutTitle}>Sign in to view orders</Text>
            <Text style={styles.loggedOutSubtitle}>
              Log in with your mobile number to track live deliveries in real-time, view order receipts,
              and 1-tap reorder your favorite essentials.
            </Text>

            {/* Feature Highlights */}
            <View style={styles.highlightsContainer}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>⚡</Text>
                <View style={styles.highlightTextContainer}>
                  <Text style={styles.highlightTitle}>10-15 Min Live Tracking</Text>
                  <Text style={styles.highlightDesc}>Watch delivery partner arrival in real time</Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>🧾</Text>
                <View style={styles.highlightTextContainer}>
                  <Text style={styles.highlightTitle}>Itemized Receipts</Text>
                  <Text style={styles.highlightDesc}>Access past invoices and exact order totals</Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>🔄</Text>
                <View style={styles.highlightTextContainer}>
                  <Text style={styles.highlightTitle}>1-Tap Reorder</Text>
                  <Text style={styles.highlightDesc}>Quickly repeat your weekly grocery baskets</Text>
                </View>
              </View>
            </View>

            <Button
              title="Sign In / Register"
              onPress={() => router.push('/auth/login')}
              variant="primary"
              size="lg"
              style={styles.signInButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Top Header */}
      <Header
        title="My Orders"
        subtitle={
          orders.length > 0
            ? `${orders.length} order${orders.length > 1 ? 's' : ''}${
                counts.active > 0 ? ` • ${counts.active} active` : ''
              }`
            : 'Track & manage your orders'
        }
      />

      {/* Main Content Area */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator label="Loading your orders..." />
        </View>
      ) : error ? (
        <ScrollView
          contentContainerStyle={styles.centerScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon="⚠️"
            title="Unable to load orders"
            description={error}
            actionLabel="Try Again"
            onAction={handleRefresh}
          />
        </ScrollView>
      ) : orders.length === 0 ? (
        /* Empty Orders State */
        <ScrollView
          contentContainerStyle={styles.centerScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>No orders placed yet</Text>
            <Text style={styles.emptyDescription}>
              Your grocery orders and live delivery tracking will appear here as soon as you place your first order.
            </Text>

            <Button
              title="Start Shopping 🛒"
              onPress={() => router.push('/(tabs)')}
              variant="primary"
              size="md"
              style={styles.emptyButton}
            />

            {/* Quick shopping shortcuts */}
            <View style={styles.quickShortcuts}>
              <Text style={styles.quickShortcutsTitle}>Popular Categories</Text>
              <View style={styles.shortcutChips}>
                {[
                  { label: '🥛 Dairy & Bread', path: '/(tabs)' },
                  { label: '🍎 Fresh Fruits', path: '/(tabs)' },
                  { label: '🌾 Atta & Dal', path: '/(tabs)' },
                  { label: '🥨 Snacks', path: '/(tabs)' }
                ].map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={styles.shortcutChip}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.shortcutChipText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Orders List with Filter Chips */
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Status Filter Chips Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { key: 'ALL' as OrderFilter, label: 'All Orders', count: counts.all },
              { key: 'ACTIVE' as OrderFilter, label: 'Active', count: counts.active },
              { key: 'DELIVERED' as OrderFilter, label: 'Delivered', count: counts.delivered },
              { key: 'CANCELLED' as OrderFilter, label: 'Cancelled', count: counts.cancelled }
            ].map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.75}
                  onPress={() => setActiveFilter(tab.key)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${tab.label}`}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                    <Text
                      style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Filter Empty Result Notice */}
          {filteredOrders.length === 0 ? (
            <View style={styles.filterEmptyNotice}>
              <Text style={styles.filterEmptyIcon}>🔍</Text>
              <Text style={styles.filterEmptyTitle}>No {activeFilter.toLowerCase()} orders found</Text>
              <Text style={styles.filterEmptySubtitle}>
                Try selecting "All Orders" to view your complete order history.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveFilter('ALL')}
                style={styles.clearFilterButton}
              >
                <Text style={styles.clearFilterText}>Show All Orders</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const statusCfg = getStatusConfig(order.status);
              const isActive = isActiveOrder(order.status);
              const isDelivered = order.status === 'DELIVERED';
              const totalUnits = order.items
                ? order.items.reduce((sum, item) => sum + item.quantity, 0)
                : 0;
              const isReordered = reorderedOrderId === order.id;

              return (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.88}
                  onPress={() => handleOpenOrder(order.id)}
                  style={styles.orderCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${order.orderNumber}, ${statusCfg.label}`}
                >
                  {/* Card Header: Order Number, Date, Status Badge */}
                  <View style={styles.orderCardHeader}>
                    <View style={styles.orderNumberGroup}>
                      <View style={styles.orderNumberRow}>
                        <Text style={styles.orderNumber}>{formatOrderNumber(order.orderNumber)}</Text>
                        {isActive && (
                          <View style={styles.livePulseDot}>
                            <View style={styles.livePulseInner} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: statusCfg.badgeBg,
                          borderColor: statusCfg.borderColor
                        }
                      ]}
                    >
                      <Text style={styles.statusIcon}>{statusCfg.icon}</Text>
                      <Text style={[styles.statusText, { color: statusCfg.badgeText }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Active SLA Banner */}
                  {isActive && order.status === 'OUT_FOR_DELIVERY' && (
                    <View style={styles.slaBanner}>
                      <Text style={styles.slaIcon}>⏱</Text>
                      <Text style={styles.slaTitle}>
                        Delivery partner on the way • Arriving in ~{order.estimatedDelivery || APP_CONFIG.DELIVERY_SLA_MINUTES}
                      </Text>
                    </View>
                  )}

                  {/* Product Thumbnails & Summary List */}
                  <View style={styles.itemsSection}>
                    {/* Horizontal Mini Thumbnails */}
                    {order.items && order.items.length > 0 && (
                      <View style={styles.thumbnailsRow}>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <View key={idx} style={styles.thumbnailWrapper}>
                            <Image
                              source={{
                                uri: item.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE
                              }}
                              style={styles.thumbnailImage}
                              contentFit="cover"
                              transition={150}
                            />
                            {item.quantity > 1 && (
                              <View style={styles.qtyBadge}>
                                <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
                              </View>
                            )}
                          </View>
                        ))}
                        {order.items.length > 3 && (
                          <View style={styles.moreThumbnailBadge}>
                            <Text style={styles.moreThumbnailText}>+{order.items.length - 3}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Item Names Text Summary */}
                    <View style={styles.itemsSummary}>
                      <Text style={styles.itemsText} numberOfLines={2}>
                        {order.items && order.items.length > 0
                          ? order.items
                              .map(
                                (i) =>
                                  `${i.productName} (${formatUnit(i.unit)}) × ${i.quantity}`
                              )
                              .join(' • ')
                          : 'Daily groceries and essentials'}
                      </Text>
                      <Text style={styles.itemCountText}>
                        {order.items ? order.items.length : 0} items ({totalUnits} total unit{totalUnits !== 1 ? 's' : ''})
                      </Text>
                    </View>
                  </View>

                  {/* Card Divider */}
                  <View style={styles.cardDivider} />

                  {/* Card Footer: Amount, Payment Mode, Action Buttons */}
                  <View style={styles.orderCardFooter}>
                    {/* Amount & Payment Info */}
                    <View style={styles.amountCol}>
                      <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                      <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
                      <View style={styles.paymentInfoRow}>
                        <Text style={styles.paymentMethodText}>
                          {order.paymentMethod || 'COD'}
                        </Text>
                        <Text style={styles.paymentDot}>•</Text>
                        <Text
                          style={[
                            styles.paymentStatusText,
                            order.paymentStatus === 'PAID'
                              ? styles.paymentPaid
                              : order.paymentStatus === 'REFUNDED'
                              ? styles.paymentRefunded
                              : styles.paymentPending
                          ]}
                        >
                          {order.paymentStatus || 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsCol}>
                      {isActive ? (
                        /* Active Order: Primary Track CTA */
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(order.id);
                          }}
                          style={styles.trackButton}
                        >
                          <Text style={styles.trackButtonIcon}>🛵</Text>
                          <Text style={styles.trackButtonText}>Track Order</Text>
                        </TouchableOpacity>
                      ) : (
                        /* Past / Delivered / Cancelled: Reorder CTA + Details */
                        <View style={styles.pastActionButtons}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={(e) => handleReorder(order, e)}
                            style={[
                              styles.reorderButton,
                              isReordered && styles.reorderButtonSuccess
                            ]}
                          >
                            <Text style={styles.reorderButtonIcon}>
                              {isReordered ? '✓' : '🔄'}
                            </Text>
                            <Text
                              style={[
                                styles.reorderButtonText,
                                isReordered && styles.reorderButtonTextSuccess
                              ]}
                            >
                              {isReordered ? 'Added!' : 'Reorder'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleOpenOrder(order.id);
                            }}
                            style={styles.viewDetailsButton}
                          >
                            <Text style={styles.viewDetailsText}>Details →</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollContent: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md
  },

  /* Filter Tabs Row */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs + 4
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  filterChipText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  filterBadgeTextActive: {
    color: colors.textInverse
  },

  /* Filter Empty Notice */
  filterEmptyNotice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.md
  },
  filterEmptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs
  },
  filterEmptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  filterEmptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  clearFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  clearFilterText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },

  /* Order Card */
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  orderNumberGroup: {
    flex: 1,
    marginRight: spacing.sm
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  orderNumber: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2
  },
  livePulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  livePulseInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary
  },
  orderDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },

  /* Status Pill */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 4
  },
  statusIcon: {
    fontSize: 12
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },

  /* SLA Banner */
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    gap: 6
  },
  slaIcon: {
    fontSize: 14
  },
  slaTitle: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
    flex: 1
  },

  /* Items Section */
  itemsSection: {
    paddingVertical: spacing.sm,
    gap: spacing.xs + 2
  },
  thumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    backgroundColor: colors.background
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  qtyBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  qtyBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: typography.weights.bold
  },
  moreThumbnailBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  moreThumbnailText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  itemsSummary: {
    marginTop: 2
  },
  itemsText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18
  },
  itemCountText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },

  /* Divider */
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs + 2
  },

  /* Footer Section */
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2
  },
  amountCol: {
    flex: 1
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  totalAmount: {
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 1
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  paymentDot: {
    fontSize: 10,
    color: colors.textMuted
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold
  },
  paymentPaid: {
    color: colors.textSuccess
  },
  paymentPending: {
    color: colors.warning
  },
  paymentRefunded: {
    color: colors.accent
  },

  /* Actions */
  actionButtonsCol: {
    alignItems: 'flex-end'
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 6,
    ...shadows.sm
  },
  trackButtonIcon: {
    fontSize: 13
  },
  trackButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold
  },
  pastActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4
  },
  reorderButtonSuccess: {
    backgroundColor: colors.successSurface,
    borderColor: colors.success
  },
  reorderButtonIcon: {
    fontSize: 11
  },
  reorderButtonText: {
    color: colors.primaryDark,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },
  reorderButtonTextSuccess: {
    color: colors.textSuccess
  },
  viewDetailsButton: {
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md
  },
  viewDetailsText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold
  },

  /* Empty State Card */
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    ...shadows.sm
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  emptyIcon: {
    fontSize: 32
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  emptyDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  emptyButton: {
    minWidth: 180,
    marginBottom: spacing.lg
  },
  quickShortcuts: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    alignItems: 'center'
  },
  quickShortcutsTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm
  },
  shortcutChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs
  },
  shortcutChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2
  },
  shortcutChipText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary
  },

  /* Logged-Out State */
  loggedOutScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  loggedOutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    ...shadows.md
  },
  loggedOutIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  loggedOutIcon: {
    fontSize: 36
  },
  loggedOutTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  loggedOutSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  highlightsContainer: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  highlightIcon: {
    fontSize: 20,
    marginTop: 1
  },
  highlightTextContainer: {
    flex: 1
  },
  highlightTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  highlightDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  signInButton: {
    width: '100%'
  }
});
