/**
 * Grocery Choice Customer App - Cart Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCart } from '@/services/cartContext';
import { formatCurrency, formatUnit } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    totalSavings,
    deliveryFee,
    handlingFee,
    totalAmount,
    isFreeDelivery,
    amountToFreeDelivery,
    updateQuantity,
    clearCart
  } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="My Cart" />
        <EmptyState
          icon="🛒"
          title="Your Cart is Empty"
          description="Explore fresh groceries, daily dairy essentials, fruits, and snacks to fill your cart."
          actionLabel="Start Shopping"
          onAction={() => router.push('/(tabs)')}
          style={styles.emptyContainer}
        />
      </SafeAreaView>
    );
  }

  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / APP_CONFIG.FREE_DELIVERY_THRESHOLD) * 100)
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header
        title="My Cart"
        subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        rightAction={
          <TouchableOpacity onPress={clearCart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Quick Delivery SLA Banner */}
        <View style={styles.slaBanner}>
          <Text style={styles.slaIcon}>⚡</Text>
          <View style={styles.slaTextWrapper}>
            <Text style={styles.slaTitle}>Delivery in {APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
            <Text style={styles.slaSubtitle}>Order now to receive fastest dispatch</Text>
          </View>
        </View>

        {/* 2. Free Delivery Goal Bar */}
        <View style={styles.deliveryGoalCard}>
          {isFreeDelivery ? (
            <Text style={styles.goalSuccessText}>🎉 You unlocked FREE delivery!</Text>
          ) : (
            <Text style={styles.goalText}>
              Add <Text style={styles.goalHighlight}>{formatCurrency(amountToFreeDelivery)}</Text> more
              for FREE delivery
            </Text>
          )}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${freeDeliveryProgress}%` }]} />
          </View>
        </View>

        {/* 3. Itemized List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeader}>Review Items</Text>
          {items.map((item) => (
            <View key={item.product.id} style={styles.itemRow}>
              <Image
                source={{ uri: item.product.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE }}
                style={styles.itemThumbnail}
                resizeMode="contain"
              />

              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemUnit}>{formatUnit(item.product.unit)}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.product.sellingPrice)}</Text>
              </View>

              <View style={styles.itemAction}>
                <QuantitySelector
                  quantity={item.quantity}
                  onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
                  onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)}
                  size="sm"
                />
                <Text style={styles.itemLineTotal}>{formatCurrency(item.lineTotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 4. Bill Details Card */}
        <View style={styles.billCard}>
          <Text style={styles.sectionHeader}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {totalSavings > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabelSavings}>Product Savings</Text>
              <Text style={styles.billValueSavings}>- {formatCurrency(totalSavings)}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={isFreeDelivery ? styles.billValueFree : styles.billValue}>
              {isFreeDelivery ? 'FREE' : formatCurrency(deliveryFee)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <Text style={styles.billValue}>{formatCurrency(handlingFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>

          {totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Text style={styles.savingsBannerText}>
                🥳 You are saving {formatCurrency(totalSavings)} on this order!
              </Text>
            </View>
          )}
        </View>

        {/* 5. Cancellation Policy */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyDescription}>
            Orders once packed or dispatched cannot be cancelled. In case of issues with quality or
            packaging, instantaneous refund is supported.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. Bottom Sticky Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutPriceInfo}>
          <Text style={styles.checkoutTotalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.checkoutTotalPrice}>{formatCurrency(totalAmount)}</Text>
        </View>

        <Button
          title="Proceed to Checkout →"
          onPress={() => router.push('/checkout')}
          size="lg"
          style={styles.checkoutButton}
        />
      </View>
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
  clearText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold
  },
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  slaIcon: {
    fontSize: 22,
    marginRight: spacing.sm
  },
  slaTextWrapper: {
    flex: 1
  },
  slaTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  slaSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1
  },
  deliveryGoalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  goalText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  goalHighlight: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },
  goalSuccessText: {
    fontSize: typography.sizes.xs,
    color: colors.textSuccess,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3
  },
  itemsSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  sectionHeader: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  itemThumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHover
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: spacing.sm
  },
  itemName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  itemUnit: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  itemPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2
  },
  itemAction: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  itemLineTotal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: 4
  },
  billCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5
  },
  billLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold
  },
  billLabelSavings: {
    fontSize: typography.sizes.sm,
    color: colors.textSuccess,
    fontWeight: typography.weights.semibold
  },
  billValueSavings: {
    fontSize: typography.sizes.sm,
    color: colors.textSuccess,
    fontWeight: typography.weights.bold
  },
  billValueFree: {
    fontSize: typography.sizes.sm,
    color: colors.textSuccess,
    fontWeight: typography.weights.bold
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  totalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  savingsBanner: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginTop: spacing.sm,
    alignItems: 'center'
  },
  savingsBannerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  policyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md
  },
  policyTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  policyDescription: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 16
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg
  },
  checkoutPriceInfo: {
    flexDirection: 'column'
  },
  checkoutTotalLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  checkoutTotalPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  checkoutButton: {
    minWidth: 180
  }
});
