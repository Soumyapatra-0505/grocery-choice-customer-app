/**
 * Grocery Choice Customer App - Order Tracking & Details Screen
 * Route: /order/[id]
 * Upgraded to match Home, Search, Product Details, Cart, Checkout, and Address screens.
 * Features:
 * - Back button with safe fallback
 * - Order number (#GC-XXXXX) & Order date/time
 * - Total amount & Payment method/status badge
 * - Full Delivery Address details with recipient and address-type pill
 * - 4-stage Order Timeline:
 *   1. Order Placed
 *   2. Confirmed & Packed
 *   3. Out for Delivery
 *   4. Delivered
 * - Clearly highlighted current status with live ETA and delivery SLA messaging (10-15 MINS)
 * - Delivery partner section when order is out for delivery with appropriate unavailable state
 * - Track/Contact support actions
 * - Ordered items summary with optimized thumbnails and quantity breakdown
 * - Itemized Bill summary (Subtotal, Delivery Fee, Handling Fee, Discount, Total)
 * - Cancel option allowed ONLY for PENDING orders with confirmation
 * - 1-Tap Reorder option for completed / cancelled orders using CartContext
 * - Clean Loading, Error, and Invalid Order states
 * - Safe-area inset support & zero horizontal clipping
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Order, OrderStatus, Product } from '@/types';
import { ordersApi } from '@/api/orders';
import { useCart } from '@/services/cartContext';
import { storage } from '@/storage/storage';
import { formatCurrency, formatDate, formatOrderNumber, formatUnit, formatOrderAddress, FormattedOrderAddress, isOrderCancellable } from '@/utils/formatters';
export { formatOrderAddress, FormattedOrderAddress, isOrderCancellable };
import { APP_CONFIG } from '@/constants/config';

const STORAGE_ORDERS_KEY = 'gc_customer_orders';

// 4-stage timeline definition
const TIMELINE_STAGES: {
  key: OrderStatus;
  title: string;
  subtitle: string;
  icon: string;
}[] = [
  {
    key: 'PENDING',
    title: 'Order Placed',
    subtitle: 'Store has received your order',
    icon: '📝'
  },
  {
    key: 'CONFIRMED',
    title: 'Confirmed & Packed',
    subtitle: 'Items verified, weighed and sealed',
    icon: '🛍️'
  },
  {
    key: 'OUT_FOR_DELIVERY',
    title: 'Out for Delivery',
    subtitle: 'Delivery partner on the way',
    icon: '🛵'
  },
  {
    key: 'DELIVERED',
    title: 'Delivered',
    subtitle: 'Package handed over at your doorstep',
    icon: '🎉'
  }
];

// Comprehensive sample orders representing all supported system statuses
const SAMPLE_ORDERS: Order[] = [
  {
    id: 98241,
    orderNumber: 'GC-98241',
    customerId: 1,
    orderDate: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
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
    orderDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
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
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
    orderDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
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

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidId, setIsInvalidId] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordered, setIsReordered] = useState(false);

  // Load Order with multi-tier fallback
  const loadOrder = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setIsInvalidId(true);
      setIsLoading(false);
      return;
    }

    // Check if ID is non-numeric and not 'new'
    if (id !== 'new' && isNaN(Number(id))) {
      setIsInvalidId(true);
      setError('Invalid order ID provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsInvalidId(false);

    try {
      let foundOrder: Order | null = null;

      if (id === 'new') {
        // Navigated directly from checkout: check remote my-orders first
        try {
          const myOrders = await ordersApi.getMyOrders();
          if (Array.isArray(myOrders) && myOrders.length > 0) {
            foundOrder = myOrders[0];
          }
        } catch {
          // Backend offline
        }

        if (!foundOrder) {
          const cached = await storage.get<Order[]>(STORAGE_ORDERS_KEY);
          if (cached && cached.length > 0) {
            foundOrder = cached[0];
          }
        }
      } else {
        const numId = Number(id);

        // 1. Try remote API
        try {
          const data = await ordersApi.getById(numId);
          if (data && data.id) {
            foundOrder = data;
          }
        } catch {
          // Remote server offline or test ID
        }

        // 2. Try local stored orders cache
        if (!foundOrder) {
          const cached = await storage.get<Order[]>(STORAGE_ORDERS_KEY);
          if (cached && Array.isArray(cached)) {
            foundOrder = cached.find((o) => o.id === numId) || null;
          }
        }

        // 3. Fallback to sample demo orders if matching
        if (!foundOrder) {
          foundOrder = SAMPLE_ORDERS.find((o) => o.id === numId) || null;
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError(`We could not find order #${id}. Please verify the order number.`);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load order details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Handle Order Cancellation (allowed when status is PLACED, PENDING, or CONFIRMED)
  const handleCancelOrder = () => {
    if (!order) return;
    if (!isOrderCancellable(order.status)) {
      Alert.alert(
        'Cancellation Unavailable',
        'This order is already being processed and can no longer be cancelled.'
      );
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              let updated: Order;
              try {
                updated = await ordersApi.cancel(order.id);
              } catch {
                // Local mock fallback update
                updated = {
                  ...order,
                  status: 'CANCELLED',
                  paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus
                };
              }

              setOrder(updated);

              // Update storage cache if present
              const cached = await storage.get<Order[]>(STORAGE_ORDERS_KEY);
              if (cached && Array.isArray(cached)) {
                const updatedList = cached.map((o) => (o.id === order.id ? updated : o));
                await storage.set(STORAGE_ORDERS_KEY, updatedList);
              }

              Alert.alert('Order Cancelled', 'Your order has been successfully cancelled.');
            } catch (err: any) {
              Alert.alert('Unable to Cancel', err.message || 'Order cancellation failed.');
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  // Handle Reorder using existing CartContext
  const handleReorder = () => {
    if (!order || !order.items || order.items.length === 0) return;

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

    setIsReordered(true);
    setTimeout(() => setIsReordered(false), 3000);

    Alert.alert(
      'Items Added to Cart! 🛒',
      `${order.items.length} item${order.items.length > 1 ? 's' : ''} from order ${formatOrderNumber(order.orderNumber)} have been added to your cart.`,
      [
        { text: 'Stay Here', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => router.push('/(tabs)/cart') }
      ]
    );
  };

  // Back Navigation handler
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/orders');
    }
  };

  // Status configuration helper
  const getStatusBadgeConfig = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', variant: 'success' as BadgeVariant };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', variant: 'primary' as BadgeVariant };
      case 'CONFIRMED':
        return { label: 'Confirmed & Packed', variant: 'info' as BadgeVariant };
      case 'PROCESSING':
        return { label: 'Processing', variant: 'primary' as BadgeVariant };
      case 'PLACED':
      case 'PENDING':
        return { label: 'Order Placed', variant: 'warning' as BadgeVariant };
      case 'CANCELLED':
        return { label: 'Cancelled', variant: 'danger' as BadgeVariant };
      default:
        return { label: status, variant: 'neutral' as BadgeVariant };
    }
  };

  // Timeline stage ranking
  const getStageState = (stageKey: OrderStatus, currentStatus: OrderStatus): 'PASSED' | 'CURRENT' | 'UPCOMING' => {
    if (currentStatus === 'CANCELLED') return 'UPCOMING';
    const rankMap: Record<OrderStatus, number> = {
      PLACED: 1,
      PENDING: 1,
      CONFIRMED: 2,
      PROCESSING: 2,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4,
      CANCELLED: 0
    };
    const stageRank = rankMap[stageKey] || 1;
    const currentRank = rankMap[currentStatus] || 1;

    if (stageRank < currentRank) return 'PASSED';
    if (stageRank === currentRank) return 'CURRENT';
    return 'UPCOMING';
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Order Status" showBack onBack={handleBack} />
        <View style={styles.centerContainer}>
          <LoadingIndicator label="Loading order details..." />
        </View>
      </SafeAreaView>
    );
  }

  // 2. Invalid Order State
  if (isInvalidId) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Order Status" showBack onBack={handleBack} />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="⚠️"
            title="Invalid Order ID"
            description="The requested order ID is invalid or improperly formatted."
            actionLabel="View All Orders"
            onAction={() => router.push('/(tabs)/orders')}
            style={styles.emptyBox}
          />
        </View>
      </SafeAreaView>
    );
  }

  // 3. Error / Order Not Found State
  if (error || !order) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Order Status" showBack onBack={handleBack} />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="⚠️"
            title="Order Not Found"
            description={error || "Could not find details for this order."}
            actionLabel="View All Orders"
            onAction={() => router.push('/(tabs)/orders')}
            style={styles.emptyBox}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Computed variables for clean rendering
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const isActive = !isCancelled && !isDelivered;
  const canCancel = isOrderCancellable(order.status);
  const statusBadge = getStatusBadgeConfig(order.status);

  // Address parsing with defensive null-safety
  const {
    formattedAddress,
    recipientName,
    recipientPhone,
    addressType
  } = formatOrderAddress(order);

  // Subtotal calculation fallback
  const computedSubtotal = order.subtotalAmount !== undefined
    ? order.subtotalAmount
    : order.items
    ? order.items.reduce((sum, item) => sum + (item.lineTotal || item.price * item.quantity), 0)
    : order.totalAmount;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header bar */}
      <Header
        title={formatOrderNumber(order.orderNumber)}
        subtitle={formatDate(order.orderDate)}
        showBack
        onBack={handleBack}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero Card / SLA Banner */}
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <View style={styles.cancelledHeaderRow}>
              <Text style={styles.cancelledIcon}>✕</Text>
              <View style={styles.cancelledTextCol}>
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSubtitle}>
                  This order was cancelled. Any payments made will be refunded within 3-5 business days.
                </Text>
              </View>
            </View>
          </View>
        ) : isDelivered ? (
          <View style={styles.deliveredBanner}>
            <View style={styles.deliveredHeaderRow}>
              <Text style={styles.deliveredIcon}>🎉</Text>
              <View style={styles.deliveredTextCol}>
                <Text style={styles.deliveredTitle}>Order Delivered!</Text>
                <Text style={styles.deliveredSubtitle}>
                  Thank you for shopping with Grocery Choice. We hope you enjoy your fresh groceries!
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Active Live Tracking Banner with 10-15 MINS SLA */
          <View style={styles.liveTrackingCard}>
            <View style={styles.liveTrackingLeft}>
              <View style={styles.liveTrackingIconCircle}>
                <Text style={styles.liveTrackingIcon}>🛵</Text>
              </View>
              <View style={styles.liveTrackingTextCol}>
                <View style={styles.liveTitleRow}>
                  <Text style={styles.trackingTitle}>
                    Arriving in ~{order.estimatedDelivery || APP_CONFIG.DELIVERY_SLA_MINUTES}
                  </Text>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.trackingSubtitle}>
                  {isOutForDelivery
                    ? 'Your delivery partner is on the way to your doorstep'
                    : 'Store is packing your items fresh and safely'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 4-Stage Order Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Order Progress</Text>
            <Badge label={statusBadge.label} variant={statusBadge.variant} />
          </View>

          <View style={styles.stepperWrapper}>
            {TIMELINE_STAGES.map((stage, idx) => {
              const state = getStageState(stage.key, order.status);
              const isPassed = state === 'PASSED';
              const isCurrent = state === 'CURRENT';
              const isLast = idx === TIMELINE_STAGES.length - 1;

              return (
                <View key={stage.key} style={styles.stepRow}>
                  {/* Indicator Column */}
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepNode,
                        isPassed && styles.stepNodePassed,
                        isCurrent && styles.stepNodeCurrent
                      ]}
                    >
                      {isPassed ? (
                        <Text style={styles.stepNodeCheck}>✓</Text>
                      ) : (
                        <Text
                          style={[
                            styles.stepNodeNumber,
                            isCurrent && styles.stepNodeNumberCurrent
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepConnector,
                          isPassed && styles.stepConnectorPassed
                        ]}
                      />
                    )}
                  </View>

                  {/* Info Column */}
                  <View style={styles.stepInfoCol}>
                    <View style={styles.stepTitleRow}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isCurrent && styles.stepTitleCurrent,
                          isPassed && styles.stepTitlePassed
                        ]}
                      >
                        {stage.title}
                      </Text>
                      {isCurrent && (
                        <View style={styles.activeStepBadge}>
                          <Text style={styles.activeStepBadgeText}>IN PROGRESS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepSubtitle}>{stage.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Partner Section (when Out for Delivery) */}
        {isOutForDelivery && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Delivery Partner</Text>
              <Badge label="ON THE MOVE" variant="primary" />
            </View>

            {/* Check if real delivery partner info is available */}
            {(order as any).deliveryPartner && (order as any).deliveryPartner.name ? (
              <View style={styles.partnerInfoBox}>
                <View style={styles.partnerAvatarCircle}>
                  <Text style={styles.partnerAvatarIcon}>🛵</Text>
                </View>
                <View style={styles.partnerDetailsCol}>
                  <Text style={styles.partnerName}>{(order as any).deliveryPartner.name}</Text>
                  <Text style={styles.partnerVehicle}>
                    {(order as any).deliveryPartner.vehicleNumber || 'Electric Delivery Vehicle'}
                  </Text>
                </View>
                {(order as any).deliveryPartner.phone && (
                  <TouchableOpacity
                    style={styles.partnerCallBtn}
                    onPress={() => Linking.openURL(`tel:${(order as any).deliveryPartner.phone}`)}
                  >
                    <Text style={styles.partnerCallBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Appropriate unavailable state when partner info not in payload */
              <View style={styles.partnerUnavailableBox}>
                <View style={styles.partnerUnavailableLeft}>
                  <View style={styles.partnerUnavailableCircle}>
                    <Text style={styles.partnerUnavailableIcon}>🛵</Text>
                  </View>
                  <View style={styles.partnerUnavailableTextContainer}>
                    <Text style={styles.partnerUnavailableTitle}>Partner Dispatched</Text>
                    <Text style={styles.partnerUnavailableDesc}>
                      Your delivery partner is navigating to your address. Contact information is assigned automatically upon approach.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Support Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.supportActionRow}
              onPress={() =>
                Alert.alert(
                  'Grocery Choice Support',
                  'Need assistance with your delivery partner or items? Our support team is here for you.',
                  [
                    { text: 'Close', style: 'cancel' },
                    { text: 'Chat Support', onPress: () => {} }
                  ]
                )
              }
            >
              <Text style={styles.supportIcon}>💬</Text>
              <Text style={styles.supportLabel}>Need help with this delivery? Contact Support</Text>
              <Text style={styles.supportChevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Badge label={addressType} variant="neutral" />
          </View>

          <View style={styles.addressInfoWrapper}>
            <View style={styles.addressIconCircle}>
              <Text style={styles.addressPinIcon}>📍</Text>
            </View>
            <View style={styles.addressDetailsCol}>
              <Text style={styles.recipientName}>{recipientName}</Text>
              {recipientPhone ? (
                <Text style={styles.recipientPhone}>+91 {recipientPhone}</Text>
              ) : null}
              <Text style={styles.addressBodyText}>{formattedAddress}</Text>
            </View>
          </View>
        </View>

        {/* Ordered Items Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              Ordered Items ({order.items ? order.items.length : 0})
            </Text>
            <Text style={styles.itemCountSummary}>
              {order.items
                ? order.items.reduce((sum, item) => sum + item.quantity, 0)
                : 0}{' '}
              units
            </Text>
          </View>

          {order.items &&
            order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Image
                  source={{ uri: item.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE }}
                  style={styles.itemThumbnail}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.itemDetailsCol}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.itemUnitAndRate}>
                    {formatUnit(item.unit)} • Qty: {item.quantity} × {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemLineTotal}>
                  {formatCurrency(item.lineTotal || item.price * item.quantity)}
                </Text>
              </View>
            ))}

          {/* Bill Summary Section */}
          <View style={styles.billDivider} />
          <Text style={styles.billTitle}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>{formatCurrency(computedSubtotal)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text
              style={[
                styles.billValue,
                order.deliveryFee === 0 && styles.billValueFree
              ]}
            >
              {order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee || 25)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling & Packaging</Text>
            <Text style={styles.billValue}>{formatCurrency(order.handlingFee || 4)}</Text>
          </View>

          {order.discountAmount && order.discountAmount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billDiscountLabel}>Savings & Discounts</Text>
              <Text style={styles.billDiscountValue}>-{formatCurrency(order.discountAmount)}</Text>
            </View>
          ) : null}

          {/* Payment Method & Status */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentModeCol}>
              <Text style={styles.paymentModeLabel}>Payment Method</Text>
              <Text style={styles.paymentModeValue}>
                {order.paymentMethod || 'COD'}
              </Text>
            </View>
            <Badge
              label={order.paymentStatus || 'PENDING'}
              variant={
                order.paymentStatus === 'PAID'
                  ? 'success'
                  : order.paymentStatus === 'REFUNDED'
                  ? 'info'
                  : 'warning'
              }
            />
          </View>

          {/* Total Amount Row */}
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalRowLabel}>TOTAL AMOUNT PAID</Text>
              <Text style={styles.totalRowSub}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.totalRowAmount}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Cancel Order: Permitted when order status is PLACED, PENDING, or CONFIRMED */}
          {canCancel && (
            <Button
              title={isCancelling ? 'Cancelling Order...' : 'Cancel Order'}
              onPress={handleCancelOrder}
              variant="danger"
              loading={isCancelling}
              size="md"
              style={styles.actionBtn}
            />
          )}

          {/* Reorder / Buy Again: For Delivered or Cancelled orders */}
          {(isDelivered || isCancelled) && (
            <Button
              title={isReordered ? '✓ Added to Cart!' : 'Reorder Items 🔄'}
              onPress={handleReorder}
              variant="primary"
              size="md"
              style={styles.actionBtn}
            />
          )}

          {/* Back to Home / Orders */}
          <Button
            title="Back to Orders"
            onPress={() => router.push('/(tabs)/orders')}
            variant="outline"
            size="md"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
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
    padding: spacing.md
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  emptyBox: {
    width: '100%',
    maxWidth: 380
  },

  /* Live Tracking Hero Banner */
  liveTrackingCard: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  liveTrackingLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  liveTrackingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2
  },
  liveTrackingIcon: {
    fontSize: 22
  },
  liveTrackingTextCol: {
    flex: 1
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  trackingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  livePillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  trackingSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* Delivered Banner */
  deliveredBanner: {
    backgroundColor: colors.successSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  deliveredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deliveredIcon: {
    fontSize: 28,
    marginRight: spacing.sm + 2
  },
  deliveredTextCol: {
    flex: 1
  },
  deliveredTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textSuccess
  },
  deliveredSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* Cancelled Banner */
  cancelledBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cancelledHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cancelledIcon: {
    fontSize: 24,
    color: colors.danger,
    marginRight: spacing.sm + 2
  },
  cancelledTextCol: {
    flex: 1
  },
  cancelledTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.dangerDark
  },
  cancelledSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* General Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  cardTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },

  /* Stepper / Timeline */
  stepperWrapper: {
    paddingVertical: spacing.xs
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.sm
  },
  stepNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  stepNodePassed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  stepNodeCurrent: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryBorder,
    transform: [{ scale: 1.15 }]
  },
  stepNodeCheck: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  stepNodeNumber: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.bold
  },
  stepNodeNumberCurrent: {
    color: colors.textInverse
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2
  },
  stepConnectorPassed: {
    backgroundColor: colors.primary
  },
  stepInfoCol: {
    flex: 1,
    paddingBottom: spacing.sm
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  stepTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary
  },
  stepTitleCurrent: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },
  stepTitlePassed: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold
  },
  activeStepBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  activeStepBadgeText: {
    fontSize: 8,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  stepSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },

  /* Delivery Partner Section */
  partnerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.xs
  },
  partnerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  partnerAvatarIcon: {
    fontSize: 20
  },
  partnerDetailsCol: {
    flex: 1
  },
  partnerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  partnerVehicle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  partnerCallBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  partnerCallBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  partnerUnavailableBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    marginTop: spacing.xs
  },
  partnerUnavailableLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  partnerUnavailableCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  partnerUnavailableIcon: {
    fontSize: 18
  },
  partnerUnavailableTextContainer: {
    flex: 1
  },
  partnerUnavailableTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  partnerUnavailableDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2
  },
  supportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.xs
  },
  supportIcon: {
    fontSize: 14
  },
  supportLabel: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold
  },
  supportChevron: {
    fontSize: 16,
    color: colors.textMuted
  },

  /* Address Info */
  addressInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  addressPinIcon: {
    fontSize: 18
  },
  addressDetailsCol: {
    flex: 1
  },
  recipientName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  recipientPhone: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1
  },
  addressBodyText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3
  },

  /* Items List */
  itemCountSummary: {
    fontSize: 11,
    color: colors.textMuted
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  itemThumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.sm,
    backgroundColor: colors.background
  },
  itemDetailsCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  itemName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 16
  },
  itemUnitAndRate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  itemLineTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },

  /* Bill Summary */
  billDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm
  },
  billTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  billLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  billValueFree: {
    color: colors.textSuccess,
    fontWeight: typography.weights.bold
  },
  billDiscountLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSuccess,
    fontWeight: typography.weights.medium
  },
  billDiscountValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textSuccess
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  paymentModeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  paymentModeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted
  },
  paymentModeValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  totalRowLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  totalRowSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1
  },
  totalRowAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark
  },

  /* Action Buttons */
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  actionBtn: {
    width: '100%'
  }
});
