/**
 * Grocery Choice Customer App - Login & OTP Verification Screen
 */

import React, { useState } from 'react';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/api/auth';
import { useAuth } from '@/services/authContext';
import { validatePhone, validateOtp } from '@/utils/validators';
import { APP_CONFIG } from '@/constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const handleSendOtp = async () => {
    const val = validatePhone(phone);
    if (!val.isValid) {
      setPhoneError(val.error || 'Please enter a valid 10-digit mobile number');
      return;
    }

    setPhoneError('');
    setIsLoading(true);
    try {
      setNormalizedPhone(val.normalized);
      await authApi.sendOtp(val.normalized, 'LOGIN');
      setStep('OTP');

      // Check dev OTP convenience in non-production or test backend
      try {
        const devRes = await authApi.getDevOtp(val.normalized);
        if (devRes && devRes.otp) {
          setDevOtpHint(devRes.otp);
        }
      } catch {
        // Dev endpoint might be disabled on prod, perfectly normal
      }
    } catch (err: any) {
      Alert.alert('Unable to Send OTP', err.message || 'Please check your mobile number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp(otp)) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpError('');
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(normalizedPhone, otp.trim(), name.trim());
      if (res && res.token && res.user) {
        await login(res.token, res.user);
        router.back();
      } else {
        throw new Error('Verification completed without valid user token');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'The OTP entered is incorrect or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {/* Header bar with close button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login or Sign Up</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.brandBox}>
          <Text style={styles.brandEmoji}>🌿</Text>
          <Text style={styles.brandName}>{APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.brandSubtitle}>Groceries delivered in 10-15 minutes</Text>
        </View>

        {step === 'PHONE' ? (
          /* Step 1: Phone Input */
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Enter your mobile number</Text>
            <Text style={styles.stepDesc}>
              We'll send a 6-digit OTP code to verify your phone number
            </Text>

            <Input
              prefix="+91"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (phoneError) setPhoneError('');
              }}
              error={phoneError}
              keyboardType="phone-pad"
              maxLength={14}
              placeholder="Enter 10-digit mobile number"
              containerStyle={{ marginTop: spacing.md }}
            />

            <Button
              title={isLoading ? 'Sending Code...' : 'Get Verification Code →'}
              onPress={handleSendOtp}
              loading={isLoading}
              size="lg"
              style={styles.actionButton}
            />

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </Text>
          </View>
        ) : (
          /* Step 2: OTP Input */
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Verify your mobile number</Text>
            <Text style={styles.stepDesc}>
              Enter the OTP sent to{' '}
              <Text style={styles.highlightPhone}>+91 {normalizedPhone}</Text>
            </Text>

            <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.changePhoneButton}>
              <Text style={styles.changePhoneText}>Edit mobile number</Text>
            </TouchableOpacity>

            {devOtpHint ? (
              <TouchableOpacity
                onPress={() => setOtp(devOtpHint)}
                style={styles.devOtpBanner}
              >
                <Text style={styles.devOtpText}>
                  💡 Dev OTP detected: <Text style={{ fontWeight: 'bold' }}>{devOtpHint}</Text> (Tap to fill)
                </Text>
              </TouchableOpacity>
            ) : null}

            <Input
              label="6-Digit OTP Code"
              value={otp}
              onChangeText={(t) => {
                setOtp(t);
                if (otpError) setOtpError('');
              }}
              error={otpError}
              keyboardType="numeric"
              maxLength={6}
              placeholder="000000"
              inputStyle={styles.otpInput}
            />

            <Input
              label="Your Name (Optional)"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />

            <Button
              title={isLoading ? 'Verifying...' : 'Verify & Continue →'}
              onPress={handleVerifyOtp}
              loading={isLoading}
              size="lg"
              style={styles.actionButton}
            />

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={isLoading}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  closeButton: {
    padding: spacing.xs
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold
  },
  headerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary
  },
  content: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
    justifyContent: 'center'
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  brandEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs
  },
  brandName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.md
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
  highlightPhone: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold
  },
  changePhoneButton: {
    alignSelf: 'flex-start',
    marginVertical: spacing.xs
  },
  changePhoneText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold
  },
  devOtpBanner: {
    backgroundColor: colors.primarySurface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  devOtpText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark
  },
  otpInput: {
    fontSize: typography.sizes.xl,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: typography.weights.bold
  },
  actionButton: {
    marginTop: spacing.md
  },
  termsText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16
  },
  resendButton: {
    marginTop: spacing.md,
    alignItems: 'center'
  },
  resendText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold
  }
});
