import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface StaticScreenProps {
  title: string;
  content: string;
  links?: { label: string; screen: keyof RootStackParamList }[];
}

export function StaticScreen({ title, content, links = [] }: StaticScreenProps) {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{content}</Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.link}>Back to Home</Text>
        </TouchableOpacity>
        {links.map((l) => (
          <TouchableOpacity
            key={l.screen}
            onPress={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigation.navigate as (name: keyof RootStackParamList) => void)(l.screen);
            }}
          >
            <Text style={styles.link}> • {l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2, color: colors.brand[800], marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  link: { ...typography.bodySmall, color: colors.primary },
});
