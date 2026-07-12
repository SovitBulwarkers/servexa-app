import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Pressable, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { CatalogAPI, Category } from '../../src/api/endpoints';

const { width } = Dimensions.get('window');
const COLS = 3;
const ITEM_SIZE = (width - spacing.xl * 2 - spacing.md * (COLS - 1)) / COLS;

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Cleaning: 'sparkles-outline', Plumbing: 'water-outline', Electrical: 'flash-outline',
  Carpentry: 'hammer-outline', Painting: 'brush-outline', 'Pest Control': 'bug-outline',
  'AC Repair': 'thermometer-outline', 'Appliance Repair': 'build-outline',
  Gardening: 'leaf-outline', Security: 'shield-outline', Moving: 'cube-outline',
  Laundry: 'shirt-outline',
};

const CAT_COLORS = [
  colors.primaryLight, '#FEF4E3', '#E7F8EF', '#FCEAEB',
  '#F3E5F5', '#E0F7FA', '#FFF8E1', '#F1F8E9',
  colors.primaryLight, '#FCE4EC', '#E8EAF6', '#E0F2F1',
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    CatalogAPI.getCategories()
      .then((r) => setCategories(r.data?.data ?? []))
      .catch(() => setError('Could not load categories. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>All Categories</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={{ color: colors.primary, fontWeight: fontWeight.bold }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          numColumns={COLS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: spacing.md }}
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push({ pathname: '/service/list', params: { categoryId: item.id, categoryName: item.name } })}
            >
              <View style={[styles.iconBox, { backgroundColor: CAT_COLORS[index % CAT_COLORS.length] }]}>
                <Ionicons name={CAT_ICONS[item.name] ?? 'construct-outline'} size={28} color={colors.primary} />
              </View>
              <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
            </Pressable>
          )}
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  grid: { padding: spacing.xl, gap: spacing.md },
  item: {
    width: ITEM_SIZE, alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, ...shadow.subtle,
  },
  iconBox: {
    width: ITEM_SIZE - spacing.md * 2, height: ITEM_SIZE - spacing.md * 2,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  catName: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textPrimary, textAlign: 'center' },
});
