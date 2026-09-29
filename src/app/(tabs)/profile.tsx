/**
 * Grocery Choice Customer App - Profile / Account Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/services/authContext';
import { APP_CONFIG } from '@/constants/config';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, subtitle, onPress, danger }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.menuItem, danger && styles.menuItemDanger]}
  >
    <View style={styles.menuLeft}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of Grocery Choice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header title="My Account" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        {isAuthenticated && user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name || 'Grocery Shopper'}</Text>
              <Text style={styles.userPhone}>+91 {user.phone}</Text>
              {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestIcon}>👋</Text>
            <View style={styles.guestTextContainer}>
              <Text style={styles.guestTitle}>Welcome to Grocery Choice</Text>
              <Text style={styles.guestSubtitle}>Sign in for faster checkouts and live tracking</Text>
            </View>
            <Button
              title="Sign In"
              onPress={() => router.push('/auth/login')}
              size="sm"
              style={styles.signInButton}
            />
          </View>
        )}

        {/* Quick Commerce Delivery Guarantee Banner */}
        <View style={styles.guaranteeBanner}>
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <View style={styles.guaranteeTextWrapper}>
            <Text style={styles.guaranteeTitle}>Grocery Choice Quality Promise</Text>
            <Text style={styles.guaranteeSubtitle}>
              100% fresh items, contactless delivery, and instant refunds.
            </Text>
          </View>
        </View>

        {/* Menu Section: Orders & Addresses */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>ORDERS & DELIVERIES</Text>
          <MenuItem
            icon="📦"
            title="My Orders"
            subtitle="Track live status and order history"
            onPress={() => router.push('/(tabs)/orders')}
          />
          <MenuItem
            icon="📍"
            title="Saved Addresses"
            subtitle="Manage home, work, and family addresses"
            onPress={() => router.push('/address')}
          />
        </View>

        {/* Menu Section: Support & Legal */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>SUPPORT & ABOUT</Text>
          <MenuItem
            icon="💬"
            title="Customer Support"
            subtitle="Instant help on WhatsApp & chat"
            onPress={() => {
              Alert.alert('Customer Support', 'Reach out to support@grocerychoice.com');
            }}
          />
          <MenuItem
            icon="ℹ️"
            title="About Grocery Choice"
            subtitle={`Version ${APP_CONFIG.APP_VERSION}`}
            onPress={() => {
              Alert.alert('Grocery Choice', `${APP_CONFIG.TAGLINE}\nVersion ${APP_CONFIG.APP_VERSION}`);
            }}
          />
        </View>

        {/* Logout Section if Authenticated */}
        {isAuthenticated && (
          <View style={styles.menuSection}>
            <MenuItem
              icon="🚪"
              title="Log Out"
              onPress={handleLogout}
              danger
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollContent: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarInitial: {
    color: colors.textInverse,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  userPhone: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2
  },
  userEmail: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm
  },
  guestIcon: {
    fontSize: 28,
    marginRight: spacing.md
  },
  guestTextContainer: {
    flex: 1
  },
  guestTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  guestSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  signInButton: {
    marginLeft: spacing.sm
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  guaranteeIcon: {
    fontSize: 24,
    marginRight: spacing.sm
  },
  guaranteeTextWrapper: {
    flex: 1
  },
  guaranteeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  guaranteeSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  menuItemDanger: {
    backgroundColor: '#FEF2F2'
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md
  },
  menuTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary
  },
  menuTitleDanger: {
    color: colors.danger,
    fontWeight: typography.weights.bold
  },
  menuSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: typography.weights.bold
  }
});
