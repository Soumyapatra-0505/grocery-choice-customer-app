/**
 * Grocery Choice Customer App - Root Layout
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/services/authContext';
import { CartProvider } from '@/services/cartContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right'
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen
              name="search/index"
              options={{
                headerShown: false,
                animation: 'fade'
              }}
            />
            <Stack.Screen
              name="checkout/index"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen
              name="address/index"
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen
              name="order/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen
              name="auth/login"
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="notifications/index"
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen
              name="payment/verify"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen
              name="payment/result"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom'
              }}
            />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
