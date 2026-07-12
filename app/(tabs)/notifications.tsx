import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { NotificationAPI } from '../../src/api/endpoints';
import { EmptyState } from '../../src/components/ui';

const NOTIF_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  BOOKING: { icon: 'calendar-outline', color: colors.primary, bg: colors.primaryLight },
  PAYMENT: { icon: 'card-outline', color: colors.success, bg: colors.successLight },
  WORKER: { icon: 'person-outline', color: colors.warning, bg: colors.warningLight },
  OFFER: { icon: 'pricetag-outline', color: '#9C27B0', bg: '#F3E5F5' },
  SYSTEM: { icon: 'information-circle-outline', color: colors.textMuted, bg: colors.surfaceMuted },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const { data } = await NotificationAPI.getAll();
setNotifications(data?.data?.notifications ?? []);
    } catch {
      setError('Could not load notifications. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try { await NotificationAPI.markRead(id); } catch {}
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handlePress = (item: any) => {
    if (!item.isRead) markRead(item.id);
    const bookingId = item.data?.bookingId;
    const type = (item.type ?? '').toUpperCase();

    if (bookingId) {
      if (type.includes('CHAT') || type.includes('MESSAGE')) {
        router.push({ pathname: '/booking/chat', params: { bookingId } });
      } else if (type.includes('START') || type.includes('TRACK')) {
        router.push({ pathname: '/booking/track', params: { id: bookingId } });
      } else {
        router.push({ pathname: '/booking/[id]', params: { id: bookingId } });
      }
      return;
    }
    if (type.includes('OFFER') || type.includes('COUPON')) {
      router.push('/(tabs)/wallet');
      return;
    }
    if (type.includes('WORKER') && item.data?.workerId) {
      router.push({ pathname: '/worker/[id]', params: { id: item.data.workerId } });
      return;
    }
    // No specific destination — stay on notifications, already marked read.
  };

  const markAll = async () => {
    try { await NotificationAPI.markAllRead(); } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const renderItem = ({ item }: { item: any }) => {
    const style = NOTIF_ICONS[item.type ?? 'SYSTEM'] ?? NOTIF_ICONS.SYSTEM;
    return (
      <Pressable
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handlePress(item)}
      >
        {!item.isRead && <View style={styles.unreadDot} />}
        <View style={[styles.iconWrap, { backgroundColor: style.bg }]}>
          <Ionicons name={style.icon} size={22} color={style.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body ?? item.message}</Text>
          <Text style={styles.notifTime}>
            {new Date(item.createdAt ?? Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}{' · '}
            {new Date(item.createdAt ?? Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Notifications</Text>
        {notifications.some((n) => !n.isRead) && (
          <Pressable onPress={markAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="cloud-offline-outline" title="Something went wrong" subtitle={error} />
          <Pressable onPress={() => { setLoading(true); load(); }} style={{ alignSelf: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: fontWeight.bold }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title="You're all caught up!" subtitle="No notifications right now." />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  markAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    ...shadow.subtle,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
    position: 'absolute', top: spacing.md, right: spacing.md,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
  notifBody: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 17, marginBottom: 4 },
  notifTime: { fontSize: 11, color: colors.textMuted },
});
