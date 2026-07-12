import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { CatalogAPI, Service } from '../../src/api/endpoints';
import { EmptyState, RatingTag } from '../../src/components/ui';

const RECENTS = ['AC Service', 'Plumbing', 'Home Cleaning'];
const TRENDING = ['Pest Control', 'Painting', 'Electrical Repair', 'Carpentry'];

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const { data } = await CatalogAPI.getServices({ search: query });
        setResults(data?.data ?? [])
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search services, categories..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!query ? (
        <View style={{ padding: spacing.xl }}>
          <Text style={styles.sectionTitle}>Recent searches</Text>
          <View style={styles.chipRow}>
            {RECENTS.map((r) => (
              <Pressable key={r} style={styles.chip} onPress={() => setQuery(r)}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.chipText}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Trending</Text>
          <View style={styles.chipRow}>
            {TRENDING.map((t) => (
              <Pressable key={t} style={[styles.chip, styles.chipPrimary]} onPress={() => setQuery(t)}>
                <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : results.length === 0 ? (
        <EmptyState icon="search-outline" title={`No results for "${query}"`} subtitle="Try a different keyword" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultItem, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push({ pathname: '/service/[id]', params: { id: item.id } })}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="construct-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{item.name}</Text>
                <RatingTag rating={item.rating} reviewCount={item.reviewCount} />
              </View>
              <Text style={styles.resultPrice}>₹{item.price}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...shadow.subtle,
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.pill,
  },
  chipPrimary: { backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  list: { padding: spacing.xl, gap: spacing.sm },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md,
    ...shadow.subtle,
  },
  resultIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  resultPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
});
