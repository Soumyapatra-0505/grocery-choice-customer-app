/**
 * Grocery Choice Customer App - Notifications Screen
 * Route: /notifications
 *
 * Full quick-commerce notifications hub:
 * - Orders, Payments, Offers, and System alerts
 * - Dynamic generation from real ordersApi data + seasonal offers
 * - Read/unread state management with persistent storage
 * - Filter pills (All, Orders, Payments, Offers) with live counts
 * - Tap notification -> contextual navigation to /order/[id], /orders, or /search
 * - Mark as read / Mark all as read
 * - Notification preferences bottom sheet modal
 * - Guest callout when unauthenticated
 * - Pull to refresh, loading, error, and empty states
 * - Responsive at 390x844 and 412x915
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Modal,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/services/authContext';
import { ordersApi } from '@/api/orders';
import { storageService } from '@/storage/storage';
import { APP_CONFIG } from '@/constants/config';
import { NotificationItem, NotificationType, NotificationPreferences, Order } from '@/types';

// Filter types
type FilterCategory = 'ALL' | 'ORDER' | 'PAYMENT' | 'OFFER';

// Static base promotional & system notifications
const DEFAULT_PROMOTIONS: NotificationItem[] = [
  {
    id: 'promo-10-min-welcome',
    type: 'OFFER',
    title: '⚡ 10–15 Min Delivery in Your Area!',
    message: 'Grocery Choice micro-warehouses are stocked and ready. Enjoy farm-fresh produce delivered in minutes.',
    timestamp: '2 hours ago',
    isRead: false,
    actionUrl: '/(tabs)',
    badgeText: 'SUPERFAST',
    icon: '⚡'
  },
  {
    id: 'promo-fresh-fruits-20',
    type: 'OFFER',
    title: '🍎 20% Off Farm-Fresh Fruits & Greens',
    message: 'Crisp apples, Alphonso mangoes, organic spinach, and farm carrots at special weekend prices.',
    timestamp: '5 hours ago',
    isRead: false,
    actionUrl: '/search?q=fruit',
    badgeText: 'LIMITED DEAL',
    icon: '🏷️'
  },
  {
    id: 'promo-free-delivery-199',
    type: 'OFFER',
    title: '🎉 Free Delivery on Orders Over ₹199',
    message: 'Add your daily dairy, breakfast essentials, and snacks to unlock zero delivery fee.',
    timestamp: '1 day ago',
    isRead: true,
    actionUrl: '/(tabs)',
    badgeText: 'SAVINGS',
    icon: '🛵'
  }
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  // Screen State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Preferences Modal State
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    deliveryAlerts: true,
    promotionalOffers: true,
    paymentAlerts: true
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);

  // Derive notifications from actual orders + static promotions
  const buildNotifications = useCallback(
    (orders: Order[], storedReadIds: string[]): NotificationItem[] => {
      const items: NotificationItem[] = [];

      // 1. Convert user's orders into real-time notifications
      if (Array.isArray(orders)) {
        orders.forEach((order) => {
          const dateStr = order.orderDate
            ? new Date(order.orderDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Recent';

          // A) Order Status / Delivery Notification
          let statusTitle = `Order #${order.orderNumber} Confirmed 📦`;
          let statusMessage = `Your grocery order is confirmed. Fresh items are being packed at our dark store.`;
          let statusBadge = 'CONFIRMED';
          let statusIcon = '📦';

          if (order.status === 'OUT_FOR_DELIVERY') {
            statusTitle = `Order #${order.orderNumber} Out for Delivery! 🚚`;
            statusMessage = `Rider is on the way with your grocery items. Fast delivery expected in 10–15 mins.`;
            statusBadge = 'OUT FOR DELIVERY';
            statusIcon = '🚚';
          } else if (order.status === 'DELIVERED') {
            statusTitle = `Order #${order.orderNumber} Delivered ✨`;
            statusMessage = `Your items were delivered fresh. We hope you loved shopping with Grocery Choice!`;
            statusBadge = 'DELIVERED';
            statusIcon = '✅';
          } else if (order.status === 'PROCESSING') {
            statusTitle = `Packing Order #${order.orderNumber} 🛒`;
            statusMessage = `Our team is carefully selecting and packing fresh items for quick dispatch.`;
            statusBadge = 'PACKING';
            statusIcon = '🛒';
          } else if (order.status === 'CANCELLED') {
            statusTitle = `Order #${order.orderNumber} Cancelled ✕`;
            statusMessage = `Your order has been cancelled. Any prepaid amount will be refunded automatically.`;
            statusBadge = 'CANCELLED';
            statusIcon = '❌';
          }

          const orderNotifId = `order-${order.id}-${order.status}`;
          items.push({
            id: orderNotifId,
            type: 'ORDER',
            title: statusTitle,
            message: statusMessage,
            timestamp: dateStr,
            isRead: storedReadIds.includes(orderNotifId),
            orderId: order.id,
            orderNumber: order.orderNumber,
            actionUrl: `/order/${order.id}`,
            badgeText: statusBadge,
            icon: statusIcon
          });

          // B) Payment Status Notification
          const paymentNotifId = `payment-${order.id}-${order.paymentStatus || 'STATUS'}`;
          const isPaid = order.paymentStatus === 'PAID';
          const methodLabel =
            order.paymentMethod === 'UPI'
              ? 'UPI Express'
              : order.paymentMethod === 'COD'
              ? 'Cash on Delivery'
              : 'Online Card/NetBanking';

          items.push({
            id: paymentNotifId,
            type: 'PAYMENT',
            title: `Payment ${isPaid ? 'Received' : 'Pending'}: ₹${order.totalAmount}`,
            message: `${isPaid ? 'Payment successful' : 'Pay upon delivery'} via ${methodLabel} for Order #${order.orderNumber}.`,
            timestamp: dateStr,
            isRead: storedReadIds.includes(paymentNotifId),
            orderId: order.id,
            orderNumber: order.orderNumber,
            actionUrl: `/order/${order.id}`,
            badgeText: isPaid ? 'PAID' : 'PENDING',
            icon: isPaid ? '💳' : '💵'
          });
        });
      }

      // 2. Add promotional & system notifications
      DEFAULT_PROMOTIONS.forEach((promo) => {
        items.push({
          ...promo,
          isRead: storedReadIds.includes(promo.id) || promo.isRead
        });
      });

      return items;
    },
    []
  );

  // Load all notifications, read IDs, and preferences
  const loadData = useCallback(async () => {
    setErrorMessage('');
    try {
      // 1. Load stored read notification IDs
      const storedRead = await storageService.getReadNotificationIds();
      setReadIds(storedRead);

      // 2. Load preferences
      const storedPrefs = await storageService.getNotificationPreferences();
      setPreferences(storedPrefs);

      // 3. Fetch user orders if authenticated
      let orders: Order[] = [];
      if (isAuthenticated) {
        try {
          orders = await ordersApi.getMyOrders();
        } catch {
          // If orders fetch fails temporarily, keep empty array
          orders = [];
        }
      }

      // 4. Assemble notification feed
      const assembled = buildNotifications(orders, storedRead);
      setNotifications(assembled);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, buildNotifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return notifications;
    return notifications.filter((item) => item.type === activeFilter);
  }, [notifications, activeFilter]);

  // Unread counts
  const totalUnreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const ordersCount = useMemo(() => {
    return notifications.filter((n) => n.type === 'ORDER').length;
  }, [notifications]);

  const paymentsCount = useMemo(() => {
    return notifications.filter((n) => n.type === 'PAYMENT').length;
  }, [notifications]);

  const offersCount = useMemo(() => {
    return notifications.filter((n) => n.type === 'OFFER').length;
  }, [notifications]);

  // Mark a single notification as read
  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    const updatedIds = await storageService.markNotificationAsRead(item.id);
    setReadIds(updatedIds);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (totalUnreadCount === 0) return;

    const allIds = notifications.map((n) => n.id);
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const updatedIds = await storageService.markAllNotificationsAsRead(allIds);
    setReadIds(updatedIds);
  };

  // Tap notification -> Mark as read + Navigate
  const handleNotificationPress = async (item: NotificationItem) => {
    await handleMarkAsRead(item);

    if (item.actionUrl) {
      if (item.actionUrl.startsWith('/order/')) {
        router.push(item.actionUrl as any);
      } else if (item.actionUrl.startsWith('/search')) {
        router.push(item.actionUrl as any);
      } else {
        router.push(item.actionUrl as any);
      }
    }
  };

  // Save notification preferences
  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await storageService.setNotificationPreferences(preferences);
      setIsPreferencesOpen(false);
      Alert.alert('Saved', 'Notification preferences updated successfully!');
    } catch {
      Alert.alert('Error', 'Unable to save preferences. Please try again.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Header Right Action (Settings + Mark all)
  const headerRight = (
    <View style={styles.headerRightContainer}>
      {totalUnreadCount > 0 ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllAsRead}
          style={styles.markAllHeaderBtn}
          accessibilityRole="button"
          accessibilityLabel="Mark all as read"
        >
          <Text style={styles.markAllHeaderText}>Mark all read</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsPreferencesOpen(true)}
        style={styles.settingsHeaderBtn}
        accessibilityRole="button"
        accessibilityLabel="Notification Preferences"
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header
        title="Notifications"
        subtitle={
          totalUnreadCount > 0
            ? `${totalUnreadCount} unread update${totalUnreadCount > 1 ? 's' : ''}`
            : 'All caught up'
        }
        showBack={true}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/(tabs)');
          }
        }}
        rightAction={headerRight}
      />

      {/* ================= FILTER CHIPS BAR ================= */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('ALL')}
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter all notifications (${notifications.length})`}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ALL' && styles.filterChipTextActive
              ]}
            >
              All {notifications.length > 0 ? `(${notifications.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('ORDER')}
            style={[styles.filterChip, activeFilter === 'ORDER' && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter order notifications (${ordersCount})`}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ORDER' && styles.filterChipTextActive
              ]}
            >
              📦 Orders {ordersCount > 0 ? `(${ordersCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('PAYMENT')}
            style={[styles.filterChip, activeFilter === 'PAYMENT' && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter payment notifications (${paymentsCount})`}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'PAYMENT' && styles.filterChipTextActive
              ]}
            >
              💳 Payments {paymentsCount > 0 ? `(${paymentsCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('OFFER')}
            style={[styles.filterChip, activeFilter === 'OFFER' && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter offer notifications (${offersCount})`}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'OFFER' && styles.filterChipTextActive
              ]}
            >
              🏷️ Offers {offersCount > 0 ? `(${offersCount})` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ================= MAIN CONTENT ================= */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <LoadingIndicator label="Loading notifications..." />
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to Load Notifications</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <Button
              title="Try Again"
              onPress={loadData}
              size="sm"
              variant="outline"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Guest User Callout Banner */}
          {!isAuthenticated ? (
            <View style={styles.guestBanner}>
              <View style={styles.guestIconCircle}>
                <Text style={styles.guestIcon}>👤</Text>
              </View>
              <View style={styles.guestTextWrapper}>
                <Text style={styles.guestTitle}>Sign in for Live Order Alerts</Text>
                <Text style={styles.guestDesc}>
                  Track your 10–15 min grocery delivery partner and payment receipts in real time.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/auth/login')}
                style={styles.guestActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Sign in to view orders"
              >
                <Text style={styles.guestActionText}>Sign In →</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Unread Summary Bar */}
          {totalUnreadCount > 0 ? (
            <View style={styles.unreadBanner}>
              <View style={styles.unreadBadgeDot} />
              <Text style={styles.unreadBannerText}>
                You have{' '}
                <Text style={styles.unreadBannerHighlight}>
                  {totalUnreadCount} unread notification{totalUnreadCount > 1 ? 's' : ''}
                </Text>
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleMarkAllAsRead}
                style={styles.markAllPillBtn}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Text style={styles.markAllPillText}>Mark all as read ✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.caughtUpBanner}>
              <Text style={styles.caughtUpText}>✨ You're all caught up with your latest updates!</Text>
            </View>
          )}

          {/* Notifications Feed */}
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title={
                activeFilter === 'ALL'
                  ? 'No Notifications Yet'
                  : `No ${activeFilter.toLowerCase()} notifications`
              }
              description="We'll notify you with live rider tracking, delivery status updates, and exclusive grocery discounts here."
              actionLabel="Explore Groceries"
              onAction={() => router.push('/(tabs)')}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <View style={styles.listContainer}>
              {filteredNotifications.map((item) => {
                const isUnread = !item.isRead;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => handleNotificationPress(item)}
                    style={[
                      styles.notificationCard,
                      isUnread && styles.notificationCardUnread
                    ]}
                  >
                    {/* Unread Left Border Highlight */}
                    {isUnread ? <View style={styles.unreadIndicatorBar} /> : null}

                    <View style={styles.cardInner}>
                      {/* Left Category Icon */}
                      <View
                        style={[
                          styles.iconContainer,
                          item.type === 'ORDER' && styles.iconContainerOrder,
                          item.type === 'PAYMENT' && styles.iconContainerPayment,
                          item.type === 'OFFER' && styles.iconContainerOffer
                        ]}
                      >
                        <Text style={styles.cardEmoji}>{item.icon || '🔔'}</Text>
                      </View>

                      {/* Notification Content */}
                      <View style={styles.contentContainer}>
                        {/* Tag Row: Category Badge + Timestamp + Unread Dot */}
                        <View style={styles.tagRow}>
                          <View
                            style={[
                              styles.categoryBadge,
                              item.type === 'ORDER' && styles.categoryBadgeOrder,
                              item.type === 'PAYMENT' && styles.categoryBadgePayment,
                              item.type === 'OFFER' && styles.categoryBadgeOffer
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryBadgeText,
                                item.type === 'ORDER' && styles.categoryBadgeTextOrder,
                                item.type === 'PAYMENT' && styles.categoryBadgeTextPayment,
                                item.type === 'OFFER' && styles.categoryBadgeTextOffer
                              ]}
                            >
                              {item.badgeText || item.type}
                            </Text>
                          </View>

                          <View style={styles.timeWrapper}>
                            <Text style={styles.timestampText}>{item.timestamp}</Text>
                            {isUnread ? <View style={styles.unreadDot} /> : null}
                          </View>
                        </View>

                        {/* Title */}
                        <Text
                          style={[
                            styles.notificationTitle,
                            isUnread && styles.notificationTitleUnread
                          ]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>

                        {/* Message Description */}
                        <Text style={styles.notificationMessage} numberOfLines={3}>
                          {item.message}
                        </Text>

                        {/* Context Action Button / Arrow */}
                        <View style={styles.actionRow}>
                          <View style={styles.actionLink}>
                            <Text style={styles.actionLinkText}>
                              {item.type === 'ORDER'
                                ? 'Track Order →'
                                : item.type === 'PAYMENT'
                                ? 'View Details →'
                                : 'Shop Now →'}
                            </Text>
                          </View>

                          {isUnread ? (
                            <TouchableOpacity
                              activeOpacity={0.6}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(item);
                              }}
                              style={styles.markReadBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityRole="button"
                              accessibilityLabel="Mark this notification as read"
                            >
                              <Text style={styles.markReadBtnText}>Mark read</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quick-Commerce Guarantee Footer */}
          <View style={styles.guaranteeBox}>
            <Text style={styles.guaranteeIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.guaranteeTitle}>Grocery Choice SLA Alerts</Text>
              <Text style={styles.guaranteeText}>
                We send critical delivery tracking alerts via Push & WhatsApp so you always know when your groceries arrive.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ================= PREFERENCES MODAL ================= */}
      <Modal
        visible={isPreferencesOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPreferencesOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notification Settings</Text>
                <Text style={styles.modalSubtitle}>Manage how Grocery Choice notifies you</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPreferencesOpen(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close notification settings"
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Toggles */}
            <View style={styles.modalBody}>
              {/* Toggle 1: Order Updates */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Order Status Updates</Text>
                  <Text style={styles.toggleDesc}>
                    Real-time confirmation, micro-warehouse packing, and dispatch alerts
                  </Text>
                </View>
                <Switch
                  value={preferences.orderUpdates}
                  onValueChange={(val) =>
                    setPreferences((prev) => ({ ...prev, orderUpdates: val }))
                  }
                  trackColor={{ false: colors.borderDark, true: colors.primaryLight }}
                  thumbColor={preferences.orderUpdates ? colors.primaryDark : '#FFFFFF'}
                />
              </View>

              {/* Toggle 2: Live Delivery Alerts */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Live Rider Delivery Alerts</Text>
                  <Text style={styles.toggleDesc}>
                    Rider location updates and 10–15 min SLA countdowns
                  </Text>
                </View>
                <Switch
                  value={preferences.deliveryAlerts}
                  onValueChange={(val) =>
                    setPreferences((prev) => ({ ...prev, deliveryAlerts: val }))
                  }
                  trackColor={{ false: colors.borderDark, true: colors.primaryLight }}
                  thumbColor={preferences.deliveryAlerts ? colors.primaryDark : '#FFFFFF'}
                />
              </View>

              {/* Toggle 3: Payment Confirmations */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Payment & Refund Confirmations</Text>
                  <Text style={styles.toggleDesc}>
                    UPI Express receipts, COD status, and instant refund notifications
                  </Text>
                </View>
                <Switch
                  value={preferences.paymentAlerts}
                  onValueChange={(val) =>
                    setPreferences((prev) => ({ ...prev, paymentAlerts: val }))
                  }
                  trackColor={{ false: colors.borderDark, true: colors.primaryLight }}
                  thumbColor={preferences.paymentAlerts ? colors.primaryDark : '#FFFFFF'}
                />
              </View>

              {/* Toggle 4: Promotional Deals */}
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Flash Sales & Discounts</Text>
                  <Text style={styles.toggleDesc}>
                    Personalized coupons, daily fresh produce sales, and weekend discounts
                  </Text>
                </View>
                <Switch
                  value={preferences.promotionalOffers}
                  onValueChange={(val) =>
                    setPreferences((prev) => ({ ...prev, promotionalOffers: val }))
                  }
                  trackColor={{ false: colors.borderDark, true: colors.primaryLight }}
                  thumbColor={preferences.promotionalOffers ? colors.primaryDark : '#FFFFFF'}
                />
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsPreferencesOpen(false)}
                style={styles.modalBtn}
              />
              <Button
                title={isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                onPress={handleSavePreferences}
                loading={isSavingPrefs}
                disabled={isSavingPrefs}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  markAllHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  markAllHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  settingsHeaderBtn: {
    padding: spacing.xs,
    borderRadius: radius.md
  },
  settingsIcon: {
    fontSize: 20
  },

  /* Filter Bar */
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold
  },

  /* Scroll container */
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: spacing.md
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },

  /* Guest Banner */
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  guestIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  guestIcon: {
    fontSize: 20
  },
  guestTextWrapper: {
    flex: 1,
    marginRight: spacing.sm
  },
  guestTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  guestDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16
  },
  guestActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md
  },
  guestActionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },

  /* Unread Banner */
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: spacing.md
  },
  unreadBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm
  },
  unreadBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textPrimary
  },
  unreadBannerHighlight: {
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  markAllPillBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  markAllPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },

  /* Caught Up Banner */
  caughtUpBanner: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    alignItems: 'center'
  },
  caughtUpText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium
  },

  /* Notification Cards */
  listContainer: {
    gap: spacing.md
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.primaryBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  unreadIndicatorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary
  },
  cardInner: {
    flexDirection: 'row',
    padding: spacing.md
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  iconContainerOrder: {
    backgroundColor: colors.primarySurface
  },
  iconContainerPayment: {
    backgroundColor: '#EFF6FF'
  },
  iconContainerOffer: {
    backgroundColor: '#FEF3C7'
  },
  cardEmoji: {
    fontSize: 22
  },
  contentContainer: {
    flex: 1
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.background
  },
  categoryBadgeOrder: {
    backgroundColor: colors.primarySurface
  },
  categoryBadgePayment: {
    backgroundColor: '#EFF6FF'
  },
  categoryBadgeOffer: {
    backgroundColor: '#FEF3C7'
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  categoryBadgeTextOrder: {
    color: colors.primaryDark
  },
  categoryBadgeTextPayment: {
    color: '#1D4ED8'
  },
  categoryBadgeTextOffer: {
    color: '#B45309'
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timestampText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    marginLeft: 6
  },
  notificationTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20
  },
  notificationTitleUnread: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  notificationMessage: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  actionLink: {
    paddingVertical: 2
  },
  actionLinkText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  markReadBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  markReadBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted
  },

  /* Guarantee Footer */
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginTop: spacing.lg
  },
  guaranteeIcon: {
    fontSize: 24,
    marginRight: spacing.sm
  },
  guaranteeTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginBottom: 2
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16
  },

  /* Error Card */
  errorCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    maxWidth: 340,
    ...shadows.sm
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: spacing.sm
  },
  errorTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.danger,
    marginBottom: spacing.xs
  },
  errorSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },

  /* Preferences Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
    ...shadows.lg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold
  },
  modalBody: {
    paddingVertical: spacing.md
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  toggleTextWrapper: {
    flex: 1,
    marginRight: spacing.md
  },
  toggleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  toggleDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  modalBtn: {
    flex: 1
  }
});
