import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { BookingAPI, Booking } from '../../src/api/endpoints';
import { Card, StatusPill, RatingTag } from '../../src/components/ui';
import Button from '../../src/components/Button';

function statusTone(s: string): 'info' | 'success' | 'warning' | 'danger' {
  if (['PENDING', 'ACCEPTED'].includes(s)) return 'info';
  if (s === 'IN_PROGRESS') return 'warning';
  if (s === 'COMPLETED') return 'success';
  if (['CANCELLED', 'REJECTED'].includes(s)) return 'danger';
  return 'info';
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BookingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await BookingAPI.getById(id!);
      setBooking(data?.data)
    } catch {
      setError('Could not load this booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const cancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure? Cancellation charges may apply.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Booking', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await BookingAPI.cancel(id!, 'Changed plans');
            setBooking((b) => b ? { ...b, status: 'CANCELLED' } : b);
          } catch {
            Alert.alert('Error', 'Could not cancel booking.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ flex: 1, marginTop: 80 }} />;
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary }}>Something went wrong</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' }}>{error ?? 'Booking not found'}</Text>
          <Button title="Retry" onPress={load} fullWidth={false} style={{ paddingHorizontal: spacing.xxxl }} />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
  const isCompleted = booking.status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <StatusPill label={statusLabel(booking.status)} tone={statusTone(booking.status)} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ID + date */}
        <Card style={styles.card}>
          <View style={styles.idRow}>
            <Text style={styles.bookingId}>#{id?.slice(-6).toUpperCase() ?? '——'}</Text>
            <Text style={styles.bookingDate}>
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.bookingTime}>{booking.scheduledTime}</Text>
          </View>
        </Card>

        {/* Services */}
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Services</Text>
          {booking.items?.map((item, idx) => (
            <View key={`${item.service.id}-${idx}`} style={styles.serviceRow}>
              <View style={styles.serviceIconWrap}>
                <Ionicons name="construct-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{item.service.name}</Text>
                <Text style={styles.serviceQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.servicePrice}>₹{item.service.basePrice * item.quantity}</Text>
            </View>
          )) ?? (
            <Text style={{ color: colors.textMuted }}>No service details</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₹{booking.finalAmount ?? '—'}</Text>
          </View>
        </Card>

        {/* Worker */}
        {booking.worker ? (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Your Professional</Text>
            <View style={styles.workerRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerInitial}>{booking.worker.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{booking.worker.name}</Text>
                <RatingTag rating={booking.worker.rating} />
              </View>
              <Pressable
                style={styles.callBtn}
                onPress={() => {
                  if (booking.worker?.phone) Linking.openURL(`tel:${booking.worker.phone}`);
                  else Alert.alert('Phone number unavailable', 'This professional\'s number is not available yet.');
                }}
              >
                <Ionicons name="call" size={20} color={colors.white} />
              </Pressable>
              <Pressable
                style={[styles.callBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => router.push({ pathname: '/booking/chat', params: { bookingId: id } })}
              >
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.noWorkerRow}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Text style={styles.noWorkerText}>Assigning a professional…</Text>
            </View>
          </Card>
        )}

        {/* Address */}
        {booking.address && (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Service Address</Text>
            <View style={styles.addrRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.addrText}>
                {booking.address.line1}{booking.address.city ? `, ${booking.address.city}` : ''}
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        {isActive && (
          <View style={styles.actionsWrap}>
            {booking.status === 'IN_PROGRESS' ? (
              <Button title="Track Worker on Map" onPress={() => router.push({ pathname: '/booking/track', params: { bookingId: id } })} />
            ) : null}
            {booking.status !== 'CANCELLED' && (
              <Button
                title="Cancel Booking"
                variant="outline"
                onPress={cancel}
                loading={cancelling}
              />
            )}
          </View>
        )}

        {isCompleted && (
          <View style={styles.actionsWrap}>
            <Button
              title="Rate & Review"
              onPress={() => router.push({ pathname: '/booking/review', params: { bookingId: id, workerId: booking.worker?.id ?? '' } })}
            />
            <Button title="Rebook" variant="secondary" onPress={() => router.push({ pathname: '/booking/new/[serviceId]', params: { serviceId: booking.items?.[0]?.service.id ?? '' } })} />
          </View>
        )}
      </ScrollView>
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
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  card: {},
  idRow: { gap: spacing.xs },
  bookingId: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  bookingDate: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  bookingTime: { fontSize: fontSize.sm, color: colors.textMuted },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.md },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  serviceIconWrap: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  serviceQty: { fontSize: fontSize.xs, color: colors.textMuted },
  servicePrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  totalVal: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.primary },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  workerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  workerInitial: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.primary },
  workerName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  noWorkerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noWorkerText: { fontSize: fontSize.md, color: colors.warning, fontWeight: fontWeight.medium },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  addrText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 19 },
  actionsWrap: { gap: spacing.md },
});