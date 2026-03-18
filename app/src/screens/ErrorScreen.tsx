import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ErrorRoute = RouteProp<RootStackParamList, 'Error'>;

export function ErrorScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<ErrorRoute>();
  const type = params?.type ?? 'generic';
  const message = params?.message;

  const config = {
    notFound: {
      emoji: '🔍',
      title: 'Lost in the learning galaxy?',
      subtitle: "Our AI buddy couldn't find this. Let's get you back!",
      badge: '404',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
    },
    server: {
      emoji: '🤖',
      title: "Our servers are taking a quick nap! 😴",
      subtitle: "Our AI helpers are fixing things! Try again in a moment.",
      badge: '5XX',
      badgeBg: '#ffe4e6',
      badgeColor: '#be123c',
    },
    generic: {
      emoji: '🤖',
      title: "Oops! Something went wobbly",
      subtitle: message || "Our friendly AI helper got confused. Don't worry—we're on it!",
      badge: 'Oops',
      badgeBg: '#e0e7ff',
      badgeColor: '#4338ca',
    },
  };

  const c = config[type];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{c.emoji}</Text>
        <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
          <Text style={[styles.badgeText, { color: c.badgeColor }]}>{c.badge}</Text>
        </View>
        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.subtitle}>{c.subtitle}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryButton, type === 'server' && styles.roseButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>← Go back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.secondaryButtonText}>🏠 Go home</Text>
          </TouchableOpacity>
        </View>
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
  },
  content: { alignItems: 'center', maxWidth: 340 },
  emoji: { fontSize: 80, marginBottom: spacing.md },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
  title: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  buttons: { gap: spacing.md, width: '100%' },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  roseButton: { backgroundColor: '#e11d48' },
  primaryButtonText: { ...typography.button, color: '#fff' },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand[200],
  },
  secondaryButtonText: { ...typography.button, color: colors.primary },
});
