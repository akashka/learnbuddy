import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useResendOtpTimer } from '../hooks/useResendOtpTimer';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [useStudentId, setUseStudentId] = useState(false);
  const [usePhoneOtp, setUsePhoneOtp] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithStudentId, sendOtp, loginWithOtp } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      if (result?.success) {
        setOtpSent(true);
        startResendTimer();
      } else {
        setError('Failed to send OTP. Phone may not be registered.');
      }
    } catch {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      if (result?.success) {
        startResendTimer();
      } else {
        setError('Failed to resend OTP.');
      }
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await loginWithOtp(phone.trim(), otp.trim());
      if (ok) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        setError('Invalid or expired OTP. Please try again.');
      }
    } catch {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let ok = false;
      if (useStudentId) {
        ok = await loginWithStudentId(studentId.trim(), password);
      } else {
        ok = await login(email.trim(), password);
      }
      if (ok) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (usePhoneOtp) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('login')}</Text>
          {!otpSent ? (
            <>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title={loading ? 'Sending OTP...' : 'Send OTP'} onPress={handleSendOtp} loading={loading} />
            </>
          ) : (
            <>
              <Text style={styles.otpHint}>OTP sent to ******{phone.slice(-4)}. Enter the 6-digit code.</Text>
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
              <Button title={loading ? 'Verifying...' : 'Verify & Login'} onPress={handleVerifyOtp} loading={loading} />
            </>
          )}
          <TouchableOpacity
            onPress={() => {
              setUsePhoneOtp(false);
              setOtpSent(false);
              setOtp('');
              setError('');
            }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>Back to email login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>{t('register')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('login')}</Text>
        {useStudentId ? (
          <Input
            label="Student ID"
            value={studentId}
            onChangeText={setStudentId}
            placeholder="e.g. LB12345"
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <Input
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <Input
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        <TouchableOpacity onPress={() => setUseStudentId(!useStudentId)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {useStudentId ? 'Use email instead' : 'Login with Student ID'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setUsePhoneOtp(true)} style={styles.toggle}>
          <Text style={styles.toggleText}>Login with Phone (OTP)</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={loading ? 'Signing in...' : t('login')} onPress={handleSubmit} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>{t('register')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  toggle: { marginBottom: spacing.md },
  toggleText: { ...typography.bodySmall, color: colors.primary },
  otpHint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  resendBtn: { marginBottom: spacing.md },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { ...typography.bodySmall, color: colors.primary },
  resendTextDisabled: { color: colors.textSecondary },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { ...typography.bodySmall, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: '600' },
});
