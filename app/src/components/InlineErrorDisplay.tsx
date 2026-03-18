import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ApiError } from '../lib/api';
import { colors, spacing, radius, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface InlineErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
}

export function InlineErrorDisplay({ error, onRetry }: InlineErrorDisplayProps) {
  const navigation = useNavigation<Nav>();
  const err = typeof error === 'string' ? new Error(error) : error;
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 0;
  const is5xx = statusCode >= 500;
  const is404 = statusCode === 404;

  const handleGoToError = () => {
    if (is404) navigation.navigate('Error', { type: 'notFound' });
    else if (is5xx) navigation.navigate('Error', { type: 'server' });
    else navigation.navigate('Error', { type: 'generic', message: err.message });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>
        {is404 ? '🔍' : is5xx ? '🤖' : '🤖'}
      </Text>
      <Text style={styles.title}>
        {is404 ? "Couldn't find this" : is5xx ? "Our servers are resting!" : "Oops! Something went wobbly"}
      </Text>
      <Text style={styles.message}>
        {is404
          ? "Our AI buddy looked everywhere but this doesn't exist."
          : is5xx
            ? "Our AI helpers are fixing things! Try again in a moment. 🌟"
            : err.message || "Our friendly AI got confused. Give it another try!"}
      </Text>
      <View style={styles.buttons}>
        {onRetry && (
          <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.secondaryButtonText}>Go home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    margin: spacing.lg,
    borderWidth: 2,
    borderColor: colors.brand[200],
  },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  buttons: { gap: spacing.md },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  primaryButtonText: { ...typography.button, color: '#fff' },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.brand[200],
  },
  secondaryButtonText: { ...typography.button, color: colors.primary },
});
