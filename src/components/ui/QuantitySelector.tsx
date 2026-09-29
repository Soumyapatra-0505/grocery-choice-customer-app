/**
 * Grocery Choice Customer App - Quantity Selector (Stepper)
 * Classic quick-commerce ADD / Stepper component.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
  style
}) => {
  const isSmall = size === 'sm';

  if (quantity === 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onIncrement}
        style={[
          styles.addButton,
          isSmall ? styles.addButtonSmall : styles.addButtonMedium,
          style
        ]}
      >
        <Text
          style={[
            styles.addButtonText,
            isSmall ? styles.addButtonTextSmall : styles.addButtonTextMedium
          ]}
        >
          ADD
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.stepperContainer,
        isSmall ? styles.stepperSmall : styles.stepperMedium,
        style
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onDecrement}
        style={[styles.stepperButton, isSmall ? styles.stepperButtonSmall : null]}
      >
        <Text style={styles.stepperButtonText}>−</Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.quantityText,
          isSmall ? styles.quantityTextSmall : styles.quantityTextMedium
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onIncrement}
        style={[styles.stepperButton, isSmall ? styles.stepperButtonSmall : null]}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonMedium: {
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    minWidth: 74
  },
  addButtonSmall: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    minWidth: 62
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5
  },
  addButtonTextMedium: {
    fontSize: typography.sizes.sm
  },
  addButtonTextSmall: {
    fontSize: typography.sizes.xs
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.md
  },
  stepperMedium: {
    minWidth: 80,
    height: 32,
    paddingHorizontal: 4
  },
  stepperSmall: {
    minWidth: 70,
    height: 28,
    paddingHorizontal: 2
  },
  stepperButton: {
    width: 24,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperButtonSmall: {
    width: 20
  },
  stepperButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    lineHeight: 18
  },
  quantityText: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
    textAlign: 'center'
  },
  quantityTextMedium: {
    fontSize: typography.sizes.sm,
    paddingHorizontal: 4
  },
  quantityTextSmall: {
    fontSize: typography.sizes.xs,
    paddingHorizontal: 2
  }
});
