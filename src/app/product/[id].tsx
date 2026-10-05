/**
 * Grocery Choice Customer App - Product Details Screen
 * Premium, production-quality quick-commerce product details.
 * High-performance, mobile-first design with expo-image caching.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product } from '@/types';
import { productsApi } from '@/api/products';
import { useCart } from '@/services/cartContext';
import { formatCurrency, formatUnit } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getItemQuantity, addItem, updateQuantity, itemCount, subtotal } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load product from /api/products/{id}
  const loadProduct = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getById(Number(id));
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Product details not available');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Loading State
  if (isLoading) {
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
          <Text style={styles.navTitle}>Loading Product...</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.skeletonImageCard}>
            <View style={styles.skeletonInnerImage} />
          </View>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineMedium} />
        </View>
      </SafeAreaView>
    );
  }

  // Error / Not Found State
  if (error || !product) {
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
          <Text style={styles.navTitle}>Product Details</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.errorContainer}>
          <EmptyState
            icon="🔎"
            title="Product not found"
            description={error || 'The requested product could not be located in our catalog.'}
            actionLabel="Back to Home"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.inStock || product.stockQuantity <= 0;
  const savingsAmount = Math.max(0, product.mrp - product.sellingPrice);
  const freeDeliveryThreshold = APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const isFreeDeliveryUnlocked = subtotal >= freeDeliveryThreshold;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, 1);
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    if (quantity === 0) {
      addItem(product, 1);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

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

        <View style={styles.navTitleWrapper}>
          <Text style={styles.navCategoryTag} numberOfLines={1}>
            {product.categoryName ? product.categoryName.toUpperCase() : 'GROCERY CHOICE'}
          </Text>
          <Text style={styles.navTitle} numberOfLines={1}>
            {product.name}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/cart')}
          style={styles.cartButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart with ${itemCount} items`}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ================================================== */}
      {/* 2. SCROLLABLE PRODUCT DETAILS                      */}
      {/* ================================================== */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Product Image Card */}
        <View style={styles.imageCard}>
          <Image
            source={{
              uri: !imageError && product.imageUrl ? product.imageUrl : APP_CONFIG.FALLBACK_PRODUCT_IMAGE
            }}
            style={styles.productImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            onError={() => setImageError(true)}
            accessibilityLabel={product.name}
          />

          {/* Discount Pill */}
          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discountPercentage}% OFF</Text>
            </View>
          )}

          {/* Stock Status Pill */}
          <View
            style={[
              styles.stockBadge,
              isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn
            ]}
          >
            <View
              style={[
                styles.stockDot,
                isOutOfStock ? styles.stockDotOut : styles.stockDotIn
              ]}
            />
            <Text
              style={[
                styles.stockText,
                isOutOfStock ? styles.stockTextOut : styles.stockTextIn
              ]}
            >
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
          </View>

          {/* Delivery SLA Badge */}
          <View style={styles.slaBadge}>
            <Text style={styles.slaText}>⚡ {APP_CONFIG.DELIVERY_SLA_MINUTES} DELIVERY</Text>
          </View>
        </View>

        {/* Product Title & Pricing Card */}
        <View style={styles.detailsCard}>
          <View style={styles.categoryAndUnitRow}>
            <Text style={styles.categoryBreadcrumb}>
              {product.categoryName || 'Essentials'}
            </Text>
            <View style={styles.unitPill}>
              <Text style={styles.unitPillText}>{formatUnit(product.unit)}</Text>
            </View>
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>{formatCurrency(product.sellingPrice)}</Text>
            {product.mrp > product.sellingPrice && (
              <Text style={styles.mrpText}>{formatCurrency(product.mrp)}</Text>
            )}
            {savingsAmount > 0 && (
              <View style={styles.savingsPill}>
                <Text style={styles.savingsText}>
                  Save {formatCurrency(savingsAmount)} ({product.discountPercentage}% OFF)
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.taxNotice}>Inclusive of all taxes</Text>

          {/* Out of Stock Alert Banner */}
          {isOutOfStock && (
            <View style={styles.outOfStockAlert}>
              <Text style={styles.outOfStockAlertText}>
                ⚠️ Currently out of stock. We are restocking fresh units shortly.
              </Text>
            </View>
          )}
        </View>

        {/* Delivery & Service Guarantees Card */}
        <View style={styles.guaranteeCard}>
          {/* 10-15 Mins SLA */}
          <View style={styles.guaranteeItem}>
            <View style={styles.guaranteeIconWrap}>
              <Text style={styles.guaranteeEmoji}>⚡</Text>
            </View>
            <View style={styles.guaranteeTextWrapper}>
              <Text style={styles.guaranteeTitle}>
                {APP_CONFIG.DELIVERY_SLA_MINUTES} Express Delivery
              </Text>
              <Text style={styles.guaranteeSubtitle}>
                Instant dispatch from your local neighborhood hub
              </Text>
            </View>
          </View>

          <View style={styles.guaranteeDivider} />

          {/* Quality Assurance */}
          <View style={styles.guaranteeItem}>
            <View style={styles.guaranteeIconWrap}>
              <Text style={styles.guaranteeEmoji}>🛡️</Text>
            </View>
            <View style={styles.guaranteeTextWrapper}>
              <Text style={styles.guaranteeTitle}>100% Quality &amp; Freshness</Text>
              <Text style={styles.guaranteeSubtitle}>
                Hand-picked, hygienic, and temperature-controlled transit
              </Text>
            </View>
          </View>

          <View style={styles.guaranteeDivider} />

          {/* Free Delivery Status */}
          <View style={styles.guaranteeItem}>
            <View style={styles.guaranteeIconWrap}>
              <Text style={styles.guaranteeEmoji}>🛵</Text>
            </View>
            <View style={styles.guaranteeTextWrapper}>
              {isFreeDeliveryUnlocked ? (
                <Text style={styles.guaranteeTitleGreen}>
                  🎉 Free Delivery Unlocked!
                </Text>
              ) : subtotal === 0 ? (
                <Text style={styles.guaranteeTitle}>
                  Free Delivery on orders above ₹{freeDeliveryThreshold}
                </Text>
              ) : (
                <Text style={styles.guaranteeTitle}>
                  Add ₹{amountToFreeDelivery} more for FREE delivery
                </Text>
              )}
              <Text style={styles.guaranteeSubtitle}>
                Doorstep delivery directly to your home
              </Text>
            </View>
          </View>
        </View>

        {/* Product Information / Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionHeader}>About This Product</Text>
          <Text style={styles.descriptionText}>
            {product.description ||
              'Carefully selected and sourced direct from trusted partners. Stored in hygienic, optimal temperature conditions to preserve peak taste, nutrition, and freshness.'}
          </Text>

          {/* Product Attributes Grid */}
          <View style={styles.attributesGrid}>
            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Pack Size</Text>
              <Text style={styles.attributeValue}>{formatUnit(product.unit)}</Text>
            </View>

            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Category</Text>
              <Text style={styles.attributeValue}>{product.categoryName || 'General'}</Text>
            </View>

            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Availability</Text>
              <Text style={[styles.attributeValue, { color: isOutOfStock ? '#DC2626' : '#059669' }]}>
                {isOutOfStock ? 'Sold Out' : 'Available'}
              </Text>
            </View>

            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Dispatch</Text>
              <Text style={styles.attributeValue}>Direct Hub</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 3. STICKY BOTTOM PURCHASE BAR                      */}
      {/* ================================================== */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(12, insets.bottom + 4) }
        ]}
      >
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>TOTAL PRICE</Text>
          <Text style={styles.bottomPriceValue}>
            {formatCurrency(product.sellingPrice * (quantity > 0 ? quantity : 1))}
          </Text>
          <Text style={styles.bottomPriceSubtext}>
            {quantity > 1 ? `(${quantity} × ${formatCurrency(product.sellingPrice)})` : 'Inclusive of all taxes'}
          </Text>
        </View>

        {isOutOfStock ? (
          <View style={styles.soldOutButton}>
            <Text style={styles.soldOutButtonText}>SOLD OUT</Text>
          </View>
        ) : quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleAddToCart}
            style={styles.addToCartButton}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Text style={styles.addToCartIcon}>🛍️</Text>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecrement}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Text style={styles.stepperMinusText}>−</Text>
            </TouchableOpacity>

            <View style={styles.stepperValueBox}>
              <Text style={styles.stepperValueText}>{quantity}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIncrement}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Text style={styles.stepperPlusText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
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
  navTitleWrapper: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    alignItems: 'center'
  },
  navCategoryTag: {
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
    letterSpacing: 0.6
  },
  navTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 1
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative'
  },
  cartIcon: {
    fontSize: 18
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#059669',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.extrabold
  },

  /* Scrollable Content */
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },

  /* Large Product Image Card */
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
    ...shadows.sm
  },
  productImage: {
    width: '85%',
    height: '85%'
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    ...shadows.sm
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.4
  },
  stockBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1
  },
  stockBadgeIn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  stockDotIn: {
    backgroundColor: '#10B981'
  },
  stockDotOut: {
    backgroundColor: '#EF4444'
  },
  stockText: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold
  },
  stockTextIn: {
    color: '#065F46'
  },
  stockTextOut: {
    color: '#991B1B'
  },
  slaBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: '#064E3B',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#047857'
  },
  slaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.5
  },

  /* Product Details Card */
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  categoryAndUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  categoryBreadcrumb: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  unitPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  productTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: spacing.sm
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 4
  },
  sellingPrice: {
    fontSize: 26,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  mrpText: {
    fontSize: typography.sizes.base,
    color: colors.priceStrikethrough,
    textDecorationLine: 'line-through'
  },
  savingsPill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  savingsText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#059669'
  },
  taxNotice: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  outOfStockAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm
  },
  outOfStockAlertText: {
    color: '#B91C1C',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    lineHeight: 16
  },

  /* Guarantee Card */
  guaranteeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  guaranteeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  guaranteeEmoji: {
    fontSize: 18
  },
  guaranteeTextWrapper: {
    flex: 1
  },
  guaranteeTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  guaranteeTitleGreen: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#059669'
  },
  guaranteeSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  guaranteeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm
  },

  /* Description Card */
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    ...shadows.sm
  },
  sectionHeader: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  descriptionText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.md
  },
  attributeItem: {
    width: (SCREEN_WIDTH - 32 - 32 - 12) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  attributeLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  attributeValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2
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
  bottomPriceSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  soldOutButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  soldOutButtonText: {
    color: colors.textMuted,
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm
  },
  addToCartButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md
  },
  addToCartIcon: {
    fontSize: 16
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm + 1
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#047857',
    overflow: 'hidden',
    ...shadows.md
  },
  stepperButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperMinusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: typography.weights.extrabold
  },
  stepperPlusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: typography.weights.extrabold
  },
  stepperValueBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  stepperValueText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold
  },

  /* Skeletons */
  loadingContainer: {
    padding: spacing.md
  },
  skeletonImageCard: {
    height: 260,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  skeletonInnerImage: {
    width: '60%',
    height: '60%',
    backgroundColor: '#E2E8F0',
    borderRadius: radius.md
  },
  skeletonLineLong: {
    height: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: spacing.sm,
    width: '85%'
  },
  skeletonLineShort: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: spacing.sm,
    width: '40%'
  },
  skeletonLineMedium: {
    height: 28,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    width: '60%'
  },
  errorContainer: {
    flex: 1,
    paddingVertical: spacing.xxl
  }
});
