/**
 * Grocery Choice Customer App - Address Management Screen
 * Complete UI/UX upgrade matching Grocery Choice design system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Address, AddressType } from '@/types';
import { storageService } from '@/storage/storage';
import { addressApi } from '@/api/addresses';
import { useAuth } from '@/hooks';
import { validatePincode, validatePhone } from '@/utils/validators';
import { normalizeAddress } from '@/utils/formatters';

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 1,
    contactName: 'Rahul Sharma',
    contactPhone: '9876543210',
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
    contactName: 'Rahul Sharma',
    contactPhone: '9876543210',
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
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Form visibility & edit state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bhubaneswar');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('751024');
  const [type, setType] = useState<AddressType>('HOME');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load addresses on mount
  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      let list: Address[] = [];

      // 1. Try remote API if authenticated
      if (isAuthenticated) {
        try {
          const remote = await addressApi.getAll();
          if (remote && Array.isArray(remote) && remote.length > 0) {
            list = remote.map(normalizeAddress);
          }
        } catch {
          // Graceful fallback to local
        }
      }

      // 2. Try local storage if remote empty
      if (list.length === 0) {
        const local = await storageService.getSavedAddresses();
        if (local !== null && Array.isArray(local)) {
          list = local.map(normalizeAddress);
        } else if (local === null) {
          // First launch / no storage key yet: seed demo addresses
          list = DEFAULT_ADDRESSES.map(normalizeAddress);
          await storageService.setSavedAddresses(list);
        }
      } else {
        await storageService.setSavedAddresses(list);
      }

      setAddresses(list);

      // Determine active delivery address
      const active = await storageService.getActiveAddress();
      if (active && active.id && list.some((a) => a.id === active.id)) {
        setSelectedId(active.id);
      } else {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr) {
          setSelectedId(defaultAddr.id);
          await storageService.setActiveAddress(defaultAddr);
        }
      }
    } catch {
      // Keep state safe
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Open Form for Adding New Address
  const handleOpenAddForm = () => {
    setEditingId(null);
    setContactName(user?.name || '');
    const cleanPhone = user?.phone ? validatePhone(user.phone).normalized : '';
    setContactPhone(cleanPhone);
    setHouseFlat('');
    setStreetArea('');
    setLandmark('');
    setCity('Bhubaneswar');
    setState('Odisha');
    setPincode('751024');
    setType('HOME');
    setIsDefault(addresses.length === 0 || !addresses.some((a) => a.isDefault));
    setErrors({});
    setIsFormVisible(true);
  };

  // Open Form for Editing Address
  const handleEditAddress = (addr: Address) => {
    const safeAddr = normalizeAddress(addr);
    setEditingId(safeAddr.id || null);
    setContactName(safeAddr.contactName || user?.name || '');
    const cleanPhone = safeAddr.contactPhone || user?.phone || '';
    setContactPhone(cleanPhone ? validatePhone(cleanPhone).normalized : '');

    // Split street into house/building and street/area if possible
    const streetStr = (safeAddr.street || '').trim();
    if (streetStr.includes(',')) {
      const parts = streetStr.split(',');
      setHouseFlat(parts[0].trim());
      setStreetArea(parts.slice(1).join(',').trim());
    } else {
      setHouseFlat(streetStr);
      setStreetArea('');
    }

    setLandmark(safeAddr.landmark || '');
    setCity(safeAddr.city || 'Bhubaneswar');
    setState(safeAddr.state || 'Odisha');
    setPincode(safeAddr.pincode || '751024');
    setType(safeAddr.type || 'HOME');
    setIsDefault(Boolean(safeAddr.isDefault));
    setErrors({});
    setIsFormVisible(true);
  };

  // Close Form
  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setErrors({});
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contactName.trim()) {
      newErrors.contactName = "Please enter receiver's name";
    }

    const phoneResult = validatePhone(contactPhone);
    if (!phoneResult.isValid) {
      newErrors.contactPhone = phoneResult.error || 'Please enter a valid 10-digit mobile number';
    }

    if (!houseFlat.trim()) {
      newErrors.houseFlat = 'Flat / House / Floor / Building is required';
    }

    if (!streetArea.trim()) {
      newErrors.streetArea = 'Street / Area / Locality is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!pincode.trim() || !validatePincode(pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    Keyboard.dismiss();

    const fullStreet = `${houseFlat.trim()}, ${streetArea.trim()}`;
    const targetStreet = fullStreet.trim().toLowerCase();
    const targetPincode = pincode.trim();

    // Prevent duplicate addresses
    const isDuplicate = addresses.some((a) => {
      if (editingId && a.id === editingId) return false;
      const aStreet = (a.street || (a.addressLine1 ? [a.addressLine1, a.addressLine2].filter(Boolean).join(', ') : '') || '').trim().toLowerCase();
      const aPincode = (a.pincode || a.postalCode || '').trim();
      const aType = a.type || 'HOME';
      return (
        aPincode === targetPincode &&
        aStreet === targetStreet &&
        aType === type
      );
    });

    if (isDuplicate) {
      setErrors({
        streetArea: 'An identical address already exists in your saved locations'
      });
      Alert.alert(
        'Duplicate Address',
        'An identical address already exists in your saved locations.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let savedAddr: Address;
      let updatedList: Address[] = [];

      if (editingId) {
        // Update existing address
        savedAddr = normalizeAddress({
          id: editingId,
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          street: fullStreet,
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          type,
          isDefault: isDefault || addresses.length === 1,
          addressLine1: houseFlat.trim(),
          addressLine2: streetArea.trim(),
          postalCode: pincode.trim()
        });

        if (isAuthenticated) {
          try {
            const updated = await addressApi.update(editingId, savedAddr);
            if (updated && updated.id) {
              savedAddr = { ...savedAddr, ...updated };
            }
          } catch {
            // Graceful fallback to local
          }
        }

        updatedList = addresses.map((a) => {
          if (a.id === editingId) return savedAddr;
          if (savedAddr.isDefault) return { ...a, isDefault: false };
          return a;
        });
      } else {
        // Create new address
        savedAddr = normalizeAddress({
          id: Date.now(),
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          street: fullStreet,
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          type,
          isDefault: isDefault || addresses.length === 0,
          addressLine1: houseFlat.trim(),
          addressLine2: streetArea.trim(),
          postalCode: pincode.trim()
        });

        if (isAuthenticated) {
          try {
            const created = await addressApi.create(savedAddr);
            if (created && created.id) {
              savedAddr = { ...savedAddr, ...created };
            }
          } catch {
            // Graceful fallback to local
          }
        }

        const others = savedAddr.isDefault
          ? addresses.map((a) => ({ ...a, isDefault: false }))
          : [...addresses];
        updatedList = [savedAddr, ...others];
      }

      setAddresses(updatedList);
      await storageService.setSavedAddresses(updatedList);

      // Automatically select newly saved/edited address for delivery
      setSelectedId(savedAddr.id);
      await storageService.setActiveAddress(savedAddr);

      setIsFormVisible(false);
      setEditingId(null);

      // Return to previous screen (Checkout or Cart)
      if (router.canGoBack()) {
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Unable to save address. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select Address for Delivery
  const handleSelectAddress = async (addr: Address) => {
    setSelectedId(addr.id);
    await storageService.setActiveAddress(addr);

    // Return to previous screen (Cart/Checkout)
    if (router.canGoBack()) {
      router.back();
    }
  };

  // Set Address as Default
  const handleSetDefault = async (addr: Address) => {
    if (!addr.id) return;
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addr.id
    }));

    setAddresses(updated);
    await storageService.setSavedAddresses(updated);

    const target = updated.find((a) => a.id === addr.id);
    if (target) {
      setSelectedId(target.id);
      await storageService.setActiveAddress(target);
    }

    if (isAuthenticated && addr.id) {
      try {
        await addressApi.setDefault(addr.id);
      } catch {
        // Fallback
      }
    }
  };

  // Delete Address
  const handleDeleteAddress = (addr: Address) => {
    if (!addr.id) return;

    const performDelete = async () => {
      const remaining = addresses.filter((a) => a.id !== addr.id);

      // If the deleted address was default, promote the first remaining
      let finalizedList = remaining;
      if (addr.isDefault && remaining.length > 0) {
        finalizedList = remaining.map((a, idx) => ({
          ...a,
          isDefault: idx === 0
        }));
      }

      setAddresses(finalizedList);
      await storageService.setSavedAddresses(finalizedList);

      // If the deleted address was selected, update active address
      if (selectedId === addr.id) {
        const nextActive =
          finalizedList.find((a) => a.isDefault) || finalizedList[0] || null;
        setSelectedId(nextActive?.id);
        if (nextActive) {
          await storageService.setActiveAddress(nextActive);
        }
      }

      if (isAuthenticated && addr.id) {
        try {
          await addressApi.delete(addr.id);
        } catch {
          // Fallback
        }
      }
    };

    const addressTypeLabel = (addr.type ? String(addr.type) : 'saved').toLowerCase();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to remove this ${addressTypeLabel} address?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to remove this ${addressTypeLabel} address?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete
          }
        ]
      );
    }
  };

  // Custom Header Back Handling
  const handleHeaderBack = () => {
    if (isFormVisible) {
      handleCancelForm();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header
        title={isFormVisible ? (editingId ? 'Edit Address' : 'Add New Address') : 'Delivery Addresses'}
        subtitle={isFormVisible ? 'Doorstep delivery details' : 'Manage your saved locations'}
        showBack
        onBack={handleHeaderBack}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(spacing.xxxl * 2, insets.bottom + spacing.xl) }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading saved addresses...</Text>
            </View>
          ) : isFormVisible ? (
            /* ========================================================================= */
            /* ONE-COLUMN MOBILE-FRIENDLY ADDRESS FORM                                   */
            /* ========================================================================= */
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <View>
                  <Text style={styles.formTitle}>
                    {editingId ? 'Update Delivery Address' : 'Add New Address'}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    All fields marked with * are required for doorstep delivery
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCancelForm}
                  style={styles.formCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.formCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Address Type Selector */}
              <Text style={styles.formFieldLabel}>Save As</Text>
              <View style={styles.typeSelectorRow}>
                {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.8}
                    onPress={() => setType(t)}
                    style={[styles.typeButton, type === t && styles.typeButtonActive]}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === t && styles.typeButtonTextActive
                      ]}
                    >
                      {t === 'HOME' ? '🏠 Home' : t === 'WORK' ? '🏢 Work' : '📍 Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 1. Receiver Name */}
              <Input
                label="Receiver's Name *"
                value={contactName}
                onChangeText={(t) => {
                  setContactName(t);
                  if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: '' }));
                }}
                error={errors.contactName}
                placeholder="e.g. Rahul Sharma"
                autoCapitalize="words"
              />

              {/* 2. Mobile Number */}
              <Input
                label="10-Digit Mobile Number *"
                prefix="+91 "
                value={contactPhone}
                onChangeText={(t) => {
                  const cleaned = t.replace(/\D/g, '').slice(0, 10);
                  setContactPhone(cleaned);
                  if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: '' }));
                }}
                error={errors.contactPhone}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
              />

              {/* 3. House / Flat / Building */}
              <Input
                label="Flat / House / Floor / Building *"
                value={houseFlat}
                onChangeText={(t) => {
                  setHouseFlat(t);
                  if (errors.houseFlat) setErrors((prev) => ({ ...prev, houseFlat: '' }));
                }}
                error={errors.houseFlat}
                placeholder="e.g. Flat 402, Block B, Green Valley"
              />

              {/* 4. Street / Area / Locality */}
              <Input
                label="Street / Area / Locality *"
                value={streetArea}
                onChangeText={(t) => {
                  setStreetArea(t);
                  if (errors.streetArea) setErrors((prev) => ({ ...prev, streetArea: '' }));
                }}
                error={errors.streetArea}
                placeholder="e.g. Infocity Road, Chandrasekharpur"
              />

              {/* 5. Landmark */}
              <Input
                label="Landmark (Optional)"
                value={landmark}
                onChangeText={setLandmark}
                placeholder="e.g. Opposite Infocity Park / Near SBI ATM"
              />

              {/* 6. City */}
              <Input
                label="City *"
                value={city}
                onChangeText={(t) => {
                  setCity(t);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                error={errors.city}
                placeholder="e.g. Bhubaneswar"
              />

              {/* 7. State */}
              <Input
                label="State *"
                value={state}
                onChangeText={(t) => {
                  setState(t);
                  if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
                }}
                error={errors.state}
                placeholder="e.g. Odisha"
              />

              {/* 8. Pincode */}
              <Input
                label="6-Digit Pincode *"
                value={pincode}
                onChangeText={(t) => {
                  const cleaned = t.replace(/\D/g, '').slice(0, 6);
                  setPincode(cleaned);
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                }}
                error={errors.pincode}
                placeholder="e.g. 751024"
                keyboardType="numeric"
                maxLength={6}
              />

              {/* 9. Set as Default Checkbox */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDefault(!isDefault)}
                style={styles.defaultCheckboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isDefault && styles.checkboxBoxActive
                  ]}
                >
                  {isDefault && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <View style={styles.checkboxTextWrapper}>
                  <Text style={styles.checkboxTitle}>
                    Make this my default delivery address
                  </Text>
                  <Text style={styles.checkboxSubtitle}>
                    Automatically pre-selected during checkout
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Form Action Buttons */}
              <View style={styles.formButtonRow}>
                <Button
                  title={editingId ? 'Update Address' : 'Save & Deliver Here'}
                  onPress={handleSaveAddress}
                  loading={isSubmitting}
                  size="md"
                  style={styles.saveBtn}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancelForm}
                  size="md"
                  style={styles.cancelBtn}
                />
              </View>
            </View>
          ) : (
            /* ========================================================================= */
            /* SAVED ADDRESSES LIST & EMPTY STATE                                        */
            /* ========================================================================= */
            <View>
              {/* Add New Address CTA Button (visible when saved addresses exist) */}
              {addresses.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenAddForm}
                  style={styles.addNewButton}
                  accessibilityRole="button"
                  accessibilityLabel="Add new delivery address"
                >
                  <View style={styles.addNewIconWrapper}>
                    <Text style={styles.addNewIcon}>＋</Text>
                  </View>
                  <View style={styles.addNewTextWrapper}>
                    <Text style={styles.addNewTitle}>Add New Delivery Address</Text>
                    <Text style={styles.addNewSubtitle}>
                      Save home, work, or other locations for quick checkout
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Saved Addresses Section Title */}
              {addresses.length > 0 && (
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Saved Addresses ({addresses.length})
                  </Text>
                  <Text style={styles.sectionHint}>Tap card to deliver here</Text>
                </View>
              )}

              {/* Empty State */}
              {addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <EmptyState
                    icon="📍"
                    title="No Saved Addresses"
                    description="You haven’t added any delivery addresses yet. Add your address to get fresh groceries delivered in 10-15 minutes."
                    actionLabel="＋ Add Your First Address"
                    onAction={handleOpenAddForm}
                  />
                </View>
              ) : (
                /* Address Cards */
                addresses.map((addr) => {
                  const isSelected = selectedId === addr.id;
                  const addrType = addr.type || 'HOME';
                  const isHome = addrType === 'HOME';
                  const isWork = addrType === 'WORK';
                  const streetDisplay = addr.street || [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ') || 'Saved Location';
                  const pincodeDisplay = addr.pincode || addr.postalCode || '';
                  const cityDisplay = addr.city || 'Bhubaneswar';
                  const stateDisplay = addr.state || 'Odisha';
                  const cityStatePincode = [cityDisplay, stateDisplay].filter(Boolean).join(', ') + (pincodeDisplay ? ` - ${pincodeDisplay}` : '');

                  return (
                    <TouchableOpacity
                      key={addr.id}
                      activeOpacity={0.85}
                      onPress={() => handleSelectAddress(addr)}
                      style={[
                        styles.addressCard,
                        isSelected && styles.addressCardSelected
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Address ${addrType}: ${streetDisplay}. Tap to deliver here.`}
                    >
                      {/* Top Row: Type Pill, Default Pill, and Radio Button */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.badgeRow}>
                          {/* Type Pill */}
                          <View
                            style={[
                              styles.typePill,
                              isHome
                                ? styles.typePillHome
                                : isWork
                                ? styles.typePillWork
                                : styles.typePillOther
                            ]}
                          >
                            <Text
                              style={[
                                styles.typePillText,
                                isHome
                                ? styles.typePillTextHome
                                : isWork
                                ? styles.typePillTextWork
                                : styles.typePillTextOther
                              ]}
                            >
                              {isHome ? '🏠 HOME' : isWork ? '🏢 WORK' : '📍 OTHER'}
                            </Text>
                          </View>

                          {/* Default Pill */}
                          {addr.isDefault && (
                            <View style={styles.defaultPill}>
                              <Text style={styles.defaultPillText}>⭐ DEFAULT</Text>
                            </View>
                          )}
                        </View>

                        {/* Radio Selection Indicator */}
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>

                      {/* Contact Info (Receiver Name & Phone) */}
                      {(addr.contactName || addr.contactPhone) && (
                         <View style={styles.contactRow}>
                           <Text style={styles.contactText} numberOfLines={1}>
                             👤 {addr.contactName || 'Receiver'}
                             {addr.contactPhone ? `  •  📞 +91 ${addr.contactPhone}` : ''}
                           </Text>
                         </View>
                       )}

                      {/* Full Formatted Address */}
                      <Text style={styles.streetText}>{streetDisplay}</Text>

                      {addr.landmark ? (
                        <Text style={styles.landmarkText}>
                          📍 Near: {addr.landmark}
                        </Text>
                      ) : null}

                      <Text style={styles.cityPincodeText}>
                        {cityStatePincode}
                      </Text>

                      {/* Card Action Row */}
                      <View style={styles.cardActionRow}>
                        {/* Left: Active delivery status or Deliver Here button */}
                        {isSelected ? (
                          <View style={styles.selectedStatusBadge}>
                            <Text style={styles.selectedStatusText}>
                              ✓ Delivering Here
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleSelectAddress(addr)}
                            style={styles.deliverHereBtn}
                          >
                            <Text style={styles.deliverHereText}>Deliver Here</Text>
                          </TouchableOpacity>
                        )}

                        {/* Right: Set Default, Edit, Delete */}
                        <View style={styles.actionButtonsRight}>
                          {!addr.isDefault && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleSetDefault(addr)}
                              style={styles.actionLinkBtn}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Text style={styles.setDefaultLinkText}>
                                Set Default
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleEditAddress(addr)}
                            style={styles.iconActionBtn}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            accessibilityLabel="Edit address"
                          >
                            <Text style={styles.iconActionText}>✏️ Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleDeleteAddress(addr)}
                            style={styles.iconActionBtn}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            accessibilityLabel="Delete address"
                          >
                            <Text style={styles.deleteActionText}>🗑️ Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  keyboardContainer: {
    flex: 1
  },
  content: {
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: typography.weights.medium
  },

  /* Add New Address CTA */
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  addNewIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  addNewIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: typography.weights.bold
  },
  addNewTextWrapper: {
    flex: 1
  },
  addNewTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  addNewSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  sectionHint: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted
  },

  /* Saved Address Card */
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap'
  },
  typePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    borderWidth: 1
  },
  typePillHome: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryBorder
  },
  typePillWork: {
    backgroundColor: colors.infoSurface,
    borderColor: '#BFDBFE'
  },
  typePillOther: {
    backgroundColor: colors.warningSurface,
    borderColor: '#FDE68A'
  },
  typePillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  typePillTextHome: {
    color: colors.primaryDark
  },
  typePillTextWork: {
    color: colors.info
  },
  typePillTextOther: {
    color: '#B45309'
  },
  defaultPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.xs
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: '#92400E'
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
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

  /* Contact & Address Text */
  contactRow: {
    marginTop: spacing.xs,
    marginBottom: 4
  },
  contactText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  streetText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    lineHeight: 20
  },
  landmarkText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 3
  },
  cityPincodeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* Action Buttons Row */
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  selectedStatusBadge: {
    backgroundColor: colors.primarySurface,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  selectedStatusText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  deliverHereBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.sm
  },
  deliverHereText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.textInverse
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  actionLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  setDefaultLinkText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  iconActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },
  deleteActionText: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.danger
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  emptyIcon: {
    fontSize: 32
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  emptyButton: {
    minWidth: 200
  },

  /* One-Column Mobile Form */
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm
  },
  formTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  formSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  formCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formCloseText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold
  },
  formFieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
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

  /* Default Checkbox Row */
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surface
  },
  checkboxBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxCheckmark: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: typography.weights.extrabold
  },
  checkboxTextWrapper: {
    flex: 1
  },
  checkboxTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  checkboxSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2
  },

  /* Form Action Buttons */
  formButtonRow: {
    gap: spacing.sm
  },
  saveBtn: {
    width: '100%'
  },
  cancelBtn: {
    width: '100%'
  }
});
