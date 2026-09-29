/**
 * Grocery Choice Customer App - Button Component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.primarySurface,
            borderWidth: 1,
            borderColor: colors.primaryBorder
          },
          text: { color: colors.primaryDark }
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary
          },
          text: { color: colors.primary }
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent'
          },
          text: { color: colors.primary }
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.danger
          },
          text: { color: colors.textInverse }
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary
          },
          text: { color: colors.textInverse }
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing.xs + 2,
            paddingHorizontal: spacing.md,
            borderRadius: radius.md
          },
          text: {
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold
          }
        };
      case 'lg':
        return {
          container: {
            paddingVertical: spacing.md + 2,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.lg
          },
          text: {
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.bold
          }
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: spacing.sm + 4,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.md
          },
          text: {
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.semibold
          }
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        disabled && styles.disabledContainer,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.textBase,
              variantStyles.text,
              sizeStyles.text,
              disabled && styles.disabledText,
              icon ? { marginLeft: spacing.xs } : undefined,
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textBase: {
    textAlign: 'center'
  },
  disabledContainer: {
    backgroundColor: colors.border,
    borderColor: colors.borderDark,
    opacity: 0.7
  },
  disabledText: {
    color: colors.textMuted
  }
});
