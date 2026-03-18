import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { WebView } from 'react-native-webview';
import sanitizeHtml from 'sanitize-html';
import { apiJson } from '../lib/api';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface CmsPageScreenProps {
  slug: string;
  links?: { label: string; screen: keyof RootStackParamList }[];
}

const HTML_TEMPLATE = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; color: #334155; line-height: 1.6; }
    h1 { color: #3730a3; font-size: 1.5rem; margin-bottom: 12px; }
    img { max-width: 100%; height: auto; }
    a { color: #4f46e5; text-decoration: underline; }
    iframe { max-width: 100%; }
  </style>
</head>
<body>
  <h1>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
  <div>${content}</div>
</body>
</html>
`;

export function CmsPageScreen({ slug, links = [] }: CmsPageScreenProps) {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiJson<{ title: string; content: string }>(`/api/cms-pages/${slug}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.error}>{error || 'Page not found'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.link}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sanitized = sanitizeHtml(page.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe']),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, iframe: ['src', 'allow', 'allowfullscreen', 'frameborder'] },
  });
  const html = HTML_TEMPLATE(page.title, sanitized);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled
        showsVerticalScrollIndicator
      />
      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.link}>Back to Home</Text>
        </TouchableOpacity>
        {links.map((l) => (
          <TouchableOpacity
            key={l.screen}
            onPress={() => {
              (navigation.navigate as (name: keyof RootStackParamList) => void)(l.screen);
            }}
          >
            <Text style={styles.link}> • {l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webview: { flex: 1 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  link: { ...typography.bodySmall, color: colors.primary },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
});
