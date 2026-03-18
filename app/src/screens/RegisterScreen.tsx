import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, radius, typography, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RegisterScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const cardWidth = width > 500 ? (width - spacing.lg * 3) / 2 : width - spacing.lg * 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose your role</Text>
      <View style={styles.cards}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ParentRegister')}
          style={[styles.card, { width: Math.min(cardWidth, 320), backgroundColor: '#e0f2fe' }]}
        >
          <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.cardTitle}>{t('parent')}</Text>
          <Text style={styles.cardDesc}>Register as a parent to find teachers for your kids</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('register')} as Parent</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TeacherRegister')}
          style={[styles.card, { width: Math.min(cardWidth, 320), backgroundColor: '#d1fae5' }]}
        >
          <Text style={styles.emoji}>👩‍🏫</Text>
          <Text style={styles.cardTitle}>{t('teacher')}</Text>
          <Text style={styles.cardDesc}>Register as a teacher to teach and earn</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('register')} as Teacher</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBold}>{t('login')}</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.lg },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand[200],
    ...shadow,
  },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  cardDesc: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  badge: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  badgeText: { ...typography.bodySmall, color: '#fff', fontWeight: '600' },
  link: { alignItems: 'center' },
  linkText: { ...typography.bodySmall, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: '600' },
});
