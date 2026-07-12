import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { CatalogAPI, Service } from '../../src/api/endpoints';
import { IconBadge, RatingTag, StatusPill } from '../../src/components/ui';
import Button from '../../src/components/Button';

const { width } = Dimensions.get('window');

const INCLUDES = [
  'Free inspection & assessment',
  'Eco-friendly cleaning products',
  '30-day service guarantee',
  'Background-verified professional',
];

export default function ServiceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await CatalogAPI.getService(id!);
      setService(data?.data)
    } catch {
      setError('Could not load this service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchService(); }, [id]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ flex: 1, marginTop: spacing.xxxl }} />;
  }

  if (error || !service) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary }}>Something went wrong</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' }}>{error ?? 'Service not found'}</Text>
          <Button title="Retry" onPress={fetchService} fullWidth={false} style={{ paddingHorizontal: spacing.xxxl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.imageWrap}>
          {service.image ? (
            <Image source={{ uri: service.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="construct-outline" size={56} color={colors.primary} />
            </View>
          )}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.metaRow}>
                <RatingTag rating={service.rating} reviewCount={service.reviewCount} />
                {service.duration ? (
                  <>
                    <Text style={styles.dot}>·</Text>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>{service.duration}</Text>
                  </>
                ) : null}
              </View>
            </View>
            <StatusPill label="Available" tone="success" />
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.price}>₹{service.price}</Text>
            </View>
            <View style={styles.priceRight}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
              <Text style={styles.priceNote}>Best Price</Text>
            </View>
          </View>

          {/* Description */}
          {service.description ? (
            <>
              <Text style={styles.sectionTitle}>About this service</Text>
              <Text style={styles.description}>{service.description}</Text>
            </>
          ) : null}

          {/* What's included */}
          <Text style={styles.sectionTitle}>What's included</Text>
          <View style={styles.includesList}>
            {INCLUDES.map((inc) => (
              <View key={inc} style={styles.includeRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
                <Text style={styles.includeText}>{inc}</Text>
              </View>
            ))}
          </View>

          {/* How it works */}
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { step: '1', title: 'Book & Schedule', desc: 'Choose a date and time that works for you.' },
            { step: '2', title: 'Pro arrives', desc: 'Our verified professional arrives on time with all tools.' },
            { step: '3', title: 'Job done', desc: 'Service completed to your satisfaction. Pay & review.' },
          ].map((s) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}

          {/* Nearby workers teaser */}
          <Pressable
            style={styles.workersTeaser}
            onPress={() => router.push({ pathname: '/worker/list', params: { serviceId: id } })}
          >
            <IconBadge name="people-outline" size={20} badgeSize={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.workersTeaserTitle}>24 pros near you</Text>
              <Text style={styles.workersTeaserSub}>Earliest available: Today 2 PM</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.stickyBottom}>
        <View>
          <Text style={styles.stickyPrice}>₹{service.price}</Text>
          <Text style={styles.stickyLabel}>onwards</Text>
        </View>
        <Button
          title="Book Now"
          onPress={() => router.push({ pathname: '/booking/new/[serviceId]', params: { serviceId: id } })}
          fullWidth={false}
          style={{ paddingHorizontal: spacing.xxxl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  imageWrap: { position: 'relative', height: 260 },
  image: { width, height: 260 },
  imagePlaceholder: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: spacing.xl, left: spacing.xl,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  content: { padding: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  serviceName: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { color: colors.textMuted },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xxl,
  },
  priceLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 2 },
  price: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.primary },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  priceNote: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.success },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.lg },
  description: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  includesList: { gap: spacing.md },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  includeText: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  stepRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  stepTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
  stepDesc: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 17 },
  workersTeaser: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card,
    marginTop: spacing.md,
  },
  workersTeaserTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  workersTeaserSub: { fontSize: fontSize.xs, color: colors.textMuted },
  stickyBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    ...shadow.raised,
  },
  stickyPrice: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  stickyLabel: { fontSize: fontSize.xs, color: colors.textMuted },
});
