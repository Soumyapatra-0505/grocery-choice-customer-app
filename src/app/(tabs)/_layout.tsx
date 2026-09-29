/**
 * Grocery Choice Customer App - Tabs Layout
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, typography } from '@/theme';
import { useCart } from '@/services/cartContext';

interface TabBarIconProps {
  icon: string;
  label: string;
  focused: boolean;
  badgeCount?: number;
}

const TabIcon: React.FC<TabBarIconProps> = ({ icon, label, focused, badgeCount }) => {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <Text style={[styles.iconText, focused && styles.iconTextFocused]}>{icon}</Text>
        {badgeCount && badgeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
};

export default function TabsLayout() {
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon icon="🏪" label="Home" focused={focused} />
          )
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon icon="🗂️" label="Categories" focused={focused} />
          )
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon icon="🛒" label="Cart" focused={focused} badgeCount={itemCount} />
          )
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon icon="📦" label="Orders" focused={focused} />
          )
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64
  },
  iconWrapper: {
    position: 'relative'
  },
  iconText: {
    fontSize: 20,
    opacity: 0.75
  },
  iconTextFocused: {
    opacity: 1
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    marginTop: 2
  },
  labelFocused: {
    color: colors.primary,
    fontWeight: typography.weights.bold
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: typography.weights.bold
  }
});
