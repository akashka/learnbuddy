import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, radius, typography, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const cardWidth = width > 600 ? (width - spacing.lg * 4) / 3 : width - spacing.lg * 2;

  const RoleCard = ({
    emoji,
    title,
    desc,
    cta,
    onPress,
    gradient,
  }: {
    emoji: string;
    title: string;
    desc: string;
    cta: string;
    onPress: () => void;
    gradient: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.roleCard, { width: Math.min(cardWidth, 320), backgroundColor: gradient }]}
    >
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
      <View style={styles.ctaBadge}>
        <Text style={styles.ctaText}>{cta}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>📚</Text>
        <Text style={styles.heroTitle}>{t('appName')}</Text>
        <Text style={styles.heroTagline}>{t('tagline')}</Text>
        <Text style={styles.heroSub}>
          One-to-one online tuition for kids with AI monitoring. Safe, fun, and effective learning!
        </Text>
      </View>

      <View style={styles.rolesRow}>
        <RoleCard
          emoji="👨‍👩‍👧‍👦"
          title={t('parent')}
          desc="Find the best teachers for your kids"
          cta={t('findTeacher')}
          gradient="#e0f2fe"
          onPress={() => navigation.navigate('ParentRegister')}
        />
        <RoleCard
          emoji="👩‍🏫"
          title={t('teacher')}
          desc="Teach and earn from home"
          cta={t('becomeTeacher')}
          gradient="#d1fae5"
          onPress={() => navigation.navigate('TeacherRegister')}
        />
        <RoleCard
          emoji="👦"
          title={t('student')}
          desc="Join your classes and learn"
          cta={t('login')}
          gradient="#ede9fe"
          onPress={() => navigation.navigate('Login')}
        />
      </View>

      <View style={styles.whySection}>
        <Text style={styles.sectionTitle}>Why Choose Us?</Text>
        <View style={styles.featureRow}>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <Text style={styles.featureTitle}>AI Monitored</Text>
            <Text style={styles.featureDesc}>Safe learning with AI watching over your child</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureTitle}>Use Any Device</Text>
            <Text style={styles.featureDesc}>Mobile, tablet, laptop or TV - learn anywhere</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🌍</Text>
            <Text style={styles.featureTitle}>Multiple Languages</Text>
            <Text style={styles.featureDesc}>Learn in your preferred language</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Admin is a separate app.</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('ForYou')}>
            <Text style={styles.footerLink}>For You</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Features')}>
            <Text style={styles.footerLink}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('HowItWorks')}>
            <Text style={styles.footerLink}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
            <Text style={styles.footerLink}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ContactUs')}>
            <Text style={styles.footerLink}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TermsConditions')}>
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand[50] },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand[200],
    ...shadow,
  },
  heroEmoji: { fontSize: 64, marginBottom: spacing.sm },
  heroTitle: { ...typography.h1, color: colors.brand[800], marginBottom: spacing.xs },
  heroTagline: { ...typography.h3, color: colors.brand[600], marginBottom: spacing.sm },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand[200],
    ...shadow,
  },
  roleEmoji: { fontSize: 48, marginBottom: spacing.sm },
  roleTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  roleDesc: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  ctaBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  ctaText: { ...typography.button, color: '#fff' },
  whySection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  sectionTitle: { ...typography.h2, color: colors.brand[800], textAlign: 'center', marginBottom: spacing.lg },
  featureRow: { gap: spacing.md },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  featureEmoji: { fontSize: 32, marginRight: spacing.md },
  featureTitle: { ...typography.body, fontWeight: '600', color: colors.brand[800], flex: 1 },
  featureDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  footer: { alignItems: 'center', padding: spacing.lg },
  footerText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  footerLink: { ...typography.bodySmall, color: colors.primary },
});
