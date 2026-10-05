/**
 * Grocery Choice Customer App - Cart Screen
 * Premium, production-quality quick-commerce cart.
 * Accurate CartContext totals, dynamic ₹199 free-delivery motivator,
 * address preview, optimized thumbnails, and sticky checkout CTA.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/services/cartContext';
import { formatCurrency, formatUnit } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';
import { storageService } from '@/storage/storage';
import { Address } from '@/types';

export default function CartScreen() {
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
    updateQuantity,
    removeItem,
    clearCart
  } = useCart();

  const [savedAddress, setSavedAddress] = useState<Address | null>(null);

  // Load primary delivery address
  useEffect(() => {
    let isMounted = true;
    async function loadAddress() {
      try {
        const addresses = await storageService.getSavedAddresses();
        if (isMounted && addresses && Array.isArray(addresses) && addresses.length > 0) {
          const primary = addresses.find((a) => a.isDefault) || addresses[0];
          setSavedAddress(primary);
        }
      } catch {
        // Fallback
      }
    }
    loadAddress();
    return () => {
      isMounted = false;
    };
  }, []);

  // Free delivery progress calculation based on APP_CONFIG.FREE_DELIVERY_THRESHOLD (199)
  const freeDeliveryThreshold = APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeDeliveryThreshold) * 100)
  );

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🛒"
            title="Your Cart is Empty"
            description="Explore fresh groceries, daily dairy essentials, fruits, and snacks to fill your cart."
            actionLabel="Start Shopping"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* ================================================== */}
      {/* 1. TOP HEADER                                      */}
      {/* ================================================== */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Text style={styles.navTitle}>My Cart</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountBadgeText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearCart}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear cart"
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================================================== */}
      {/* 2. SCROLLABLE CART CONTENT                         */}
      {/* ================================================== */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address Card */}
        {savedAddress ? (
          <View style={styles.addressCard}>
            <View style={styles.addressCardLeft}>
              <View style={styles.addressIconWrap}>
                <Text style={styles.addressEmoji}>📍</Text>
              </View>
              <View style={styles.addressTextWrap}>
                <View style={styles.addressTypeRow}>
                  <Text style={styles.addressTypeBadge}>
                    {savedAddress.type || 'HOME'}
                  </Text>
                  <Text style={styles.addressEta}>⚡ 10–15 MINS</Text>
                </View>
                <Text style={styles.addressLine} numberOfLines={1}>
                  {[savedAddress.street, savedAddress.landmark, savedAddress.city]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/address')}
              style={styles.changeAddressBtn}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
            >
              <Text style={styles.changeAddressText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/address')}
            style={styles.addAddressCard}
            accessibilityRole="button"
            accessibilityLabel="Add delivery address"
          >
            <View style={styles.addAddressLeft}>
              <Text style={styles.addAddressEmoji}>📍</Text>
              <View>
                <Text style={styles.addAddressTitle}>Add Delivery Address</Text>
                <Text style={styles.addAddressSubtitle}>
                  Set your location to confirm 10–15 mins delivery
                </Text>
              </View>
            </View>
            <Text style={styles.addAddressActionText}>+ Add</Text>
          </TouchableOpacity>
        )}

        {/* Dynamic Free Delivery Progress Card */}
        <View style={styles.freeDeliveryCard}>
          <View style={styles.freeDeliveryTop}>
            <View style={styles.freeDeliveryIconWrap}>
              <Text style={styles.freeDeliveryEmoji}>🛵</Text>
            </View>
            <View style={styles.freeDeliveryTextWrap}>
              {isFreeDelivery ? (
                <>
                  <Text style={styles.freeDeliveryTitleUnlocked}>
                    🎉 Free delivery unlocked!
                  </Text>
                  <Text style={styles.freeDeliverySubtext}>
                    Zero delivery charge applied on this order
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.freeDeliveryTitle}>
                    Add <Text style={styles.freeDeliveryBold}>{formatCurrency(amountToFreeDelivery)}</Text> more for FREE delivery
                  </Text>
                  <Text style={styles.freeDeliverySubtext}>
                    Orders above ₹{freeDeliveryThreshold} ship for free
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` }
              ]}
            />
          </View>
        </View>

        {/* Review Items Card */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.sectionTitle}>Review Items ({itemCount})</Text>
            <Text style={styles.deliveryBadge}>⚡ 10–15 MINS DISPATCH</Text>
          </View>

          {items.map((item, index) => {
            const hasDiscount =
              item.product.mrp > item.product.sellingPrice;
            const itemSavings = hasDiscount
              ? (item.product.mrp - item.product.sellingPrice) * item.quantity
              : 0;

            return (
              <View
                key={item.product.id}
                style={[
                  styles.itemRow,
                  index === items.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                {/* Product Thumbnail */}
                <Image
                  source={{
                    uri: item.product.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE
                  }}
                  style={styles.itemImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={150}
                  accessibilityLabel={item.product.name}
                />

                {/* Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.unitPill}>
                    <Text style={styles.unitPillText}>
                      {formatUnit(item.product.unit)}
                    </Text>
                  </View>

                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemSellingPrice}>
                      {formatCurrency(item.product.sellingPrice)}
                    </Text>
                    {hasDiscount && (
                      <Text style={styles.itemMrp}>
                        {formatCurrency(item.product.mrp)}
                      </Text>
                    )}
                    {itemSavings > 0 && (
                      <View style={styles.savingsTag}>
                        <Text style={styles.savingsTagText}>
                          Save {formatCurrency(itemSavings)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Stepper & Line Total */}
                <View style={styles.itemActions}>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={styles.stepperBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease quantity"
                    >
                      <Text style={styles.stepperMinusText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.stepperCountWrap}>
                      <Text style={styles.stepperCountText}>{item.quantity}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={styles.stepperBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase quantity"
                    >
                      <Text style={styles.stepperPlusText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.lineTotalText}>
                    {formatCurrency(item.lineTotal)}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => removeItem(item.product.id)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.product.name} from cart`}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bill Summary Card */}
        <View style={styles.billCard}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>

          {/* Items MRP Total */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total (MRP)</Text>
            <Text style={styles.billValue}>
              {formatCurrency(totalMrp || subtotal + totalSavings)}
            </Text>
          </View>

          {/* Product Savings */}
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
              {isFreeDelivery && (
                <Text style={styles.strikethroughText}>
                  {formatCurrency(APP_CONFIG.STANDARD_DELIVERY_FEE)}
                </Text>
              )}
            </View>
            <Text style={isFreeDelivery ? styles.billValueFree : styles.billValue}>
              {isFreeDelivery ? 'FREE' : formatCurrency(deliveryFee)}
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
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalSubtext}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          {/* Celebratory Savings Banner */}
          {totalSavings > 0 && (
            <View style={styles.celebrationBanner}>
              <Text style={styles.celebrationText}>
                🥳 You are saving {formatCurrency(totalSavings)} on this order!
              </Text>
            </View>
          )}
        </View>

        {/* Cancellation & Trust Policy Card */}
        <View style={styles.policyCard}>
          <View style={styles.policyRow}>
            <Text style={styles.policyIcon}>🛡️</Text>
            <View style={styles.policyTextWrap}>
              <Text style={styles.policyTitle}>Cancellation &amp; Quality Guarantee</Text>
              <Text style={styles.policyDescription}>
                Orders once dispatched from our local hub cannot be cancelled. In case of any freshness or packaging defect, 100% instant refund or replacement is guaranteed.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 3. STICKY BOTTOM CHECKOUT BAR                      */}
      {/* ================================================== */}
      <View
        style={[
          styles.checkoutBar,
          { paddingBottom: Math.max(12, insets.bottom + 4) }
        ]}
      >
        <View style={styles.checkoutPriceInfo}>
          <Text style={styles.checkoutTotalLabel}>TO PAY</Text>
          <Text style={styles.checkoutTotalPrice}>
            {formatCurrency(totalAmount)}
          </Text>
          {totalSavings > 0 && (
            <Text style={styles.checkoutSavingsText}>
              Saved {formatCurrency(totalSavings)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/checkout')}
          style={styles.checkoutBtn}
          accessibilityRole="button"
          accessibilityLabel={`Proceed to Checkout, total ${formatCurrency(totalAmount)}`}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutBtnArrow}>→</Text>
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

  /* Top Header */
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
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  navTitle: {
    fontSize: typography.sizes.base + 2,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  itemCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  itemCountBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#065F46'
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#DC2626'
  },

  /* Scrollable Content */
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl
  },

  /* Delivery Address Card */
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm
  },
  addressCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  addressEmoji: {
    fontSize: 16
  },
  addressTextWrap: {
    flex: 1
  },
  addressTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  addressTypeBadge: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  addressEta: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: '#059669'
  },
  addressLine: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium
  },
  changeAddressBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  changeAddressText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },

  /* Add Address Card */
  addAddressCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm
  },
  addAddressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1
  },
  addAddressEmoji: {
    fontSize: 20
  },
  addAddressTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.extrabold,
    color: '#92400E'
  },
  addAddressSubtitle: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1
  },
  addAddressActionText: {
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
    color: '#92400E',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },

  /* Free Delivery Goal Card */
  freeDeliveryCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  freeDeliveryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  freeDeliveryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  freeDeliveryEmoji: {
    fontSize: 16
  },
  freeDeliveryTextWrap: {
    flex: 1
  },
  freeDeliveryTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#065F46'
  },
  freeDeliveryBold: {
    fontWeight: typography.weights.extrabold,
    color: '#047857'
  },
  freeDeliveryTitleUnlocked: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.extrabold,
    color: '#065F46'
  },
  freeDeliverySubtext: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3
  },

  /* Review Items Card */
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  sectionTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  deliveryBadge: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: spacing.sm
  },
  itemImage: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itemDetails: {
    flex: 1,
    paddingRight: 4
  },
  itemName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 18
  },
  unitPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 3,
    marginBottom: 4
  },
  unitPillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  itemSellingPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  itemMrp: {
    fontSize: 11,
    color: colors.priceStrikethrough,
    textDecorationLine: 'line-through'
  },
  savingsTag: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3
  },
  savingsTagText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#059669'
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#047857',
    overflow: 'hidden'
  },
  stepperBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperMinusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.weights.extrabold
  },
  stepperPlusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.weights.extrabold
  },
  stepperCountWrap: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.weights.extrabold
  },
  lineTotalText: {
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    marginTop: 4
  },
  removeBtn: {
    marginTop: 2
  },
  removeBtnText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: typography.weights.semibold
  },

  /* Bill Summary Card */
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
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
    fontSize: typography.sizes.sm + 1,
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
  celebrationText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#065F46'
  },

  /* Policy Card */
  policyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    ...shadows.sm
  },
  policyRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  policyIcon: {
    fontSize: 18
  },
  policyTextWrap: {
    flex: 1
  },
  policyTitle: {
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  policyDescription: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2
  },

  /* Sticky Bottom Checkout Bar */
  checkoutBar: {
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
  checkoutPriceInfo: {
    flex: 1,
    paddingRight: spacing.sm
  },
  checkoutTotalLabel: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: colors.textMuted,
    letterSpacing: 0.6
  },
  checkoutTotalPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.4
  },
  checkoutSavingsText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#059669',
    marginTop: 1
  },
  checkoutBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm + 1
  },
  checkoutBtnArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.bold
  }
});
