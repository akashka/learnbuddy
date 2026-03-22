import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { apiJson } from '../lib/api';
import { useResendOtpTimer } from '../hooks/useResendOtpTimer';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ParentRegisterStartScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<Nav>();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();

  const handleSubmitPhone = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiJson<{ exists?: boolean; isComplete?: boolean; redirect?: string }>(
        '/api/parent-registration/check-phone',
        { method: 'POST', body: JSON.stringify({ phone }) }
      );
      if (res.isComplete && res.redirect) {
        navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' }] });
        return;
      }
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      setExisting(res.exists ?? false);
      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'parent' }) }
      );
      if (otpRes.success) {
        setStep('otp');
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to send OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to check phone');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'parent' }) }
      );
      if (otpRes.success) {
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      await apiJson<{ success?: boolean }>(
        '/api/registration/verify-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, otp: otp.trim(), type: 'parent' }) }
      );
      navigation.navigate('ParentRegisterForm', { phone: normalized, existing });
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    const normalized = String(phone).replace(/\D/g, '').slice(-4);
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.otpHint}>OTP sent to ******{normalized}. Enter the 6-digit code.</Text>
          <Input
            label="OTP"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
          />
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={!canResend || loading}
            style={[styles.resendBtn, (!canResend || loading) && styles.resendBtnDisabled]}
          >
            <Text style={[styles.resendText, (!canResend || loading) && styles.resendTextDisabled]}>
              {canResend ? 'Resend OTP' : `Resend OTP in ${secondsLeft}s`}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={loading ? 'Verifying...' : 'Verify & Continue'} onPress={handleVerifyOtp} loading={loading} />
          <TouchableOpacity onPress={() => setStep('phone')} style={styles.toggle}>
            <Text style={styles.toggleText}>Change phone number</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Parent Registration</Text>
        <Input
          label="Phone Number"
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={loading ? 'Sending OTP...' : 'Send OTP'} onPress={handleSubmitPhone} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  otpHint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  resendBtn: { marginBottom: spacing.md },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { ...typography.bodySmall, color: colors.primary },
  resendTextDisabled: { color: colors.textSecondary },
  toggle: { marginBottom: spacing.md },
  toggleText: { ...typography.bodySmall, color: colors.primary },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
});
