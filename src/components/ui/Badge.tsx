/**
 * Grocery Choice Customer App - Badge Component
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'discount'
  | 'sla'
  | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
  icon
}) => {
  const getColors = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primarySurface, text: colors.primaryDark, border: colors.primaryBorder };
      case 'success':
        return { bg: colors.successSurface, text: colors.textSuccess };
      case 'warning':
        return { bg: colors.warningSurface, text: '#92400E' };
      case 'danger':
        return { bg: colors.dangerSurface, text: colors.textDanger };
      case 'info':
        return { bg: colors.infoSurface, text: colors.info };
      case 'discount':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'sla':
        return { bg: colors.primarySurface, text: colors.primaryDark };
      case 'neutral':
      default:
        return { bg: colors.borderLight, text: colors.textSecondary, border: colors.border };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: scheme.bg },
        scheme.border ? { borderWidth: 1, borderColor: scheme.border } : null,
        style
      ]}
    >
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={[styles.text, { color: scheme.text }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs + 2,
    alignSelf: 'flex-start'
  },
  iconWrapper: {
    marginRight: 4
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  }
});
