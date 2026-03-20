import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';
import { formatDateTime } from '../lib/formatters';

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
}

export function StudentExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<Exam[] | { exams?: Exam[] }>('/api/student/exams')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.exams || [];
        setExams(list);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('exams')}</Text>
      {exams.map((e) => (
        <Card key={e._id} style={styles.card}>
          <Text style={styles.name}>{e.subject || e.topic || 'Exam'}</Text>
          <Text style={styles.details}>
            {e.score != null && e.totalMarks != null ? `Score: ${e.score}/${e.totalMarks}` : ''}
            {e.status && ` • ${e.status}`}
          </Text>
          <Text style={styles.date}>Attempted: {formatDateTime(e.attemptedAt)}</Text>
        </Card>
      ))}
      {exams.length === 0 && <Text style={styles.empty}>No exams yet.</Text>}
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
  date: { ...typography.bodySmall },
  empty: { ...typography.body, color: colors.textSecondary },
});
