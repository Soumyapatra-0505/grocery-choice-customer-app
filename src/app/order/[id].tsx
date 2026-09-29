/**
 * Grocery Choice Customer App - Order Tracking & Details Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Order, OrderStatus } from '@/types';
import { ordersApi } from '@/api/orders';
import { formatCurrency, formatDate, formatOrderNumber } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received by store' },
  { key: 'CONFIRMED', label: 'Confirmed & Packed', desc: 'Items checked and sealed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order completed' }
];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        if (id === 'new') {
          // If navigated right from checkout, fetch latest my-orders
          const myOrders = await ordersApi.getMyOrders();
          if (myOrders && myOrders.length > 0) {
            setOrder(myOrders[0]);
          } else {
            throw new Error('Latest order not found');
          }
        } else {
          const data = await ordersApi.getById(Number(id));
          setOrder(data);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load order details');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCancelOrder = () => {
    if (!order) return;
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
              const updated = await ordersApi.cancel(order.id);
              setOrder(updated);
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (err: any) {
              Alert.alert('Unable to Cancel', err.message || 'Order cancellation is not permitted at this stage.');
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Order Status" showBack />
        <LoadingIndicator label="Loading order details..." style={styles.centerContainer} />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Order Status" showBack />
        <EmptyState
          icon="⚠️"
          title="Order Not Found"
          description={error || 'Could not find details for this order.'}
          actionLabel="View All Orders"
          onAction={() => router.push('/(tabs)/orders')}
          style={styles.centerContainer}
        />
      </SafeAreaView>
    );
  }

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
      case 'PROCESSING':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const getBadgeVariant = (status: OrderStatus): BadgeVariant => {
    if (status === 'DELIVERED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (status === 'PENDING') return 'warning';
    return 'primary';
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header
        title={formatOrderNumber(order.orderNumber)}
        subtitle={formatDate(order.orderDate)}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live SLA Card */}
        {!isCancelled && order.status !== 'DELIVERED' ? (
          <View style={styles.liveTrackingCard}>
            <View style={styles.liveTrackingLeft}>
              <Text style={styles.trackingIcon}>🛵</Text>
              <View>
                <Text style={styles.trackingTitle}>Arriving in ~{APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
                <Text style={styles.trackingSubtitle}>Your delivery partner is on the move</Text>
              </View>
            </View>
            <Badge label="LIVE" variant="primary" />
          </View>
        ) : isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>This order has been cancelled.</Text>
          </View>
        ) : (
          <View style={styles.deliveredBanner}>
            <Text style={styles.deliveredTitle}>Order Delivered! 🎉</Text>
            <Text style={styles.deliveredSubtitle}>Thank you for shopping with Grocery Choice.</Text>
          </View>
        )}

        {/* Stepper Card */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking Progress</Text>
            <View style={styles.stepperWrapper}>
              {STATUS_STEPS.map((step, index) => {
                const isPassed = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepNode,
                          isPassed && styles.stepNodePassed,
                          isCurrent && styles.stepNodeCurrent
                        ]}
                      >
                        <Text style={[styles.stepNodeText, isPassed && styles.stepNodeTextPassed]}>
                          {isPassed ? '✓' : index + 1}
                        </Text>
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepConnector,
                            index < currentStep && styles.stepConnectorPassed
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stepInfoCol}>
                      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                        {step.label}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>
            {typeof order.deliveryAddress === 'string'
              ? order.deliveryAddress
              : `${order.deliveryAddress.street}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`}
          </Text>
        </View>

        {/* Items Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered ({order.items ? order.items.length : 0})</Text>
          {order.items &&
            order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemQtyUnit}>
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal || item.price * item.quantity)}</Text>
              </View>
            ))}

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method</Text>
            <Text style={styles.billValue}>{order.paymentMethod || 'COD'}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Status</Text>
            <Badge label={order.paymentStatus || 'PENDING'} variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'} />
          </View>

          <View style={[styles.billRow, { marginTop: spacing.xs }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'PENDING' && (
          <Button
            title={isCancelling ? 'Cancelling...' : 'Cancel Order'}
            onPress={handleCancelOrder}
            variant="danger"
            loading={isCancelling}
            size="md"
            style={{ marginBottom: spacing.md }}
          />
        )}

        <Button
          title="Back to Home"
          onPress={() => router.push('/(tabs)')}
          variant="outline"
          size="md"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  liveTrackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  liveTrackingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  trackingIcon: {
    fontSize: 26,
    marginRight: spacing.sm
  },
  trackingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  trackingSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  cancelledBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
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
  deliveredBanner: {
    backgroundColor: colors.successSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  stepperWrapper: {
    paddingVertical: spacing.xs
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.sm
  },
  stepNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  stepNodePassed: {
    backgroundColor: colors.primary
  },
  stepNodeCurrent: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 1.1 }]
  },
  stepNodeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.bold
  },
  stepNodeTextPassed: {
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
  stepLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  stepLabelCurrent: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },
  stepDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  addressText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm
  },
  itemName: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium
  },
  itemQtyUnit: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  itemTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  billLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  totalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark
  }
});
