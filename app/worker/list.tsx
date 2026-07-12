import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { WorkerAPI, Worker } from '../../src/api/endpoints';
import { RatingTag, EmptyState } from '../../src/components/ui';
import { useLocation } from '../../src/hooks/useLocation';

export default function WorkerList() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { detectCurrentLocation } = useLocation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const loc = await detectCurrentLocation();
        if (!loc) {
          setError('We need your location to find nearby professionals. Please enable location access.');
          return;
        }
        const { data } = await WorkerAPI.getNearby({ lat: loc.latitude, lng: loc.longitude, serviceId });
        setWorkers(data?.data ?? [])
      } catch {
        setError('Could not load nearby professionals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const renderWorker = ({ item }: { item: Worker }) => (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => router.push({ pathname: '/worker/[id]', params: { id: item.id } })}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{item.name[0]}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <RatingTag rating={item.rating} reviewCount={item.reviewCount} />
        {item.skills?.length ? (
          <Text style={styles.skills} numberOfLines={1}>{item.skills.join(' · ')}</Text>
        ) : null}
        {item.experienceYears ? (
          <Text style={styles.exp}>{item.experienceYears} yrs experience</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {item.distanceKm != null && (
          <View style={styles.distBadge}>
            <Ionicons name="location-outline" size={12} color={colors.primary} />
            <Text style={styles.dist}>{item.distanceKm.toFixed(1)} km</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nearby Professionals</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <EmptyState icon="location-outline" title="Something went wrong" subtitle={error} />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          renderItem={renderWorker}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No pros nearby" subtitle="Try a different service area" />}
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
  headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.primary },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
  skills: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  exp: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: spacing.sm },
  distBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  dist: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.primary },
});
