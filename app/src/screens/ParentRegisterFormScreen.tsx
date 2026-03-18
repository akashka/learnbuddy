import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { apiJson } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ParentRegisterForm'>;

export function ParentRegisterFormScreen() {
  const route = useRoute<Route>();
  const { phone } = route.params || { phone: '' };
  const [form, setForm] = useState({ name: '', email: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<Nav>();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    if (!phone) navigation.navigate('ParentRegister');
  }, [phone, navigation]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiJson<{
        success?: boolean;
        isComplete?: boolean;
        token?: string;
        user?: { id: string; email: string; role: string };
      }>('/api/parent-registration/save', {
        method: 'POST',
        body: JSON.stringify({ phone, data: form, complete: true }),
      });
      if (res.isComplete && res.token && res.user) {
        await loginWithToken(res.token, res.user);
        navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' }] });
      } else {
        setError('Registration could not be completed');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Registration</Text>
        <Input
          label="Name"
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Your name"
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Location (optional)"
          value={form.location}
          onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
          placeholder="City, State"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={loading ? 'Saving...' : 'Complete Registration'} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
});
