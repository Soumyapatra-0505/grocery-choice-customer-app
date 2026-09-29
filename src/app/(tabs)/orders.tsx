/**
 * Grocery Choice Customer App - Orders History Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Order, OrderStatus } from '@/types';
import { ordersApi } from '@/api/orders';
import { useAuth } from '@/services/authContext';
import { formatCurrency, formatDate, formatOrderNumber } from '@/utils/formatters';

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
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

  const getStatusBadgeVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'OUT_FOR_DELIVERY':
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'primary';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="My Orders" />
        <EmptyState
          icon="🔒"
          title="Login to View Orders"
          description="Sign in with your mobile number to view past orders and live tracking."
          actionLabel="Sign In"
          onAction={() => router.push('/auth/login')}
          style={styles.emptyContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header title="My Orders" subtitle={`${orders.length} past orders`} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {isLoading && !refreshing ? (
          <LoadingIndicator label="Loading your orders..." />
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="Unable to load orders"
            description={error}
            actionLabel="Try Again"
            onAction={handleRefresh}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders placed yet"
            description="When you order groceries, details and live tracking will appear here."
            actionLabel="Order Groceries"
            onAction={() => router.push('/(tabs)')}
          />
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/order/[id]',
                  params: { id: String(order.id) }
                })
              }
              style={styles.orderCard}
            >
              {/* Order Card Header */}
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderNumber}>{formatOrderNumber(order.orderNumber)}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                </View>
                <Badge label={order.status} variant={getStatusBadgeVariant(order.status)} />
              </View>

              {/* Items summary */}
              <View style={styles.itemsSummary}>
                <Text style={styles.itemsText} numberOfLines={2}>
                  {order.items && order.items.length > 0
                    ? order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')
                    : 'Groceries and essentials'}
                </Text>
              </View>

              {/* Order Card Footer */}
              <View style={styles.orderCardFooter}>
                <View>
                  <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
                </View>

                <Button
                  title="Track Order →"
                  onPress={() =>
                    router.push({
                      pathname: '/order/[id]',
                      params: { id: String(order.id) }
                    })
                  }
                  variant="outline"
                  size="sm"
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
  orderNumber: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  orderDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  itemsSummary: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: spacing.xs
  },
  itemsText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted
  },
  totalAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  }
});
