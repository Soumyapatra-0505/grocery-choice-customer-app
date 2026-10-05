/**
 * Grocery Choice Customer App - Checkout Screen
 * Premium, production-quality quick-commerce checkout.
 * Selected address preview, quick delivery instruction chips,
 * itemized order summary, payment selection, accurate billing,
 * and sticky bottom Place Order CTA.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/services/cartContext';
import { useAuth } from '@/services/authContext';
import { ordersApi } from '@/api/orders';
import { storageService } from '@/storage/storage';
import { Address, PaymentMethod } from '@/types';
import { formatCurrency, formatUnit, normalizeAddress } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

const DELIVERY_INSTRUCTION_CHIPS = [
  { id: 'door', text: 'Leave at door', emoji: '🚪' },
  { id: 'nobell', text: "Don't ring bell", emoji: '🔕' },
  { id: 'call', text: 'Call upon arrival', emoji: '📞' },
  { id: 'guard', text: 'Leave with security', emoji: '🛡️' }
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
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
    clearCart
  } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Strict check that subtotal meets threshold for free delivery
  const hasFreeDelivery = isFreeDelivery && subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAllItems, setShowAllItems] = useState<boolean>(false);
  const submitLockRef = useRef<boolean>(false);

  // Load active delivery address or default fallback
  useEffect(() => {
    let isMounted = true;
    async function loadAddress() {
      try {
        const active = await storageService.getActiveAddress();
        if (isMounted && active) {
          setSelectedAddress(normalizeAddress(active));
          return;
        }

        const addresses = await storageService.getSavedAddresses();
        if (isMounted && addresses && Array.isArray(addresses) && addresses.length > 0) {
          const primary = addresses.find((a) => a.isDefault) || addresses[0];
          setSelectedAddress(normalizeAddress(primary));
          return;
        }

        // Standard default address fallback
        if (isMounted) {
          setSelectedAddress({
            street: 'Flat 402, Green Valley Apartments',
            landmark: 'Near City Park',
            city: 'Bhubaneswar',
            state: 'Odisha',
            pincode: '751024',
            type: 'HOME'
          });
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadAddress();
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle delivery instruction chip
  const toggleChip = (chipText: string) => {
    if (selectedChips.includes(chipText)) {
      const next = selectedChips.filter((c) => c !== chipText);
      setSelectedChips(next);
      setDeliveryNote(next.join(', '));
    } else {
      const next = [...selectedChips, chipText];
      setSelectedChips(next);
      setDeliveryNote(next.join(', '));
    }
  };

  // Safe Place Order handler with duplicate submission protection & payment verification routing
  const handlePlaceOrder = async () => {
    if (isSubmitting || submitLockRef.current) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with your mobile number to complete your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please select or add a delivery address to proceed.');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      const safeAddr = normalizeAddress(selectedAddress);
      const streetText = safeAddr.street || 'Standard Delivery Address';
      const landmarkText = safeAddr.landmark ? `${safeAddr.landmark}, ` : '';
      const cityText = safeAddr.city || 'Bhubaneswar';
      const stateText = safeAddr.state || 'Odisha';
      const pincodeText = safeAddr.pincode || '751024';
      const formattedAddressString = `${streetText}, ${landmarkText}${cityText}, ${stateText} - ${pincodeText}`;

      const payload = {
        customerId: user?.id || 1,
        addressId: safeAddr.id ? Number(safeAddr.id) : undefined,
        deliveryAddressText: formattedAddressString,
        deliveryAddress: formattedAddressString,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        deliveryNote
      };

      const newOrder = await ordersApi.create(payload);

      // Cash On Delivery (COD) Flow: Clear cart immediately and route to Order Tracking
      if (paymentMethod === 'COD') {
        clearCart();
        router.replace({
          pathname: '/order/[id]',
          params: { id: String(newOrder.id || 'new') }
        });
        return;
      }

      // Online Payment Flow: DO NOT clear cart yet!
      // Route to Payment Verification screen to authorize transaction
      router.push({
        pathname: '/payment/verify',
        params: {
          orderId: String(newOrder.id || '1'),
          autoStart: 'true'
        }
      });
    } catch (err: any) {
      Alert.alert(
        'Order Placement Notice',
        err.message || 'Unable to place order at this time. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  // If cart is completely empty, show clean empty state
  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Checkout</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🛒"
            title="Your Cart is Empty"
            description="Add products to your cart before proceeding to checkout."
            actionLabel="Start Shopping"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const displayedItems = showAllItems ? items : items.slice(0, 2);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* ================================================== */}
      {/* 1. TOP APP BAR                                     */}
      {/* ================================================== */}
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle}>Checkout</Text>
          <Text style={styles.navSubtitle}>⚡ {APP_CONFIG.DELIVERY_SLA_MINUTES} EXPRESS DELIVERY</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* ================================================== */}
      {/* 2. SCROLLABLE CHECKOUT SECTIONS                    */}
      {/* ================================================== */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery ETA Pill Banner */}
        <View style={styles.slaBanner}>
          <View style={styles.slaIconWrap}>
            <Text style={styles.slaIcon}>⚡</Text>
          </View>
          <View style={styles.slaTextWrap}>
            <Text style={styles.slaTitle}>
              Express Delivery in {APP_CONFIG.DELIVERY_SLA_MINUTES}
            </Text>
            <Text style={styles.slaSubtitle}>
              Hand-picked &amp; packed at your nearest neighborhood hub
            </Text>
          </View>
        </View>

        {/* Selected Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWithIcon}>
              <Text style={styles.cardHeaderIcon}>📍</Text>
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/address')}
              style={styles.changeActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
            >
              <Text style={styles.changeActionText}>Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressBox}>
              <View style={styles.addressTypeRow}>
                <View style={styles.addressTypeBadge}>
                  <Text style={styles.addressTypeText}>
                    {selectedAddress.type || 'HOME'}
                  </Text>
                </View>
                <Text style={styles.addressEtaText}>⚡ 10–15 MINS</Text>
              </View>

              <Text style={styles.addressStreet}>{selectedAddress.street || 'Standard Delivery Address'}</Text>
              {selectedAddress.landmark ? (
                <Text style={styles.addressLandmark}>
                  Near: {selectedAddress.landmark}
                </Text>
              ) : null}
              <Text style={styles.addressCity}>
                {[selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ')}{selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ''}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/address')}
              style={styles.addAddressBox}
              accessibilityRole="button"
              accessibilityLabel="Add delivery address"
            >
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Instructions Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleWithIcon}>
            <Text style={styles.cardHeaderIcon}>📝</Text>
            <Text style={styles.cardTitle}>Delivery Instructions</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Select quick notes for the delivery executive:
          </Text>

          {/* Quick Chips */}
          <View style={styles.chipsRow}>
            {DELIVERY_INSTRUCTION_CHIPS.map((chip) => {
              const isSelected = selectedChips.includes(chip.text);
              return (
                <TouchableOpacity
                  key={chip.id}
                  activeOpacity={0.7}
                  onPress={() => toggleChip(chip.text)}
                  style={[
                    styles.chip,
                    isSelected && styles.chipActive
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={chip.text}
                >
                  <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive
                    ]}
                  >
                    {chip.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Delivery Note Input */}
          <View style={styles.inputWrap}>
            <TextInput
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              placeholder="Add specific instructions (e.g. Call before ringing)"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              accessibilityLabel="Delivery note input"
            />
          </View>
        </View>

        {/* Order Items Preview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWithIcon}>
              <Text style={styles.cardHeaderIcon}>🛍️</Text>
              <Text style={styles.cardTitle}>
                Order Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/cart')}
              style={styles.editCartBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit cart items"
            >
              <Text style={styles.editCartText}>Edit Cart</Text>
            </TouchableOpacity>
          </View>

          {displayedItems.map((item, idx) => (
            <View
              key={item.product.id}
              style={[
                styles.itemRow,
                idx === displayedItems.length - 1 && !(!showAllItems && items.length > 2) && { borderBottomWidth: 0 }
              ]}
            >
              <Image
                source={{ uri: item.product.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE }}
                style={styles.itemThumb}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
                accessibilityLabel={item.product.name}
              />

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemUnit}>
                  {formatUnit(item.product.unit)} • Qty: {item.quantity}
                </Text>
              </View>

              <Text style={styles.itemLineTotal}>
                {formatCurrency(item.lineTotal)}
              </Text>
            </View>
          ))}

          {/* Show More Items Toggle */}
          {items.length > 2 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowAllItems(!showAllItems)}
              style={styles.viewMoreRow}
              accessibilityRole="button"
              accessibilityLabel={showAllItems ? 'Show fewer items' : `View ${items.length - 2} more items`}
            >
              <Text style={styles.viewMoreText}>
                {showAllItems ? '▲ Show less' : `▼ View ${items.length - 2} more items`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleWithIcon}>
            <Text style={styles.cardHeaderIcon}>💳</Text>
            <Text style={styles.cardTitle}>Select Payment Method</Text>
          </View>

          {/* Cash On Delivery Option */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPaymentMethod('COD')}
            style={[
              styles.paymentOption,
              paymentMethod === 'COD' && styles.paymentOptionActive
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'COD' }}
            accessibilityLabel="Cash on Delivery"
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'COD' && styles.radioCircleActive
                ]}
              >
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentTextWrap}>
                <View style={styles.paymentTitleRow}>
                  <Text style={styles.paymentEmoji}>💵</Text>
                  <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                  <View style={styles.codBadge}>
                    <Text style={styles.codBadgeText}>Popular</Text>
                  </View>
                </View>
                <Text style={styles.paymentDesc}>
                  Pay with cash or scan QR upon doorstep delivery
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Online Payment / Razorpay Option */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPaymentMethod('ONLINE')}
            style={[
              styles.paymentOption,
              paymentMethod === 'ONLINE' && styles.paymentOptionActive
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'ONLINE' }}
            accessibilityLabel="Online Payment via UPI or Cards"
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'ONLINE' && styles.radioCircleActive
                ]}
              >
                {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentTextWrap}>
                <View style={styles.paymentTitleRow}>
                  <Text style={styles.paymentEmoji}>📱</Text>
                  <Text style={styles.paymentName}>Online Payment / UPI</Text>
                </View>
                <Text style={styles.paymentDesc}>
                  Instant &amp; secure via Google Pay, PhonePe, Cards, NetBanking
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary & Bill Details Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleWithIcon}>
            <Text style={styles.cardHeaderIcon}>🧾</Text>
            <Text style={styles.cardTitle}>Bill Details</Text>
          </View>

          {/* Items Total MRP */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total (MRP)</Text>
            <Text style={styles.billValue}>
              {formatCurrency(totalMrp || subtotal + totalSavings)}
            </Text>
          </View>

          {/* Savings */}
          {totalSavings > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billSavingsLabel}>Product Savings</Text>
              <Text style={styles.billSavingsValue}>
                − {formatCurrency(totalSavings)}
              </Text>
            </View>
          )}

          {/* Subtotal */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {/* Delivery Fee */}
          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.billLabel}>Delivery Partner Fee</Text>
              {hasFreeDelivery && (
                <Text style={styles.strikethroughText}>
                  {formatCurrency(APP_CONFIG.STANDARD_DELIVERY_FEE)}
                </Text>
              )}
            </View>
            <Text style={hasFreeDelivery ? styles.billValueFree : styles.billValue}>
              {hasFreeDelivery ? 'FREE' : formatCurrency(deliveryFee)}
            </Text>
          </View>

          {/* Handling Fee */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling &amp; Packaging</Text>
            <Text style={styles.billValue}>{formatCurrency(handlingFee)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Grand Total */}
          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>To Pay</Text>
              <Text style={styles.grandTotalSubtext}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          {/* Free Delivery Status / Goal Messaging */}
          {hasFreeDelivery ? (
            <View style={styles.celebrationBanner}>
              <Text style={styles.celebrationTitle}>
                🎉 Free delivery unlocked!
              </Text>
              <Text style={styles.celebrationSubtitle}>
                You saved {formatCurrency(APP_CONFIG.STANDARD_DELIVERY_FEE)} on delivery!
              </Text>
            </View>
          ) : amountToFreeDelivery > 0 ? (
            <View style={styles.deliveryGoalBanner}>
              <Text style={styles.deliveryGoalTitle}>
                🛵 Add {formatCurrency(amountToFreeDelivery)} more for FREE delivery
              </Text>
              <Text style={styles.deliveryGoalSubtitle}>
                Orders above {formatCurrency(APP_CONFIG.FREE_DELIVERY_THRESHOLD)} ship for free
              </Text>
            </View>
          ) : null}
        </View>

        {/* Security & Cancellation Policy Card */}
        <View style={styles.trustCard}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🛡️</Text>
            <View style={styles.trustTextWrap}>
              <Text style={styles.trustTitle}>100% Genuine &amp; Fresh</Text>
              <Text style={styles.trustSubtitle}>
                Instant replacement or full refund if any item is not fresh
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 3. STICKY BOTTOM PAYMENT CTA                       */}
      {/* ================================================== */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(12, insets.bottom + 4) }
        ]}
      >
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.bottomPriceValue}>
            {formatCurrency(totalAmount)}
          </Text>
          <View style={styles.bottomPayMethodPill}>
            <Text style={styles.bottomPayMethodText}>
              {paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          style={[
            styles.placeOrderBtn,
            isSubmitting && { opacity: 0.7 }
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Place Order for ${formatCurrency(totalAmount)}`}
        >
          <Text style={styles.placeOrderText}>
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </Text>
          {!isSubmitting && <Text style={styles.placeOrderArrow}>⚡</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },

  /* Navigation Bar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border
  },
  backArrow: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    marginTop: -2
  },
  navTitleWrap: {
    flex: 1,
    alignItems: 'center'
  },
  navTitle: {
    fontSize: typography.sizes.base + 2,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  navSubtitle: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: '#059669',
    letterSpacing: 0.6,
    marginTop: 1
  },

  /* Scroll Content */
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl
  },

  /* SLA Banner */
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm
  },
  slaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slaIcon: {
    fontSize: 20
  },
  slaTextWrap: {
    flex: 1
  },
  slaTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: '#FFFFFF'
  },
  slaSubtitle: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 1
  },

  /* Cards */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  cardHeaderIcon: {
    fontSize: 16
  },
  cardTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  changeActionBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  changeActionText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },

  /* Address Box */
  addressBox: {
    paddingTop: 2
  },
  addressTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  addressTypeBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: '#065F46'
  },
  addressEtaText: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: '#059669'
  },
  addressStreet: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 20
  },
  addressLandmark: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  addressCity: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  addAddressBox: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: '#F0FDF4'
  },
  addAddressText: {
    color: colors.primaryDark,
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm
  },

  /* Delivery Instruction Chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669'
  },
  chipEmoji: {
    fontSize: 13
  },
  chipText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  chipTextActive: {
    color: '#065F46',
    fontWeight: typography.weights.bold
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  textInput: {
    height: 38,
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    // @ts-ignore
    outlineWidth: 0
  },

  /* Items Preview */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: spacing.sm
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  itemUnit: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  itemLineTotal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  viewMoreRow: {
    paddingTop: spacing.sm,
    alignItems: 'center'
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  editCartBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  editCartText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },

  /* Payment Options */
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginTop: spacing.xs
  },
  paymentOptionActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5'
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleActive: {
    borderColor: '#059669'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669'
  },
  paymentTextWrap: {
    flex: 1
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  paymentEmoji: {
    fontSize: 15
  },
  paymentName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  codBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4
  },
  codBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#92400E'
  },
  paymentDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* Bill Details */
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5
  },
  billLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium
  },
  billValue: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold
  },
  billSavingsLabel: {
    fontSize: typography.sizes.xs + 1,
    color: '#059669',
    fontWeight: typography.weights.semibold
  },
  billSavingsValue: {
    fontSize: typography.sizes.xs + 1,
    color: '#059669',
    fontWeight: typography.weights.extrabold
  },
  strikethroughText: {
    fontSize: 10,
    color: colors.priceStrikethrough,
    textDecorationLine: 'line-through'
  },
  billValueFree: {
    fontSize: typography.sizes.xs + 1,
    color: '#059669',
    fontWeight: typography.weights.extrabold
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  grandTotalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  grandTotalSubtext: {
    fontSize: 10,
    color: colors.textMuted
  },
  grandTotalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.4
  },
  celebrationBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center'
  },
  celebrationTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#065F46'
  },
  celebrationSubtitle: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1,
    fontWeight: typography.weights.medium
  },
  deliveryGoalBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center'
  },
  deliveryGoalTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#065F46'
  },
  deliveryGoalSubtitle: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1
  },

  /* Trust Card */
  trustCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    ...shadows.sm
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  trustIcon: {
    fontSize: 20
  },
  trustTextWrap: {
    flex: 1
  },
  trustTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  trustSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },

  /* Sticky Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg
  },
  bottomPriceInfo: {
    flex: 1,
    paddingRight: spacing.sm
  },
  bottomPriceLabel: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: colors.textMuted,
    letterSpacing: 0.6
  },
  bottomPriceValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.4
  },
  bottomPayMethodPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 2
  },
  bottomPayMethodText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  placeOrderBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm + 1
  },
  placeOrderArrow: {
    fontSize: 14
  }
});
