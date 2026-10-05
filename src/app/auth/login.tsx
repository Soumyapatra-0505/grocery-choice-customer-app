/**
 * Grocery Choice Customer App - Login & OTP Verification Screen
 * Route: /auth/login
 *
 * Upgraded to match the Grocery Choice mobile design:
 * - Emerald quick-commerce design system & branding
 * - Mobile number login with styled +91 prefix
 * - 10-digit Indian mobile validation (starts with 6-9)
 * - "Get Verification Code →" action with loading spinner
 * - OTP entry screen with individual digit cells & active focus highlight
 * - Supports actual backend 6-digit OTP length (and 4-digit switchable fallback)
 * - Resend OTP with visual 60-second cooldown timer
 * - Change / Edit mobile number action
 * - Informative loading, invalid mobile, invalid OTP, and network retry states
 * - Safe return to intended screen (params.redirect or previous route)
 * - Session persistence via storageService
 * - Session expiry and logout handling
 * - Android & iOS safe-area support, no horizontal clipping
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/services/authContext';
import { validatePhone, validateOtp } from '@/utils/validators';
import { storageService } from '@/storage/storage';
import { APP_CONFIG } from '@/constants/config';

type AuthStep = 'PHONE' | 'OTP';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    redirect?: string;
    sessionExpired?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, login, logout } = useAuth();

  // Step state
  const [step, setStep] = useState<AuthStep>('PHONE');

  // Input states
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState<4 | 6>(6); // Default 6 matches actual backend length

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Resend cooldown timer in seconds
  const [cooldown, setCooldown] = useState(0);

  // Dev OTP hint (development convenience only - never logged)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Refs
  const phoneInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Auto-focus phone on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (step !== 'OTP' || cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, cooldown]);

  // Handle Close / Dismiss
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Format phone display
  const handlePhoneChange = (text: string) => {
    // Strip non-digits and any accidental +91 prefix
    let clean = text.replace(/\D/g, '');
    if (clean.startsWith('91') && clean.length > 10) {
      clean = clean.substring(2);
    } else if (clean.startsWith('0') && clean.length > 10) {
      clean = clean.substring(1);
    }
    clean = clean.slice(0, 10);

    setPhone(clean);
    if (phoneError) setPhoneError('');
    if (networkError) setNetworkError('');
  };

  // Step 1: Send OTP
  const handleSendOtp = async (isResend = false) => {
    setNetworkError('');
    setSuccessToast('');

    const targetPhone = isResend ? normalizedPhone : phone;
    const val = validatePhone(targetPhone);

    if (!val.isValid) {
      setPhoneError(val.error || 'Please enter a valid 10-digit mobile number');
      phoneInputRef.current?.focus();
      return;
    }

    setPhoneError('');
    setIsLoading(true);

    try {
      setNormalizedPhone(val.normalized);
      const res = await authApi.sendOtp(val.normalized, 'LOGIN');

      // Set cooldown from response (defaults to 60s)
      const waitSeconds = (res as any)?.cooldownSeconds || 60;
      setCooldown(waitSeconds);

      if (isResend) {
        setOtp('');
        setOtpError('');
        setSuccessToast(`A fresh verification code was sent to +91 ${val.normalized}`);
      } else {
        setStep('OTP');
      }

      // Check development OTP endpoint convenience (disabled on production)
      try {
        const devRes = await authApi.getDevOtp(val.normalized);
        if (devRes && devRes.otp) {
          setDevOtpHint(devRes.otp);
        }
      } catch {
        // Dev endpoint might be 404 or disabled in production - safe to ignore
      }

      // Focus OTP input after state transition
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          // Rate limited
          setCooldown(60);
          setNetworkError(err.message || 'Please wait before requesting another code.');
        } else if (err.status === 0 || err.status === 408) {
          setNetworkError('Network error. Unable to connect to Grocery Choice server.');
        } else {
          setPhoneError(err.message || 'Unable to send OTP. Please check your mobile number.');
        }
      } else {
        setNetworkError(err.message || 'Unable to connect. Please check your internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (text: string) => {
    const numeric = text.replace(/\D/g, '').slice(0, otpLength);
    setOtp(numeric);
    if (otpError) setOtpError('');
    if (networkError) setNetworkError('');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setNetworkError('');

    if (!validateOtp(otp) || otp.length < (otpLength === 6 ? 6 : 4)) {
      setOtpError(`Please enter the complete ${otpLength}-digit verification code`);
      otpInputRef.current?.focus();
      return;
    }

    setOtpError('');
    setIsLoading(true);

    try {
      const res = await authApi.verifyOtp(normalizedPhone, otp.trim(), name.trim());
      if (res && res.token && res.user) {
        // Persist session into AuthContext and storage
        await login(res.token, res.user);

        // Verify session was persisted in storage
        await storageService.setAuthToken(res.token);
        await storageService.setUserProfile(res.user);

        // Safe return to intended screen
        if (params.redirect) {
          router.replace(params.redirect as any);
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      } else {
        throw new Error('Verification completed without valid customer session');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setOtpError(err.message || 'Incorrect or expired OTP. Please try again.');
        } else if (err.status === 0 || err.status === 408) {
          setNetworkError('Network timeout. Please check your connection and retry.');
        } else {
          setOtpError(err.message || 'Verification failed. Please request a new OTP.');
        }
      } else {
        setOtpError(err.message || 'The OTP entered is incorrect or expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Switch to Edit Phone Number
  const handleChangeNumber = () => {
    setStep('PHONE');
    setOtp('');
    setOtpError('');
    setNetworkError('');
    setSuccessToast('');
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 250);
  };

  // Action: Toggle OTP length support (6-digit default vs 4-digit)
  const handleToggleOtpLength = () => {
    const nextLength = otpLength === 6 ? 4 : 6;
    setOtpLength(nextLength);
    setOtp((prev) => prev.slice(0, nextLength));
    setOtpError('');
  };

  // Action: Handle User Logout (if already signed in)
  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Grocery Choice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setPhone('');
          setNormalizedPhone('');
          setOtp('');
          setStep('PHONE');
        }
      }
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Navigation Top Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={step === 'OTP' ? handleChangeNumber : handleClose}
            accessibilityRole="button"
            accessibilityLabel={step === 'OTP' ? 'Back to phone input' : 'Close login'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerButton}
          >
            <Text style={styles.headerIconText}>{step === 'OTP' ? '←' : '✕'}</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {step === 'PHONE' ? 'Sign In / Register' : 'Verify Mobile'}
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Presentation Card */}
          <View style={styles.brandHero}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandIcon}>🌿</Text>
            </View>
            <Text style={styles.brandName}>{APP_CONFIG.APP_NAME}</Text>
            <View style={styles.slaBadge}>
              <Text style={styles.slaBadgeText}>⚡ 10–15 MINS DELIVERY</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              Fresh groceries, daily essentials, and quick snacks at your doorstep
            </Text>
          </View>

          {/* Session Expiry Banner (if triggered) */}
          {params.sessionExpired === 'true' && (
            <View style={styles.sessionExpiredBanner}>
              <Text style={styles.sessionExpiredIcon}>⚠️</Text>
              <Text style={styles.sessionExpiredText}>
                Your session has expired. Please verify your mobile number to continue shopping.
              </Text>
            </View>
          )}

          {/* If already authenticated, show current session banner with quick actions */}
          {isAuthenticated && user && step === 'PHONE' && (
            <View style={styles.existingAuthCard}>
              <View style={styles.existingAuthHeader}>
                <Text style={styles.existingAuthIcon}>👤</Text>
                <View style={styles.existingAuthInfo}>
                  <Text style={styles.existingAuthTitle}>Signed In</Text>
                  <Text style={styles.existingAuthSubtitle}>
                    {user.name ? `${user.name} • ` : ''}+91 {user.phone}
                  </Text>
                </View>
              </View>

              <View style={styles.existingAuthActions}>
                <Button
                  title="Continue to App →"
                  size="sm"
                  onPress={handleClose}
                  style={styles.continueButton}
                />
                <Button
                  title="Switch Account"
                  size="sm"
                  variant="outline"
                  onPress={handleLogout}
                  style={styles.switchButton}
                />
              </View>
            </View>
          )}

          {/* Main Card Container */}
          <View style={styles.card}>
            {step === 'PHONE' ? (
              /* ================= STEP 1: MOBILE NUMBER ENTRY ================= */
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Enter your mobile number</Text>
                <Text style={styles.stepDesc}>
                  We'll send an SMS with a verification code to authenticate your account.
                </Text>

                {/* Network / General Error Banner */}
                {networkError ? (
                  <View style={styles.networkErrorBox}>
                    <Text style={styles.networkErrorText}>{networkError}</Text>
                    <TouchableOpacity
                      onPress={() => handleSendOtp(false)}
                      style={styles.retryButton}
                    >
                      <Text style={styles.retryButtonText}>Retry ↺</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Phone Input with +91 Prefix */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View
                    style={[
                      styles.phoneInputContainer,
                      phoneError ? styles.inputErrorBorder : null,
                      phone.length === 10 && !phoneError ? styles.inputValidBorder : null
                    ]}
                  >
                    <View style={styles.prefixBox}>
                      <Text style={styles.flagIcon}>🇮🇳</Text>
                      <Text style={styles.prefixText}>+91</Text>
                      <View style={styles.prefixDivider} />
                    </View>

                    <TextInput
                      ref={phoneInputRef}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile"
                      placeholderTextColor={colors.textMuted}
                      style={styles.phoneTextInput}
                      accessibilityLabel="10-digit mobile number"
                    />

                    {phone.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setPhone('');
                          setPhoneError('');
                        }}
                        style={styles.clearButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {phoneError ? (
                    <Text style={styles.fieldErrorText}>{phoneError}</Text>
                  ) : (
                    <Text style={styles.fieldHelperText}>
                      An OTP will be sent to this number for quick verification
                    </Text>
                  )}
                </View>

                {/* Primary Action Button */}
                <Button
                  title={isLoading ? 'Sending Code...' : 'Get Verification Code →'}
                  onPress={() => handleSendOtp(false)}
                  loading={isLoading}
                  disabled={isLoading}
                  size="lg"
                  style={styles.primaryActionButton}
                />

                {/* Trust Badges */}
                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <Text style={styles.trustIcon}>⚡</Text>
                    <Text style={styles.trustText}>10–15 Mins</Text>
                  </View>
                  <View style={styles.trustDot} />
                  <View style={styles.trustItem}>
                    <Text style={styles.trustIcon}>🛡️</Text>
                    <Text style={styles.trustText}>100% Genuine</Text>
                  </View>
                  <View style={styles.trustDot} />
                  <View style={styles.trustItem}>
                    <Text style={styles.trustIcon}>🔒</Text>
                    <Text style={styles.trustText}>Secure Login</Text>
                  </View>
                </View>

                {/* Terms Disclaimer */}
                <Text style={styles.termsText}>
                  By proceeding, you agree to Grocery Choice{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </View>
            ) : (
              /* ================= STEP 2: OTP VERIFICATION ================= */
              <View style={styles.stepContainer}>
                <View style={styles.otpHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Verify Mobile</Text>
                    <Text style={styles.stepDesc}>
                      Enter the {otpLength}-digit code sent to
                    </Text>
                    <View style={styles.phoneHighlightRow}>
                      <Text style={styles.phoneHighlightText}>+91 {normalizedPhone}</Text>
                      <TouchableOpacity
                        onPress={handleChangeNumber}
                        accessibilityRole="button"
                        accessibilityLabel="Edit mobile number"
                        style={styles.editPhoneBadge}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.editPhoneText}>Edit ✎</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Success Toast / Notification */}
                {successToast ? (
                  <View style={styles.successToastBox}>
                    <Text style={styles.successToastText}>{successToast}</Text>
                  </View>
                ) : null}

                {/* Network / Server Error Banner */}
                {networkError ? (
                  <View style={styles.networkErrorBox}>
                    <Text style={styles.networkErrorText}>{networkError}</Text>
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      style={styles.retryButton}
                    >
                      <Text style={styles.retryButtonText}>Retry ↺</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Dev OTP Helper Banner (Dev Environment Only) */}
                {devOtpHint ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setOtp(devOtpHint.slice(0, otpLength));
                      setOtpError('');
                    }}
                    style={styles.devOtpBanner}
                  >
                    <Text style={styles.devOtpText}>
                      💡 Dev Mode: Tap to auto-fill code{' '}
                      <Text style={{ fontWeight: typography.weights.bold }}>
                        {devOtpHint.slice(0, otpLength)}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* OTP Digit Boxes */}
                <View style={styles.otpSection}>
                  <Text style={styles.inputLabel}>{otpLength}-Digit Verification Code</Text>

                  <View style={styles.otpBoxesWrapper}>
                    <View style={styles.otpBoxesRow}>
                      {Array.from({ length: otpLength }).map((_, idx) => {
                        const digit = otp[idx] || '';
                        const isFocused = otp.length === idx;
                        const isFilled = !!digit;
                        const hasError = !!otpError;

                        return (
                          <View
                            key={idx}
                            style={[
                              styles.otpBox,
                              otpLength === 6 ? styles.otpBox6 : styles.otpBox4,
                              isFocused && styles.otpBoxFocused,
                              isFilled && styles.otpBoxFilled,
                              hasError && styles.otpBoxError
                            ]}
                          >
                            <Text
                              style={[
                                styles.otpDigitText,
                                hasError && styles.otpDigitTextError
                              ]}
                            >
                              {digit}
                            </Text>
                            {isFocused && !hasError && !digit && (
                              <View style={styles.otpCursor} />
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Transparent touch input over the boxes */}
                    <TextInput
                      ref={otpInputRef}
                      value={otp}
                      onChangeText={handleOtpChange}
                      keyboardType="number-pad"
                      maxLength={otpLength}
                      textContentType="oneTimeCode"
                      autoFocus
                      style={styles.otpOverlayInput}
                      accessibilityLabel="One Time Password"
                    />
                  </View>

                  {otpError ? (
                    <Text style={styles.fieldErrorText}>{otpError}</Text>
                  ) : null}

                  {/* 4-digit / 6-digit length switch option */}
                  <TouchableOpacity
                    onPress={handleToggleOtpLength}
                    style={styles.toggleLengthButton}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.toggleLengthText}>
                      {otpLength === 6
                        ? 'Using a 4-digit OTP? Switch to 4-digit'
                        : 'Using a 6-digit OTP? Switch to 6-digit'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Optional Full Name Input for Registration */}
                <View style={styles.nameInputWrapper}>
                  <Text style={styles.inputLabel}>Your Name (Optional)</Text>
                  <View style={styles.nameInputContainer}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textMuted}
                      style={styles.nameTextInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Verify Action Button */}
                <Button
                  title={isLoading ? 'Verifying...' : 'Verify & Continue →'}
                  onPress={handleVerifyOtp}
                  loading={isLoading}
                  disabled={isLoading}
                  size="lg"
                  style={styles.primaryActionButton}
                />

                {/* Resend OTP Section with Cooldown */}
                <View style={styles.resendContainer}>
                  {cooldown > 0 ? (
                    <View style={styles.cooldownBadge}>
                      <Text style={styles.cooldownIcon}>⏱️</Text>
                      <Text style={styles.cooldownText}>
                        Resend OTP in{' '}
                        <Text style={styles.cooldownSecondsText}>
                          {Math.floor(cooldown / 60)}:
                          {cooldown % 60 < 10 ? `0${cooldown % 60}` : cooldown % 60}
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendOtp(true)}
                      disabled={isLoading}
                      style={styles.resendActiveButton}
                    >
                      <Text style={styles.resendActiveText}>
                        Didn't receive code? <Text style={styles.resendUnderline}>Resend OTP</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardContainer: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  headerIconText: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  scrollContent: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: 'center'
  },

  /* Brand Presentation */
  brandHero: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm
  },
  brandIcon: {
    fontSize: 32
  },
  brandName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    letterSpacing: -0.5,
    marginTop: 2
  },
  slaBadge: {
    backgroundColor: colors.deliveryPill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.xs
  },
  slaBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: spacing.xs,
    lineHeight: 18
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.md
  },
  stepContainer: {
    width: '100%'
  },
  stepTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  stepDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },

  /* Input Elements */
  inputWrapper: {
    marginTop: spacing.md
  },
  inputLabel: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 50,
    overflow: 'hidden'
  },
  inputErrorBorder: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2'
  },
  inputValidBorder: {
    borderColor: colors.primary
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.surfaceHover,
    alignSelf: 'stretch'
  },
  flagIcon: {
    fontSize: 16,
    marginRight: 4
  },
  prefixText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  prefixDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderDark,
    marginLeft: spacing.xs + 2
  },
  phoneTextInput: {
    flex: 1,
    fontSize: typography.sizes.base + 1,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    letterSpacing: 1
  },
  clearButton: {
    padding: spacing.sm
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: typography.weights.bold
  },
  fieldErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    marginTop: 4,
    fontWeight: typography.weights.semibold
  },
  fieldHelperText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    marginTop: 4
  },

  /* Step 2 Specific */
  otpHeaderRow: {
    marginBottom: spacing.sm
  },
  phoneHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  phoneHighlightText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark
  },
  editPhoneBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  editPhoneText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },

  /* OTP Boxes */
  otpSection: {
    marginTop: spacing.md
  },
  otpBoxesWrapper: {
    position: 'relative',
    marginVertical: spacing.xs
  },
  otpBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  otpBox: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  otpBox6: {
    width: 44
  },
  otpBox4: {
    width: 60
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
    ...shadows.sm
  },
  otpBoxFilled: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.surface
  },
  otpBoxError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2'
  },
  otpDigitText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary
  },
  otpDigitTextError: {
    color: colors.dangerDark
  },
  otpCursor: {
    position: 'absolute',
    bottom: 8,
    width: 16,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1
  },
  otpOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent'
  },
  toggleLengthButton: {
    alignSelf: 'center',
    marginTop: spacing.xs + 2
  },
  toggleLengthText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    textDecorationLine: 'underline'
  },

  /* Optional Name */
  nameInputWrapper: {
    marginTop: spacing.md
  },
  nameInputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 2
  },
  nameTextInput: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary
  },

  /* Actions */
  primaryActionButton: {
    marginTop: spacing.lg
  },

  /* Resend & Cooldown */
  resendContainer: {
    marginTop: spacing.md,
    alignItems: 'center'
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  cooldownIcon: {
    fontSize: 12,
    marginRight: 4
  },
  cooldownText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary
  },
  cooldownSecondsText: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  resendActiveButton: {
    paddingVertical: spacing.xs
  },
  resendActiveText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary
  },
  resendUnderline: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
    textDecorationLine: 'underline'
  },

  /* Error & Toast Banners */
  networkErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  networkErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.dangerDark,
    flex: 1,
    marginRight: spacing.xs
  },
  retryButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold
  },
  successToastBox: {
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs
  },
  successToastText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold
  },
  devOtpBanner: {
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs
  },
  devOtpText: {
    fontSize: typography.sizes.xs,
    color: '#92400E'
  },

  /* Trust & Footer */
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trustIcon: {
    fontSize: 12,
    marginRight: 3
  },
  trustText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.borderDark,
    marginHorizontal: spacing.xs + 2
  },
  termsText: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.weights.semibold
  },

  /* Existing Session & Expiry */
  sessionExpiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md
  },
  sessionExpiredIcon: {
    fontSize: 18,
    marginRight: spacing.xs
  },
  sessionExpiredText: {
    fontSize: typography.sizes.xs,
    color: '#92400E',
    flex: 1,
    lineHeight: 16
  },
  existingAuthCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  existingAuthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  existingAuthIcon: {
    fontSize: 22,
    marginRight: spacing.xs + 2
  },
  existingAuthInfo: {
    flex: 1
  },
  existingAuthTitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold
  },
  existingAuthSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold
  },
  existingAuthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  continueButton: {
    flex: 1
  },
  switchButton: {
    flex: 1
  }
});
