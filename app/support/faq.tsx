import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { SupportAPI } from '../../src/api/endpoints';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SupportAPI.getFaq()
      .then((r) => setItems(r.data?.data ?? []))
      .catch(() => setError('Could not load help articles. Please check your connection.'));
  }, []);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
      </View>

      {error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.heroRow}>
            <Ionicons name="help-circle" size={40} color={colors.primary} />
            <Text style={styles.heroText}>How can we help you?</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          return (
            <Pressable style={[styles.item, isOpen && styles.itemOpen]} onPress={() => toggle(item.id)}>
              <View style={styles.itemHeader}>
                <Text style={[styles.question, isOpen && styles.questionOpen]} numberOfLines={isOpen ? undefined : 2}>
                  {item.question}
                </Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isOpen ? colors.primary : colors.textMuted}
                />
              </View>
              {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
            </Pressable>
          );
        }}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  list: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  heroRow: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  heroText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  item: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border, ...shadow.subtle,
  },
  itemOpen: { borderColor: colors.primary },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  question: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, lineHeight: 21 },
  questionOpen: { color: colors.primary },
  answer: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
