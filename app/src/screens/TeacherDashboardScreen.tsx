import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
}

export function TeacherDashboardScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    apiJson<Profile>('/api/teacher/profile')
      .then(setProfile)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('dashboard')}</Text>
      <Text style={styles.welcome}>{t('welcome')}, {profile?.name || profile?.email || 'Teacher'}!</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.row}><Text style={styles.bold}>Name:</Text> {profile?.name || '-'}</Text>
        <Text style={styles.row}><Text style={styles.bold}>Email:</Text> {profile?.email || '-'}</Text>
        <Text style={styles.row}><Text style={styles.bold}>Phone:</Text> {profile?.phone || '-'}</Text>
      </Card>
      <TouchableOpacity
        style={styles.privacyCard}
        onPress={() => navigation.navigate('TeacherPrivacy')}
      >
        <Text style={styles.privacyIcon}>🔒</Text>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Privacy & Data</Text>
          <Text style={styles.privacyHint}>View data, download or delete</Text>
        </View>
        <Text style={styles.privacyArrow}>→</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('TeacherBatches')}>
          <Text style={styles.btnText}>Batches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('TeacherClasses')}>
          <Text style={styles.btnText}>{t('myClasses')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loading: { ...typography.body, color: colors.primary },
  error: { ...typography.body, color: colors.error },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.sm },
  welcome: { ...typography.body, marginBottom: spacing.md },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.brand[800], marginBottom: spacing.sm },
  row: { ...typography.bodySmall, marginBottom: spacing.xs },
  bold: { fontWeight: '600' },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  privacyIcon: { fontSize: 24, marginRight: spacing.md },
  privacyText: { flex: 1 },
  privacyTitle: { ...typography.body, fontWeight: '600', color: colors.brand[800] },
  privacyHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  privacyArrow: { ...typography.body, color: colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12 },
  btnText: { ...typography.button, color: '#fff' },
});
