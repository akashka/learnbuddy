import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../lib/formatters';

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
  classLevel?: string;
  board?: string;
  enrollments?: Array<{
    _id: string;
    subject?: string;
    teacher?: { name?: string };
    feePerMonth?: number;
    status?: string;
  }>;
}

export function ParentStudentsScreen() {
  const [data, setData] = useState<{ children: Child[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<{ children: Child[] }>('/api/parent/students')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  const children = data?.children || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('myKids')}</Text>
      {children.map((c) => (
        <Card key={c._id} style={styles.card}>
          <Text style={styles.name}>{c.name || c.studentId || 'Student'}</Text>
          {(c.classLevel || c.board) && (
            <Text style={styles.details}>{c.board} - {c.classLevel}</Text>
          )}
          {c.enrollments && c.enrollments.length > 0 && (
            <View style={styles.enrollments}>
              {c.enrollments.map((e) => (
                <Text key={e._id} style={styles.enrollment}>
                  {e.subject} - {e.teacher?.name || 'Teacher'} ({formatCurrency(e.feePerMonth ?? 0)}/mo)
                </Text>
              ))}
            </View>
          )}
        </Card>
      ))}
      {children.length === 0 && <Text style={styles.empty}>No students added yet.</Text>}
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
  enrollments: { marginTop: spacing.sm },
  enrollment: { ...typography.bodySmall, marginBottom: spacing.xs },
  empty: { ...typography.body, color: colors.textSecondary },
});
