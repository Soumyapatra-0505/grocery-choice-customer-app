/**
 * Grocery Choice Customer App - Product Details Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Product } from '@/types';
import { productsApi } from '@/api/products';
import { useCart } from '@/services/cartContext';
import { formatCurrency, formatUnit } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getItemQuantity, addItem, updateQuantity } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadProduct() {
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
    }
    loadProduct();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Product Details" showBack />
        <LoadingIndicator label="Loading product..." style={styles.centerContainer} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header title="Product Details" showBack />
        <EmptyState
          icon="🔍"
          title="Product not found"
          description={error || 'The requested product could not be located.'}
          actionLabel="Go to Home"
          onAction={() => router.push('/(tabs)')}
          style={styles.centerContainer}
        />
      </SafeAreaView>
    );
  }

  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.inStock || product.stockQuantity <= 0;

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
      <Header
        title={product.categoryName || 'Product'}
        showBack
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/cart')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cartIconText}>🛒</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Product Image */}
        <View style={styles.imageCard}>
          <Image
            source={{
              uri: !imageError && product.imageUrl ? product.imageUrl : APP_CONFIG.FALLBACK_PRODUCT_IMAGE
            }}
            style={styles.productImage}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />

          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discountPercentage}% OFF</Text>
            </View>
          )}

          <View style={styles.slaBadge}>
            <Text style={styles.slaText}>⚡ {APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.unitText}>{formatUnit(product.unit)}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>{formatCurrency(product.sellingPrice)}</Text>
            {product.mrp > product.sellingPrice && (
              <View style={styles.mrpContainer}>
                <Text style={styles.mrpText}>{formatCurrency(product.mrp)}</Text>
                <Text style={styles.inclusiveText}>(Inclusive of all taxes)</Text>
              </View>
            )}
          </View>

          {/* Out of Stock Warning if any */}
          {isOutOfStock && (
            <View style={styles.outOfStockAlert}>
              <Text style={styles.outOfStockAlertText}>Currently Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Delivery Guarantee Card */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeRow}>
            <Text style={styles.guaranteeIcon}>⚡</Text>
            <View style={styles.guaranteeTextWrapper}>
              <Text style={styles.guaranteeTitle}>Fast Delivery in {APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
              <Text style={styles.guaranteeSubtitle}>Direct from your nearest Grocery Choice store</Text>
            </View>
          </View>

          <View style={styles.guaranteeDivider} />

          <View style={styles.guaranteeRow}>
            <Text style={styles.guaranteeIcon}>🛡️</Text>
            <View style={styles.guaranteeTextWrapper}>
              <Text style={styles.guaranteeTitle}>Quality Assured</Text>
              <Text style={styles.guaranteeSubtitle}>Hand-picked and temperature controlled dispatch</Text>
            </View>
          </View>
        </View>

        {/* Product Description */}
        {product.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionHeader}>Product Information</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>PRICE</Text>
          <Text style={styles.bottomPriceValue}>{formatCurrency(product.sellingPrice)}</Text>
        </View>

        {isOutOfStock ? (
          <View style={styles.soldOutButton}>
            <Text style={styles.soldOutButtonText}>SOLD OUT</Text>
          </View>
        ) : (
          <QuantitySelector
            quantity={quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            size="md"
            style={styles.quantityControl}
          />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  cartIconText: {
    fontSize: 22
  },
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
    ...shadows.sm
  },
  productImage: {
    width: '80%',
    height: '80%'
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: '#DC2626',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs
  },
  discountText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },
  slaBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primarySurface,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  slaText: {
    color: colors.primaryDark,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  unitText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
    marginBottom: 4
  },
  productTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.sm
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  sellingPrice: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    marginRight: spacing.sm
  },
  mrpContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mrpText: {
    fontSize: typography.sizes.base,
    color: colors.priceStrikethrough,
    textDecorationLine: 'line-through',
    marginRight: spacing.xs
  },
  inclusiveText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted
  },
  outOfStockAlert: {
    backgroundColor: colors.dangerSurface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md
  },
  outOfStockAlertText: {
    color: colors.dangerDark,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
    textAlign: 'center'
  },
  guaranteeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  guaranteeIcon: {
    fontSize: 22,
    marginRight: spacing.md
  },
  guaranteeTextWrapper: {
    flex: 1
  },
  guaranteeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  guaranteeSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  guaranteeDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm
  },
  sectionHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  descriptionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },
  bottomBar: {
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
  bottomPriceInfo: {
    flexDirection: 'column'
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted
  },
  bottomPriceValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  soldOutButton: {
    backgroundColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md
  },
  soldOutButtonText: {
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm
  },
  quantityControl: {
    minWidth: 120
  }
});
