import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../lib/formatters';

interface Batch {
  _id?: string;
  name?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  feePerMonth?: number;
  slots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
}

export function TeacherBatchesScreen() {
  const [data, setData] = useState<{ batches: Batch[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<{ batches: Batch[] }>('/api/teacher/batches')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  const batches = data?.batches || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Batches</Text>
      {batches.map((b, i) => (
        <Card key={b._id || i} style={styles.card}>
          <Text style={styles.name}>{b.name || 'Batch'}</Text>
          <Text style={styles.details}>{b.board} • {b.classLevel} • {b.subject}</Text>
          <Text style={styles.fee}>{t('fee')}: {formatCurrency(b.feePerMonth ?? 0)}/month</Text>
          {b.slots && b.slots.length > 0 && (
            <Text style={styles.slots}>
              Slots: {b.slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
            </Text>
          )}
        </Card>
      ))}
      {batches.length === 0 && <Text style={styles.empty}>No batches yet.</Text>}
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
  card: { marginBottom: spacing.md },
  name: { ...typography.body, fontWeight: '600', color: colors.brand[800], marginBottom: spacing.xs },
  details: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  fee: { ...typography.bodySmall, marginBottom: spacing.xs },
  slots: { ...typography.bodySmall },
  empty: { ...typography.body, color: colors.textSecondary },
});
