import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { fetchPageContent } from '../lib/api';
import { colors, spacing, radius, typography, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForYouScreen() {
  const navigation = useNavigation<Nav>();
  const [roles, setRoles] = useState<Array<{ to: string; title: string; emoji: string; desc: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent('for-you')
      .then((res) => {
        const r = res.sections.roles as Array<{ to: string; title: string; emoji: string; desc: string }>;
        if (Array.isArray(r) && r.length > 0) setRoles(r);
        else setRoles([
          { to: '/for-parents', title: 'For Parents', emoji: '👨‍👩‍👧', desc: 'Find qualified teachers, track progress, and give your child the best learning experience. AI-monitored for safety.' },
          { to: '/for-students', title: 'For Students', emoji: '📚', desc: 'One-to-one attention, ask AI anytime, AI-moderated exams. Learn from anywhere with the app.' },
          { to: '/for-teachers', title: 'For Teachers', emoji: '👩‍🏫', desc: 'Teach on your terms. Fair pay, flexible schedule. AI tools to help you teach smarter.' },
        ]);
      })
      .catch(() => setRoles([
        { to: '/for-parents', title: 'For Parents', emoji: '👨‍👩‍👧', desc: 'Find qualified teachers, track progress, and give your child the best learning experience. AI-monitored for safety.' },
        { to: '/for-students', title: 'For Students', emoji: '📚', desc: 'One-to-one attention, ask AI anytime, AI-moderated exams. Learn from anywhere with the app.' },
        { to: '/for-teachers', title: 'For Teachers', emoji: '👩‍🏫', desc: 'Teach on your terms. Fair pay, flexible schedule. AI tools to help you teach smarter.' },
      ]))
      .finally(() => setLoading(false));
  }, []);

  const navMap: Record<string, keyof RootStackParamList> = {
    '/for-parents': 'ForParents',
    '/for-students': 'ForStudents',
    '/for-teachers': 'ForTeachers',
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>For You</Text>
        <Text style={styles.heroSub}>
          Whether you&apos;re a parent, student, or teacher—LearnBuddy has something for everyone.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Choose your path</Text>
      {roles.map((role, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.8}
          onPress={() => {
            const screen = navMap[role.to];
            if (screen) navigation.navigate(screen);
          }}
          style={styles.card}
        >
          <Text style={styles.cardEmoji}>{role.emoji}</Text>
          <Text style={styles.cardTitle}>{role.title}</Text>
          <Text style={styles.cardDesc}>{role.desc}</Text>
          <Text style={styles.learnMore}>Learn more →</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.explore}>
        <Text style={styles.exploreTitle}>Explore more</Text>
        <View style={styles.exploreLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Text style={styles.exploreLink}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('HowItWorks')}>
            <Text style={styles.exploreLink}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Features')}>
            <Text style={styles.exploreLink}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
            <Text style={styles.exploreLink}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ContactUs')}>
            <Text style={styles.exploreLink}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  heroTitle: { ...typography.h1, color: colors.brand[800], marginBottom: spacing.sm },
  heroSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    ...shadow,
  },
  cardEmoji: { fontSize: 48, marginBottom: spacing.sm },
  cardTitle: { ...typography.h1, color: colors.brand[800], marginBottom: spacing.xs },
  cardDesc: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  learnMore: { ...typography.body, color: colors.primary, fontWeight: '600' },
  explore: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  exploreTitle: { ...typography.h3, color: colors.brand[800], marginBottom: spacing.md },
  exploreLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  exploreLink: { ...typography.bodySmall, color: colors.primary },
});
