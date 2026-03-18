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
  studentId?: string;
  classLevel?: string;
  board?: string;
}

export function StudentDashboardScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    apiJson<Profile>('/api/student/profile')
      .then(setProfile)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('dashboard')}</Text>
      <Text style={styles.welcome}>{t('welcome')}, {profile?.name || profile?.studentId || 'Student'}!</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.row}><Text style={styles.bold}>Name:</Text> {profile?.name || '-'}</Text>
        <Text style={styles.row}><Text style={styles.bold}>Student ID:</Text> {profile?.studentId || '-'}</Text>
        <Text style={styles.row}><Text style={styles.bold}>Class:</Text> {profile?.classLevel || '-'}</Text>
        <Text style={styles.row}><Text style={styles.bold}>Board:</Text> {profile?.board || '-'}</Text>
      </Card>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('StudentCourses')}>
          <Text style={styles.btnText}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('StudentClasses')}>
          <Text style={styles.btnText}>{t('myClasses')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('StudentExams')}>
          <Text style={styles.btnText}>{t('exams')}</Text>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12 },
  btnText: { ...typography.button, color: '#fff' },
});
