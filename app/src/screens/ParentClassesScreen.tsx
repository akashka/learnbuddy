import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { apiJson } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  student?: { name?: string };
  teacher?: { name?: string };
  subject?: string;
}

export function ParentClassesScreen() {
  const [data, setData] = useState<{ past: Session[]; upcoming: Session[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<{ past: Session[]; upcoming: Session[] }>('/api/parent/classes')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
  const upcoming = data?.upcoming || [];
  const past = data?.past || [];

  const SessionCard = ({ s }: { s: Session }) => (
    <Card key={s._id} style={styles.sessionCard}>
      <Text style={styles.sessionText}>
        {s.subject} • {s.teacher?.name} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
      </Text>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('myClasses')}</Text>
      <Text style={styles.sectionTitle}>Upcoming</Text>
      {upcoming.map((s) => <SessionCard key={s._id} s={s} />)}
      {upcoming.length === 0 && <Text style={styles.empty}>No upcoming classes</Text>}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Past</Text>
      {past.map((s) => <SessionCard key={s._id} s={s} />)}
      {past.length === 0 && <Text style={styles.empty}>No past classes</Text>}
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
  sectionTitle: { ...typography.body, fontWeight: '600', color: colors.brand[700], marginBottom: spacing.sm },
  sessionCard: { marginBottom: spacing.sm },
  sessionText: { ...typography.bodySmall },
  empty: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
});
