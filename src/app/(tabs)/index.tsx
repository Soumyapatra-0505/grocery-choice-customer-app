/**
 * Grocery Choice Customer App - Home Screen
 * Clean, modern quick-commerce homepage.
 */

import React, { useState, useMemo } from 'react';
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
import { APP_CONFIG } from '@/constants/config';
import { ProductCard } from '@/components/ui/ProductCard';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/services/cartContext';
import { formatCurrency } from '@/utils/formatters';

export default function HomeScreen() {
  const router = useRouter();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const { products, isLoading: isProductsLoading, error, refresh } = useProducts(selectedCategoryId);
  const { items, itemCount, subtotal } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCategorySelect = (id?: number) => {
    setSelectedCategoryId(id);
  };

  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'All Products';
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return cat ? cat.name : 'Products';
  }, [selectedCategoryId, categories]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* 1. Top Location & Brand Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandLogo}>🌿</Text>
            <View>
              <Text style={styles.brandTitle}>{APP_CONFIG.APP_NAME}</Text>
              <Text style={styles.deliverySla}>⚡ {APP_CONFIG.DELIVERY_SLA_MINUTES} DELIVERY</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/address')}
            style={styles.locationSelector}
          >
            <Text style={styles.locationLabel} numberOfLines={1}>
              📍 Deliver to Home
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Search Trigger Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
          style={styles.searchBar}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search for milk, butter, chips, atta...</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Scroll */}
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
        {/* 3. Free Delivery Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Free Delivery above ₹{APP_CONFIG.FREE_DELIVERY_THRESHOLD}</Text>
            <Text style={styles.promoSubtitle}>No coupons needed, automatically applied</Text>
          </View>
          <Text style={styles.promoIcon}>🛵</Text>
        </View>

        {/* 4. Horizontal Category Filter Chips */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleCategorySelect(undefined)}
              style={[
                styles.categoryChip,
                selectedCategoryId === undefined && styles.categoryChipActive
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === undefined && styles.categoryChipTextActive
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => handleCategorySelect(cat.id)}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && styles.categoryChipActive
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategoryId === cat.id && styles.categoryChipTextActive
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 5. Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{activeCategoryName}</Text>
            <Text style={styles.productCountText}>
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {isProductsLoading && !refreshing ? (
            <LoadingIndicator label="Loading fresh products..." />
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title="Unable to load products"
              description={error}
              actionLabel="Try Again"
              onAction={handleRefresh}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🥦"
              title="No products found"
              description="No active items available in this category currently."
              actionLabel="Show All Items"
              onAction={() => setSelectedCategoryId(undefined)}
            />
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for floating cart */}
        <View style={{ height: itemCount > 0 ? 80 : 20 }} />
      </ScrollView>

      {/* 6. Floating Cart Pill when items > 0 */}
      {itemCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
            style={styles.floatingCart}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartBadgeCircle}>
                <Text style={styles.cartBadgeCount}>{itemCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCartItemsText}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
                <Text style={styles.floatingCartSubtotal}>{formatCurrency(subtotal)}</Text>
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
  headerBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandLogo: {
    fontSize: 26,
    marginRight: spacing.xs
  },
  brandTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    letterSpacing: -0.3
  },
  deliverySla: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.5
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    maxWidth: 160
  },
  locationLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
    marginRight: 4
  },
  dropdownArrow: {
    fontSize: 9,
    color: colors.primaryDark
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchIcon: {
    fontSize: 15,
    marginRight: spacing.sm
  },
  searchPlaceholder: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted
  },
  scrollContent: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xxl
  },
  promoBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  promoTextContainer: {
    flex: 1
  },
  promoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  promoSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  promoIcon: {
    fontSize: 28,
    marginLeft: spacing.sm
  },
  categoriesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  chipsScroll: {
    paddingVertical: spacing.sm,
    gap: spacing.xs
  },
  categoryChip: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    marginRight: spacing.xs
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  categoryChipTextActive: {
    color: colors.textInverse
  },
  productsSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  productCountText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg
  },
  floatingCart: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cartBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  cartBadgeCount: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs
  },
  floatingCartItemsText: {
    color: colors.primarySurface,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium
  },
  floatingCartSubtotal: {
    color: colors.textInverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  floatingCartActionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginRight: spacing.xs
  },
  floatingCartArrow: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold
  }
});
