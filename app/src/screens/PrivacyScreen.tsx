import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { apiJson } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { DeleteAccountSection } from '../components/DeleteAccountSection';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DataCategory {
  category: string;
  items: string[];
}

interface ConsentRecord {
  consentType: string;
  version: string;
  grantedAt: string;
  studentName?: string;
}

const consentTypeLabel: Record<string, string> = {
  child_data_collection: 'Child data',
  ai_monitoring: 'AI monitoring',
};

export function PrivacyScreen() {
  const [dataSummary, setDataSummary] = useState<DataCategory[]>([]);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { user, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const isParent = user?.role === 'parent';
  const profileScreen = isParent ? 'ParentDashboard' : 'TeacherDashboard';

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<{ dataSummary: DataCategory[]; consentHistory: ConsentRecord[] }>('/api/privacy/dashboard')
      .then((d) => {
        setDataSummary(d.dataSummary || []);
        setConsentHistory(d.consentHistory || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== 'parent' && user?.role !== 'teacher') {
      navigation.navigate('Main');
      return;
    }
    fetchData();
  }, [user?.role, fetchData, navigation]);

  const handleDeleted = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await apiJson<Record<string, unknown>>('/api/privacy/export');
      const jsonStr = JSON.stringify(data, null, 2);
      await Share.share({
        message: jsonStr,
        title: 'LearnBuddy Data Export',
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && dataSummary.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Privacy & Data</Text>
      <Text style={styles.subtitle}>Manage your data and privacy settings</Text>

      {/* Data we hold */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>📦 Data we hold</Text>
        <Text style={styles.cardSubtitle}>Categories of data we collect</Text>
        {dataSummary.map((cat) => (
          <View key={cat.category} style={styles.category}>
            <Text style={styles.categoryName}>{cat.category}</Text>
            <View style={styles.tags}>
              {cat.items.map((item) => (
                <View key={item} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Card>

      {/* Consent history - parent only */}
      {isParent && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>✓ Consent history</Text>
          <Text style={styles.cardSubtitle}>Your recorded consents</Text>
          {consentHistory.length > 0 ? (
            consentHistory.slice(0, 10).map((c, i) => (
              <View key={i} style={styles.consentRow}>
                <Text style={styles.consentType}>{consentTypeLabel[c.consentType] || c.consentType}</Text>
                <Text style={styles.consentChild}>{c.studentName || '-'}</Text>
                <Text style={styles.consentDate}>
                  {c.grantedAt ? new Date(c.grantedAt).toLocaleDateString() : '-'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No consent records yet</Text>
          )}
        </Card>
      )}

      {/* Actions */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Your choices</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate(profileScreen as never)}
        >
          <Text style={styles.actionLabel}>Correct your data</Text>
          <Text style={styles.actionHint}>Update your profile</Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleDownload}
          disabled={downloading}
        >
          <Text style={styles.actionLabel}>Download your data</Text>
          <Text style={styles.actionHint}>Export as JSON</Text>
          {downloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.actionArrow}>→</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* Delete data */}
      <Card style={[styles.card, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
        <DeleteAccountSection role={user?.role as 'parent' | 'teacher'} onDeleted={handleDeleted} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.primary },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  retryBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: 12 },
  retryText: { ...typography.button, color: '#fff' },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.brand[800], marginBottom: spacing.xs },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  category: { marginBottom: spacing.md },
  categoryName: { ...typography.bodySmall, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  tagText: { ...typography.caption, color: colors.textSecondary },
  consentRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  consentType: { flex: 1, ...typography.bodySmall },
  consentChild: { flex: 1, ...typography.bodySmall, color: colors.textSecondary },
  consentDate: { ...typography.caption, color: colors.textSecondary },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, fontStyle: 'italic' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  actionLabel: { flex: 1, ...typography.body, fontWeight: '500' },
  actionHint: { flex: 1, ...typography.caption, color: colors.textSecondary },
  actionArrow: { ...typography.body, color: colors.primary },
});
