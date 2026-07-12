import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Pressable, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { BookingAPI, Booking } from '../../src/api/endpoints';
import { StatusPill, EmptyState } from '../../src/components/ui';
import Button from '../../src/components/Button';

const TABS = ['Upcoming', 'Active', 'Completed', 'Cancelled'] as const;
type TabT = (typeof TABS)[number];

const STATUS_MAP: Record<TabT, string[]> = {
  Upcoming: ['PENDING', 'ACCEPTED'],
  Active: ['IN_PROGRESS'],
  Completed: ['COMPLETED'],
  Cancelled: ['CANCELLED', 'REJECTED'],
};

const STATUS_TONE: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'info',
  ACCEPTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  REJECTED: 'danger',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabT>('Upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await BookingAPI.myBookings();
      setBookings(data?.data ?? []);
    } catch {
      setError('Could not load your bookings. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter((b) => STATUS_MAP[activeTab].includes(b.status));

  const renderBooking = ({ item }: { item: Booking }) => {
    const tone = STATUS_TONE[item.status] ?? 'info';
    return (
      <Pressable
        style={({ pressed }) => [styles.bookingCard, { opacity: pressed ? 0.88 : 1 }]}
        onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
      >
        <View style={styles.bookingTop}>
          <View style={styles.iconWrap}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.bookingDate}>
              {new Date(item.scheduledDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}{' '}
              · {item.scheduledTime}
            </Text>
          </View>
          <StatusPill label={statusLabel(item.status)} tone={tone} />
        </View>

        {item.items?.map((i, idx) => (
          <Text key={`${i.service.id}-${idx}`} style={styles.serviceItem} numberOfLines={1}>
            · {i.service.name} × {i.quantity}
          </Text>
        ))}

        <View style={styles.bookingFooter}>
          {item.worker ? (
            <View style={styles.workerRow}>
              <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.workerName}>{item.worker.name}</Text>
            </View>
          ) : (
            <Text style={styles.noWorker}>Worker not assigned yet</Text>
          )}
          {item.finalAmount ? (
            <Text style={styles.totalAmount}>₹{item.finalAmount}</Text>
          ) : null}
        </View>

        {activeTab === 'Active' && (
          <View style={{ marginTop: spacing.md }}>
            <Button
              title="Track Worker"
              onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id } })}
              size="sm"
              style={{ borderRadius: radius.md }}
            />
          </View>
        )}

        {activeTab === 'Completed' && !item.worker && (
          <View style={{ marginTop: spacing.md }}>
            <Button
              title="Rate & Review"
              onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id, review: '1' } })}
              variant="secondary"
              size="sm"
            />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>My Bookings</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable key={tab} style={styles.tabBtn} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="cloud-offline-outline" title="Something went wrong" subtitle={error} />
          <Button title="Retry" onPress={() => { setLoading(true); load(); }} fullWidth={false} style={{ alignSelf: 'center', paddingHorizontal: spacing.xxxl }} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={renderBooking}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={`No ${activeTab.toLowerCase()} bookings`}
              subtitle={activeTab === 'Upcoming' ? 'Book a service to get started' : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 8, right: 8, height: 2,
    backgroundColor: colors.primary, borderRadius: 1,
  },
  list: { padding: spacing.xl, gap: spacing.lg },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  bookingId: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  bookingDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  serviceItem: { fontSize: fontSize.sm, color: colors.textSecondary, marginLeft: spacing.xs, marginVertical: 2 },
  bookingFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  workerName: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  noWorker: { fontSize: fontSize.xs, color: colors.textMuted },
  totalAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
});