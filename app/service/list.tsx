import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { CatalogAPI, Service } from '../../src/api/endpoints';
import { RatingTag, EmptyState } from '../../src/components/ui';

export default function ServiceList() {
  const router = useRouter();
  const { categoryId, categoryName, search } = useLocalSearchParams<{
    categoryId?: string; categoryName?: string; search?: string;
  }>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const { data } = await CatalogAPI.getServices({ categoryId, search });
      setServices(data?.data ?? [])
    } catch {
      setError('Could not load services. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.pageTitle}>{categoryName ?? search ?? 'All Services'}</Text>
        <Pressable onPress={() => router.push('/service/search')}>
          <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Something went wrong" subtitle={error} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          numColumns={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="construct-outline" title="No services found" />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() => router.push({ pathname: '/service/[id]', params: { id: item.id } })}
            >
              <View style={styles.cardImg}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFillObject, styles.imgPlaceholder]}>
                    <Ionicons name="construct-outline" size={36} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <RatingTag rating={item.rating} reviewCount={item.reviewCount} />
                  {item.duration ? (
                    <View style={styles.durationTag}>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.durationText}>{item.duration}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>₹{item.price}</Text>
                  <View style={styles.bookNowBtn}>
                    <Text style={styles.bookNowText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.white} />
                  </View>
                </View>
              </View>
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
  pageTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  list: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    overflow: 'hidden', ...shadow.card,
  },
  cardImg: { height: 160, backgroundColor: colors.primaryLight },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  cardName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  cardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  durationTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  durationText: { fontSize: fontSize.xs, color: colors.textMuted },
  cardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  cardPrice: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radius.pill,
  },
  bookNowText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
