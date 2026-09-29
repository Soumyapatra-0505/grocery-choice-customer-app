/**
 * Grocery Choice Customer App - Checkout Screen
 */

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/Input';
import { useCart } from '@/services/cartContext';
import { useAuth } from '@/services/authContext';
import { ordersApi } from '@/api/orders';
import { storageService } from '@/storage/storage';
import { Address, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { APP_CONFIG } from '@/constants/config';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, itemCount, subtotal, totalSavings, deliveryFee, handlingFee, totalAmount, clearCart } =
    useCart();
  const { user, isAuthenticated } = useAuth();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active delivery address
  useEffect(() => {
    async function loadAddress() {
      const active = await storageService.getActiveAddress();
      if (active) {
        setSelectedAddress(active);
      } else {
        // Fallback default address
        setSelectedAddress({
          street: 'Flat 402, Green Valley Apartments',
          landmark: 'Near City Park',
          city: 'Bhubaneswar',
          state: 'Odisha',
          pincode: '751024',
          type: 'HOME'
        });
      }
    }
    loadAddress();
  }, []);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with your mobile number to complete your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please select or add a delivery address to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: user?.id || 1,
        deliveryAddress: `${selectedAddress.street}, ${selectedAddress.landmark ? `${selectedAddress.landmark}, ` : ''}${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        deliveryNote
      };

      const newOrder = await ordersApi.create(payload);
      clearCart();

      // Navigate to order tracking screen
      router.replace({
        pathname: '/order/[id]',
        params: { id: String(newOrder.id || 'new') }
      });
    } catch (err: any) {
      Alert.alert('Order Placement Failed', err.message || 'Unable to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header title="Checkout" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Fast Delivery SLA Banner */}
        <View style={styles.slaBanner}>
          <Text style={styles.slaIcon}>⚡</Text>
          <View style={styles.slaTextWrapper}>
            <Text style={styles.slaTitle}>Estimated Delivery: {APP_CONFIG.DELIVERY_SLA_MINUTES}</Text>
            <Text style={styles.slaSubtitle}>Superfast dispatch from your nearest micro-hub</Text>
          </View>
        </View>

        {/* 2. Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/address')}>
              <Text style={styles.changeActionText}>Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressBox}>
              <View style={styles.addressTypeBadge}>
                <Text style={styles.addressTypeText}>{selectedAddress.type || 'HOME'}</Text>
              </View>
              <Text style={styles.addressStreet}>{selectedAddress.street}</Text>
              {selectedAddress.landmark ? (
                <Text style={styles.addressLandmark}>Near: {selectedAddress.landmark}</Text>
              ) : null}
              <Text style={styles.addressCity}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/address')}
              style={styles.addAddressBox}
            >
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Delivery Instructions Note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Instructions (Optional)</Text>
          <Input
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            placeholder="e.g. Leave with security / Ring bell twice"
            containerStyle={{ marginBottom: 0, marginTop: spacing.xs }}
          />
        </View>

        {/* 4. Payment Method Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Payment Method</Text>

          {/* Cash On Delivery Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('COD')}
            style={[
              styles.paymentOption,
              paymentMethod === 'COD' && styles.paymentOptionActive
            ]}
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'COD' && styles.radioCircleActive
                ]}
              >
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.paymentName}>💵 Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay via Cash or UPI upon delivery</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Online Payment Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('ONLINE')}
            style={[
              styles.paymentOption,
              paymentMethod === 'ONLINE' && styles.paymentOptionActive
            ]}
          >
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === 'ONLINE' && styles.radioCircleActive
                ]}
              >
                {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.paymentName}>💳 Online Payment / UPI</Text>
                <Text style={styles.paymentDesc}>Instant payment via Google Pay, PhonePe, Cards</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. Order Summary Bill */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({itemCount} items)</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {totalSavings > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.savingsLabel}>Savings</Text>
              <Text style={styles.savingsValue}>- {formatCurrency(totalSavings)}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <Text style={styles.billValue}>{formatCurrency(handlingFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Place Order Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.bottomPriceValue}>{formatCurrency(totalAmount)}</Text>
        </View>

        <Button
          title={isSubmitting ? 'Placing Order...' : 'Place Order →'}
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          size="lg"
          style={styles.placeOrderButton}
        />
      </View>
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
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  slaIcon: {
    fontSize: 22,
    marginRight: spacing.sm
  },
  slaTextWrapper: {
    flex: 1
  },
  slaTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  slaSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  changeActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  addressBox: {
    paddingTop: spacing.xs
  },
  addressTypeBadge: {
    backgroundColor: colors.primarySurface,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.xs,
    marginBottom: 4
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  addressStreet: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  addressLandmark: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  addressCity: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  addAddressBox: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.sm
  },
  addAddressText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  radioCircleActive: {
    borderColor: colors.primary
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  paymentName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  paymentDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  billLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold
  },
  savingsLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSuccess
  },
  savingsValue: {
    fontSize: typography.sizes.sm,
    color: colors.textSuccess,
    fontWeight: typography.weights.bold
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2
  },
  billTotalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  billTotalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
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
  placeOrderButton: {
    minWidth: 180
  }
});
