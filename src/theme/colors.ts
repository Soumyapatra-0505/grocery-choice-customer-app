/**
 * Grocery Choice Customer App - Color Tokens
 * Premium, clean, original quick-commerce emerald green palette.
 */

export const colors = {
  // Brand Primary (Emerald)
  primary: '#059669',        // Emerald 600 - Main brand color
  primaryDark: '#047857',    // Emerald 700 - Active / pressed states
  primaryLight: '#10B981',   // Emerald 500 - Accents
  primaryLighter: '#34D399', // Emerald 400
  primarySurface: '#ECFDF5', // Emerald 50 - Light tint background for badges/cards
  primaryBorder: '#A7F3D0',  // Emerald 200 - Borders

  // Brand Secondary / Accents (Warm Amber / Coral)
  secondary: '#F59E0B',      // Amber 500 - Offers & ratings
  secondaryLight: '#FEF3C7', // Amber 50 - Discount tags
  accent: '#0284C7',         // Sky 600 - Highlights / info

  // Semantic Status
  success: '#10B981',
  successSurface: '#D1FAE5',
  warning: '#F59E0B',
  warningSurface: '#FEF3C7',
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerSurface: '#FEE2E2',
  info: '#3B82F6',
  infoSurface: '#EFF6FF',

  // Neutrals / Surfaces (Light Theme Default)
  background: '#F8FAFC',     // Slate 50 - Screen canvas background
  surface: '#FFFFFF',        // White card background
  surfaceHover: '#F1F5F9',   // Slate 100
  surfaceElevated: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',         // Slate 200
  borderLight: '#F1F5F9',    // Slate 100
  borderDark: '#CBD5E1',     // Slate 300

  // Text
  textPrimary: '#0F172A',    // Slate 900 - High contrast titles/body
  textSecondary: '#475569',  // Slate 600 - Supporting text, units
  textMuted: '#94A3B8',      // Slate 400 - Placeholders, disabled
  textInverse: '#FFFFFF',    // White text on dark/green buttons
  textSuccess: '#047857',    // Dark emerald text on light badges
  textDanger: '#B91C1C',

  // Special UI Tokens
  deliveryPill: '#064E3B',   // Deep forest green for "10 MINS" delivery badge
  priceStrikethrough: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.5)',
  shimmer: '#E2E8F0'
};

export type ColorTheme = typeof colors;
