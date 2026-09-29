/**
 * Grocery Choice Customer App - Address Management Screen
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
import { Address, AddressType } from '@/types';
import { storageService } from '@/storage/storage';
import { validatePincode } from '@/utils/validators';

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 1,
    street: 'Flat 402, Green Valley Apartments, Chandrasekharpur',
    landmark: 'Opposite Infocity Park',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751024',
    type: 'HOME',
    isDefault: true
  },
  {
    id: 2,
    street: 'TCS Infotech Tower, 3rd Floor, Patia',
    landmark: 'Near KIIT Square',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751024',
    type: 'WORK',
    isDefault: false
  }
];

export default function AddressScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(1);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bhubaneswar');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('751024');
  const [type, setType] = useState<AddressType>('HOME');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load addresses
  useEffect(() => {
    async function loadSaved() {
      const saved = await storageService.getSavedAddresses();
      if (saved && saved.length > 0) {
        setAddresses(saved);
        const active = await storageService.getActiveAddress();
        if (active && active.id) {
          setSelectedId(active.id);
        } else {
          setSelectedId(saved[0].id);
        }
      } else {
        setAddresses(DEFAULT_ADDRESSES);
        await storageService.setSavedAddresses(DEFAULT_ADDRESSES);
        await storageService.setActiveAddress(DEFAULT_ADDRESSES[0]);
      }
    }
    loadSaved();
  }, []);

  const handleSelectAddress = async (addr: Address) => {
    setSelectedId(addr.id);
    await storageService.setActiveAddress(addr);
    router.back();
  };

  const handleSaveNewAddress = async () => {
    const newErrors: Record<string, string> = {};
    if (!street.trim()) newErrors.street = 'Street address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!pincode.trim() || !validatePincode(pincode)) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newAddress: Address = {
      id: Date.now(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      type,
      isDefault: addresses.length === 0
    };

    const updated = [newAddress, ...addresses];
    setAddresses(updated);
    await storageService.setSavedAddresses(updated);
    await storageService.setActiveAddress(newAddress);
    setSelectedId(newAddress.id);
    setIsAddingNew(false);

    // Reset form
    setStreet('');
    setLandmark('');
    setErrors({});
  };

  const handleDeleteAddress = (id?: number) => {
    if (!id) return;
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = addresses.filter((a) => a.id !== id);
          setAddresses(updated);
          await storageService.setSavedAddresses(updated);
        }
      }
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header title="Delivery Address" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Toggle Add New Address */}
        {!isAddingNew ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsAddingNew(true)}
            style={styles.addNewButton}
          >
            <Text style={styles.addNewIcon}>＋</Text>
            <Text style={styles.addNewText}>Add New Address</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setIsAddingNew(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <View style={styles.typeSelectorRow}>
              {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeButton, type === t && styles.typeButtonActive]}
                >
                  <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                    {t === 'HOME' ? '🏠 Home' : t === 'WORK' ? '🏢 Work' : '📍 Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Flat / House / Floor / Building"
              value={street}
              onChangeText={(t) => {
                setStreet(t);
                if (errors.street) setErrors((prev) => ({ ...prev, street: '' }));
              }}
              error={errors.street}
              placeholder="e.g. Flat 301, Lakeview Residency"
            />

            <Input
              label="Landmark (Optional)"
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Opposite State Bank ATM"
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label="City"
                  value={city}
                  onChangeText={(t) => {
                    setCity(t);
                    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  error={errors.city}
                  placeholder="City"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Input
                  label="Pincode"
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t);
                    if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  error={errors.pincode}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="Pincode"
                />
              </View>
            </View>

            <Button
              title="Save & Deliver Here"
              onPress={handleSaveNewAddress}
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        {/* Saved Addresses List */}
        <Text style={styles.savedSectionTitle}>Saved Delivery Locations</Text>
        {addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            activeOpacity={0.85}
            onPress={() => handleSelectAddress(addr)}
            style={[styles.addressCard, selectedId === addr.id && styles.addressCardSelected]}
          >
            <View style={styles.addressLeft}>
              <View
                style={[styles.radioCircle, selectedId === addr.id && styles.radioCircleActive]}
              >
                {selectedId === addr.id && <View style={styles.radioInner} />}
              </View>

              <View style={styles.addressDetails}>
                <View style={styles.tagRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {addr.type === 'HOME' ? '🏠 Home' : addr.type === 'WORK' ? '🏢 Work' : '📍 Other'}
                    </Text>
                  </View>
                  {selectedId === addr.id && (
                    <Text style={styles.selectedTag}>Selected for delivery</Text>
                  )}
                </View>

                <Text style={styles.streetText}>{addr.street}</Text>
                {addr.landmark ? (
                  <Text style={styles.landmarkText}>Near: {addr.landmark}</Text>
                ) : null}
                <Text style={styles.cityPincodeText}>
                  {addr.city}, {addr.state} - {addr.pincode}
                </Text>
              </View>
            </View>

            {addresses.length > 1 && (
              <TouchableOpacity
                onPress={() => handleDeleteAddress(addr.id)}
                style={styles.deleteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

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
  content: {
    backgroundColor: colors.background,
    padding: spacing.md
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  addNewIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginRight: spacing.xs
  },
  addNewText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  formTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  cancelText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    fontWeight: typography.weights.semibold
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center'
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface
  },
  typeButtonText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold
  },
  typeButtonTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },
  formRow: {
    flexDirection: 'row'
  },
  savedSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  addressLeft: {
    flexDirection: 'row',
    flex: 1
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
  addressDetails: {
    flex: 1
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  typeBadge: {
    backgroundColor: colors.surfaceHover,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.xs,
    marginRight: spacing.xs
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  selectedTag: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSuccess
  },
  streetText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 18
  },
  landmarkText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  cityPincodeText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  deleteButton: {
    padding: spacing.xs,
    alignSelf: 'flex-start'
  },
  deleteIcon: {
    fontSize: 14
  }
});
