/**
 * Grocery Choice Customer App - Product Card Component
 * Fast, lightweight quick-commerce product card.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@/types';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { formatCurrency, formatUnit } from '@/utils/formatters';
import { QuantitySelector } from './QuantitySelector';
import { useCart } from '@/services/cartContext';
import { APP_CONFIG } from '@/constants/config';

interface ProductCardProps {
  product: Product;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, style }) => {
  const router = useRouter();
  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const [imageError, setImageError] = useState(false);

  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.inStock || product.stockQuantity <= 0;

  const handlePressCard = () => {
    router.push({
      pathname: '/product/[id]',
      params: { id: String(product.id) }
    });
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

  const imageUrl =
    !imageError && product.imageUrl ? product.imageUrl : APP_CONFIG.FALLBACK_PRODUCT_IMAGE;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePressCard}
      style={[styles.container, style]}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />

        {/* Discount Badge */}
        {product.discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Delivery SLA Pill */}
        <View style={styles.slaBadge}>
          <Text style={styles.slaText}>⏱ {APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.infoContainer}>
        {/* Unit / Weight */}
        <Text style={styles.unitText}>{formatUnit(product.unit)}</Text>

        {/* Product Title */}
        <Text style={styles.nameText} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Price & Action Row */}
        <View style={styles.actionRow}>
          <View style={styles.priceColumn}>
            <Text style={styles.sellingPrice}>{formatCurrency(product.sellingPrice)}</Text>
            {product.mrp > product.sellingPrice && (
              <Text style={styles.mrpText}>{formatCurrency(product.mrp)}</Text>
            )}
          </View>

          {/* Cart Stepper / Out of Stock */}
          {isOutOfStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>SOLD OUT</Text>
            </View>
          ) : (
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              size="sm"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs + 2,
    marginVertical: spacing.xs,
    width: '48.5%',
    ...shadows.sm
  },
  imageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  image: {
    width: '85%',
    height: '85%'
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.xs
  },
  discountText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.2
  },
  slaBadge: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: radius.xs
  },
  slaText: {
    color: colors.primaryDark,
    fontSize: 9,
    fontWeight: typography.weights.bold
  },
  infoContainer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-between',
    flex: 1
  },
  unitText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    marginBottom: 2
  },
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 18,
    minHeight: 36
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  priceColumn: {
    flexDirection: 'column'
  },
  sellingPrice: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  mrpText: {
    fontSize: typography.sizes.xs,
    color: colors.priceStrikethrough,
    textDecorationLine: 'line-through'
  },
  outOfStockBadge: {
    backgroundColor: colors.dangerSurface,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radius.xs
  },
  outOfStockText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.dangerDark
  }
});
