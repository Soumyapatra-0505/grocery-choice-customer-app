/**
 * Grocery Choice Customer App - Home Screen
 * Premium, production-quality quick-commerce home screen.
 * Clean, lightweight, emerald-branded, mobile-first.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  AccessibilityInfo
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { APP_CONFIG } from '@/constants/config';
import { ProductCard } from '@/components/ui/ProductCard';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/services/cartContext';
import { storageService } from '@/storage/storage';
import { formatCurrency } from '@/utils/formatters';
import { Address, Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate exact 2-column card width with 16px screen padding and 12px gap
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);

/**
 * Returns a high-context emoji fallback for any category name
 */
function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('fruit') || lower.includes('apple') || lower.includes('mango')) return '🍎';
  if (lower.includes('veg') || lower.includes('green') || lower.includes('salad')) return '🥦';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('butter')) return '🥛';
  if (lower.includes('snack') || lower.includes('munch') || lower.includes('chip') || lower.includes('biscuit')) return '🥨';
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('soda')) return '🧃';
  if (lower.includes('atta') || lower.includes('rice') || lower.includes('dal') || lower.includes('grain')) return '🌾';
  if (lower.includes('instant') || lower.includes('noodle') || lower.includes('pasta') || lower.includes('maggi')) return '🍜';
  if (lower.includes('tea') || lower.includes('coffee')) return '☕';
  if (lower.includes('clean') || lower.includes('detergent') || lower.includes('wash')) return '🧼';
  if (lower.includes('personal') || lower.includes('care') || lower.includes('soap') || lower.includes('shampoo')) return '🧴';
  if (lower.includes('bakery') || lower.includes('bread') || lower.includes('cake')) return '🍞';
  if (lower.includes('masala') || lower.includes('spice') || lower.includes('oil')) return '🧂';
  if (lower.includes('meat') || lower.includes('chicken') || lower.includes('egg') || lower.includes('fish')) return '🥚';
  return '🛍️';
}

