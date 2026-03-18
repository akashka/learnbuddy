import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';

interface Teacher {
  _id: string;
  name?: string;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  feeStartsFrom?: number;
}

export function ParentMarketplaceScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const cardWidth = width > 600 ? (width - spacing.lg * 4) / 3 : width - spacing.lg * 2;

  useEffect(() => {
    apiJson<Teacher[]>('/api/teachers/marketplace')
      .then(setTeachers)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('marketplace')}</Text>
      <View style={styles.grid}>
        {teachers.map((teacher) => (
          <Card key={teacher._id} style={StyleSheet.flatten([styles.card, { width: Math.min(cardWidth, 360) }])}>
            <Text style={styles.name}>{teacher.name || 'Teacher'}</Text>
            <Text style={styles.details}>
              {[teacher.board, teacher.classes, teacher.subjects].flat().filter(Boolean).join(' • ') || 'No details'}
            </Text>
            {teacher.averageRating != null && (
              <Text style={styles.rating}>Rating: {teacher.averageRating} ({teacher.reviewCount || 0} reviews)</Text>
            )}
            {teacher.feeStartsFrom != null && (
              <Text style={styles.fee}>{t('fee')}: ₹{teacher.feeStartsFrom}/month</Text>
            )}
          </Card>
        ))}
      </View>
      {teachers.length === 0 && <Text style={styles.empty}>No teachers found.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loading: { ...typography.body, color: colors.primary },
  error: { ...typography.body, color: colors.error },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { marginBottom: 0 },
  name: { ...typography.body, fontWeight: '600', color: colors.brand[800], marginBottom: spacing.xs },
  details: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  rating: { ...typography.bodySmall, marginBottom: spacing.xs },
  fee: { ...typography.bodySmall, fontWeight: '500' },
  empty: { ...typography.body, color: colors.textSecondary },
});
