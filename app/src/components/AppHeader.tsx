import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title, showBack }: AppHeaderProps) {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.logoWrap}>
            <Text style={styles.logo}>{t('appName')}</Text>
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.right}>
          {user ? (
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.link}>{t('logout')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerBtn}>
                <Text style={styles.link}>{t('register')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.lg + 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoWrap: { flexDirection: 'column', alignItems: 'flex-start' },
  logo: { ...typography.h3, color: colors.brand[800], fontWeight: '700' },
  tagline: { ...typography.bodySmall, color: colors.brand[600], marginTop: 2, fontSize: 12 },
  backBtn: { paddingVertical: spacing.xs },
  backText: { ...typography.body, color: colors.primary },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  link: { ...typography.bodySmall, color: colors.primary },
  registerBtn: { marginLeft: spacing.xs },
});