export default function HomeScreen() {
  const router = useRouter();
  const { categories, isLoading: isCategoriesLoading, error: categoriesError, refresh: refreshCategories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const { products, isLoading: isProductsLoading, error: productsError, refresh: refreshProducts } = useProducts(selectedCategoryId);
  const { itemCount, subtotal } = useCart();
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load active delivery address from persistent storage
  const loadAddress = useCallback(async () => {
    try {
      const active = await storageService.getActiveAddress();
      if (active) {
        setActiveAddress(active);
      } else {
        const saved = await storageService.getSavedAddresses();
        if (saved && saved.length > 0) {
          const defaultAddr = saved.find((a) => a.isDefault) || saved[0];
          setActiveAddress(defaultAddr);
        }
      }
    } catch {
      // Keep null fallback
    }
  }, []);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshCategories(), refreshProducts(), loadAddress()]);
    setRefreshing(false);
  };

  const handleCategoryPress = (cat?: Category) => {
    if (!cat) {
      setSelectedCategoryId(undefined);
    } else {
      setSelectedCategoryId(cat.id);
    }
  };

  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'Popular Near You';
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return cat ? cat.name : 'Products';
  }, [selectedCategoryId, categories]);

  // Formatted address summary for header
  const addressLabel = useMemo(() => {
    if (!activeAddress) return 'Add delivery address';
    const prefix = activeAddress.type ? `${activeAddress.type} • ` : '';
    const street = activeAddress.street || activeAddress.city || 'Home';
    const full = `${prefix}${street}`;
    return full.length > 26 ? `${full.slice(0, 24)}...` : full;
  }, [activeAddress]);

  // Free delivery calculations
  const freeDeliveryThreshold = APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const isFreeDeliveryUnlocked = subtotal >= freeDeliveryThreshold;
  const amountRemaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.max(0, (subtotal / freeDeliveryThreshold) * 100));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* ================================================== */}
      {/* 1. TOP DELIVERY HEADER                             */}
      {/* ================================================== */}
      <View style={styles.header}>
        {/* Top Row: Brand & Delivery Address Selector */}
        <View style={styles.headerTopRow}>
          {/* Grocery Choice Logo & Title */}
          <View style={styles.brandBadge}>
            <View style={styles.brandIconCircle}>
              <Text style={styles.brandIconLeaf}>🌿</Text>
            </View>
            <View>
              <Text style={styles.brandTitleText}>{APP_CONFIG.APP_NAME}</Text>
              <Text style={styles.brandTagline}>Quick Mart</Text>
            </View>
          </View>

          {/* Delivery Address Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/address')}
            style={styles.addressPill}
            accessibilityRole="button"
            accessibilityLabel={`Deliver to ${addressLabel}, tap to change address`}
          >
            <Text style={styles.addressPinIcon}>📍</Text>
            <View style={styles.addressTextWrapper}>
              <Text style={styles.deliverToCaption}>DELIVER TO</Text>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {addressLabel}
              </Text>
            </View>
            <Text style={styles.addressChevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Second Row: Prominent Delivery Promise SLA */}
        <View style={styles.deliverySlaBanner}>
          <View style={styles.deliverySlaLeft}>
            <View style={styles.lightningIconWrap}>
              <Text style={styles.lightningIcon}>⚡</Text>
            </View>
            <Text style={styles.deliverySlaText}>
              {APP_CONFIG.DELIVERY_SLA_MINUTES} DELIVERY
            </Text>
          </View>
          <View style={styles.hubStatusPill}>
            <View style={styles.liveDot} />
            <Text style={styles.hubStatusText}>Live Hub</Text>
          </View>
        </View>

        {/* ================================================== */}
        {/* 2. SEARCH BAR                                      */}
        {/* ================================================== */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/search')}
          style={styles.searchBar}
          accessibilityRole="search"
          accessibilityLabel="Search groceries, fruits, milk, and essentials"
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search groceries, fruits, milk &amp; more
          </Text>
          <View style={styles.searchMicPill}>
            <Text style={styles.searchMicIcon}>🎙️</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: itemCount > 0 ? 100 : 32 }
        ]}
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
        {/* ================================================== */}
        {/* 3. HERO / PROMOTIONAL BANNER                       */}
        {/* ================================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>FRESH DAILY</Text>
            </View>
            <Text style={styles.heroTitle}>Fresh groceries, delivered fast</Text>
            <Text style={styles.heroSubtitle}>
              Everyday essentials at everyday prices
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (selectedCategoryId) {
                  setSelectedCategoryId(undefined);
                } else {
                  router.push('/search');
                }
              }}
              style={styles.heroCtaButton}
              accessibilityRole="button"
              accessibilityLabel="Explore fresh essentials"
            >
              <Text style={styles.heroCtaText}>Explore Catalog →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroGraphicWrapper}>
            <Text style={styles.heroGraphicEmoji}>🥦</Text>
            <View style={styles.heroGraphicSubEmojiWrap}>
              <Text style={styles.heroGraphicSubEmoji}>🍎</Text>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 4. FREE DELIVERY PROGRESS BANNER                   */}
        {/* ================================================== */}
        <View style={styles.freeDeliveryCard}>
          <View style={styles.freeDeliveryTopRow}>
            <View style={styles.freeDeliveryIconWrap}>
              <Text style={styles.freeDeliveryIcon}>🛵</Text>
            </View>
            <View style={styles.freeDeliveryTextWrap}>
              {isFreeDeliveryUnlocked ? (
                <Text style={styles.freeDeliveryUnlockedTitle}>
                  🎉 FREE delivery unlocked!
                </Text>
              ) : subtotal === 0 ? (
                <Text style={styles.freeDeliveryHintTitle}>
                  Free delivery on orders above ₹{freeDeliveryThreshold}
                </Text>
              ) : (
                <Text style={styles.freeDeliveryDynamicTitle}>
                  Add <Text style={styles.freeDeliveryHighlight}>₹{amountRemaining}</Text> more for FREE delivery
                </Text>
              )}
              <Text style={styles.freeDeliverySubtitle}>
                Instant dispatch from your neighborhood hub
              </Text>
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

        {/* ================================================== */}
        {/* 5. SHOP BY CATEGORY                                */}
        {/* ================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <Text style={styles.sectionSubtitle}>Handpicked farm-fresh items</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/categories')}
              style={styles.seeAllButton}
              accessibilityRole="button"
              accessibilityLabel="See all categories"
            >
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {isCategoriesLoading && !refreshing ? (
            <View style={styles.categorySkeletonRow}>
              {[1, 2, 3, 4, 5].map((key) => (
                <View key={key} style={styles.categorySkeletonCard} />
              ))}
            </View>
          ) : categoriesError ? (
            <View style={styles.inlineErrorBox}>
              <Text style={styles.inlineErrorText}>Couldn't load categories</Text>
              <TouchableOpacity
                onPress={refreshCategories}
                style={styles.inlineRetryBtn}
              >
                <Text style={styles.inlineRetryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {/* "All" Category Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(undefined)}
                style={[
                  styles.categoryCard,
                  selectedCategoryId === undefined && styles.categoryCardActive
                ]}
                accessibilityRole="button"
                accessibilityLabel="All Categories filter"
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    selectedCategoryId === undefined && styles.categoryIconCircleActive
                  ]}
                >
                  <Text style={styles.categoryEmoji}>🌟</Text>
                </View>
                <Text
                  style={[
                    styles.categoryCardTitle,
                    selectedCategoryId === undefined && styles.categoryCardTitleActive
                  ]}
                  numberOfLines={1}
                >
                  All Items
                </Text>
              </TouchableOpacity>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => handleCategoryPress(cat)}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardActive
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${cat.name} category`}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        isSelected && styles.categoryIconCircleActive
                      ]}
                    >
                      {cat.imageUrl ? (
                        <Image
                          source={{ uri: cat.imageUrl }}
                          style={styles.categoryImage}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                          transition={150}
                        />
                      ) : (
                        <Text style={styles.categoryEmoji}>
                          {getCategoryIcon(cat.name)}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.categoryCardTitle,
                        isSelected && styles.categoryCardTitleActive
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ================================================== */}
        {/* 6. PRODUCT SECTION ("Popular Near You")            */}
        {/* ================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sectionTitle}>{activeCategoryName}</Text>
                {selectedCategoryId && (
                  <TouchableOpacity
                    onPress={() => setSelectedCategoryId(undefined)}
                    style={styles.clearFilterPill}
                    accessibilityRole="button"
                    accessibilityLabel="Clear category filter"
                  >
                    <Text style={styles.clearFilterText}>Clear ✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionSubtitle}>
                {products.length} {products.length === 1 ? 'item available' : 'items available'}
              </Text>
            </View>
          </View>

          {/* Product Grid Content */}
          {isProductsLoading && !refreshing ? (
            <View style={styles.productsGrid}>
              {[1, 2, 3, 4].map((key) => (
                <View
                  key={key}
                  style={[styles.productSkeletonCard, { width: CARD_WIDTH }]}
                >
                  <View style={styles.skeletonImageArea} />
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                </View>
              ))}
            </View>
          ) : productsError ? (
            <View style={styles.errorContainer}>
              <EmptyState
                icon="⚠️"
                title="Couldn't load this section"
                description={productsError}
                actionLabel="Try Again"
                onAction={handleRefresh}
              />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="🥦"
                title="No products available right now"
                description="We are restocking fresh inventory at this moment."
                actionLabel="Refresh Catalog"
                onAction={handleRefresh}
              />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={{ width: CARD_WIDTH, marginBottom: spacing.md }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 8. CART FLOATING CTA                               */}
      {/* ================================================== */}
      {itemCount > 0 && (
        <View style={styles.floatingCartContainer} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push('/cart')}
            style={styles.floatingCart}
            accessibilityRole="button"
            accessibilityLabel={`View Cart, ${itemCount} items, total ${formatCurrency(subtotal)}`}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartBadgeCircle}>
                <Text style={styles.cartBadgeCount}>{itemCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCartItemsText}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}  •  {formatCurrency(subtotal)}
                </Text>
                <Text style={styles.floatingCartSubtext}>
                  {isFreeDeliveryUnlocked
                    ? '🎉 Free delivery applied'
                    : `Add ₹${amountRemaining} for free delivery`}
                </Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartActionText}>View Cart</Text>
              <Text style={styles.floatingCartArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },

  /* 1. Header Styles */
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  brandIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandIconLeaf: {
    fontSize: 18
  },
  brandTitleText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    lineHeight: 18,
    letterSpacing: -0.3
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.2
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    maxWidth: SCREEN_WIDTH * 0.46
  },
  addressPinIcon: {
    fontSize: 12,
    marginRight: 4
  },
  addressTextWrapper: {
    flex: 1
  },
  deliverToCaption: {
    fontSize: 8,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  addressTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  addressChevron: {
    fontSize: 8,
    color: colors.textSecondary,
    marginLeft: 4
  },

  /* Delivery SLA Banner */
  deliverySlaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    borderRadius: radius.md,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs
  },
  deliverySlaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  lightningIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lightningIcon: {
    fontSize: 10,
    color: '#064E3B'
  },
  deliverySlaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.6
  },
  hubStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.full
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399'
  },
  hubStatusText: {
    color: '#E6FFFA',
    fontSize: 9,
    fontWeight: typography.weights.bold
  },

  /* 2. Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 1,
    marginTop: 2
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.sizes.xs + 1,
    color: colors.textMuted,
    fontWeight: typography.weights.medium
  },
  searchMicPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchMicIcon: {
    fontSize: 11
  },

  /* Scroll Content */
  scrollContent: {
    backgroundColor: colors.background
  },

  /* 3. Hero Promotional Banner */
  heroBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: '#065F46',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.sm
  },
  heroContent: {
    flex: 1,
    paddingRight: spacing.sm
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  heroBadgeText: {
    color: '#A7F3D0',
    fontSize: 9,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.6
  },
  heroTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold,
    color: '#FFFFFF',
    lineHeight: 20
  },
  heroSubtitle: {
    fontSize: typography.sizes.xs,
    color: '#D1FAE5',
    marginTop: 2,
    marginBottom: spacing.sm
  },
  heroCtaButton: {
    backgroundColor: '#10B981',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start'
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  heroGraphicWrapper: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  heroGraphicEmoji: {
    fontSize: 48
  },
  heroGraphicSubEmojiWrap: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm
  },
  heroGraphicSubEmoji: {
    fontSize: 14
  },

  /* 4. Free Delivery Banner */
  freeDeliveryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadows.sm
  },
  freeDeliveryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  freeDeliveryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  freeDeliveryIcon: {
    fontSize: 16
  },
  freeDeliveryTextWrap: {
    flex: 1
  },
  freeDeliveryUnlockedTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#059669'
  },
  freeDeliveryHintTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  freeDeliveryDynamicTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  freeDeliveryHighlight: {
    color: '#059669',
    fontWeight: typography.weights.extrabold
  },
  freeDeliverySubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3
  },

  /* Sections */
  sectionContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1
  },
  seeAllButton: {
    paddingVertical: 3,
    paddingHorizontal: 6
  },
  seeAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  clearFilterPill: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  clearFilterText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#B91C1C'
  },

  /* 5. Category Horizontal Cards */
  categoryScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm
  },
  categoryCard: {
    width: 74,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    ...shadows.sm
  },
  categoryCardActive: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  categoryIconCircleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary
  },
  categoryEmoji: {
    fontSize: 22
  },
  categoryImage: {
    width: 32,
    height: 32
  },
  categoryCardTitle: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12
  },
  categoryCardTitleActive: {
    color: colors.primaryDark,
    fontWeight: typography.weights.extrabold
  },
  categorySkeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  categorySkeletonCard: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: '#E2E8F0',
    opacity: 0.6
  },

  /* 6. Product Grid */
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  productSkeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  skeletonImageArea: {
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.sm,
    marginBottom: spacing.xs
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 6
  },
  inlineErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inlineErrorText: {
    color: '#991B1B',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold
  },
  inlineRetryBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm
  },
  inlineRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  errorContainer: {
    paddingVertical: spacing.lg
  },
  emptyContainer: {
    paddingVertical: spacing.lg
  },

  /* 8. Floating Cart CTA */
  floatingCartContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 99
  },
  floatingCart: {
    backgroundColor: '#059669',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#10B981',
    ...shadows.lg
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  cartBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartBadgeCount: {
    color: '#FFFFFF',
    fontWeight: typography.weights.extrabold,
    fontSize: 12
  },
  floatingCartItemsText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold
  },
  floatingCartSubtext: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: typography.weights.medium
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 4
  },
  floatingCartActionText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold
  },
  floatingCartArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.bold
  }
});
