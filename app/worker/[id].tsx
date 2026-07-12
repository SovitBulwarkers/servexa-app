import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../src/theme";
import { WorkerAPI, Worker } from "../../src/api/endpoints";
import { Card, RatingTag } from "../../src/components/ui";
import Button from "../../src/components/Button";

export default function WorkerDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, revRes] = await Promise.all([
        WorkerAPI.getById(id!),
        WorkerAPI.getReviews(id!),
      ]);
      setWorker(wRes.data?.data);
      const revData: any = revRes.data?.data;
      setReviews(revData?.reviews ?? []);
    } catch {
      setError("Could not load this professional's profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (loading)
    return (
      <ActivityIndicator
        color={colors.primary}
        style={{ flex: 1, marginTop: 80 }}
      />
    );

  if (error || !worker)
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.bold,
              color: colors.textPrimary,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            {error ?? "Worker not found"}
          </Text>
          <Button
            title="Retry"
            onPress={load}
            fullWidth={false}
            style={{ paddingHorizontal: spacing.xxxl }}
          />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.hero}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>

          <View style={styles.heroContent}>
            {worker.avatar ? (
              <Image source={{ uri: worker.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{worker.name[0]}</Text>
              </View>
            )}
            <Text style={styles.workerName}>{worker.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={colors.star} />
              <Text style={styles.ratingVal}>{worker.rating?.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>
                ({(worker as any).totalReviews ?? worker.reviewCount ?? 0}{" "}
                reviews)
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            {
              icon: "briefcase-outline" as const,
              val: `${(worker as any).experience ?? worker.experienceYears ?? 0}+`,
              label: "Years Exp.",
            },
            {
              icon: "checkmark-circle-outline" as const,
              val: `${(worker as any).totalJobs ?? 0}+`,
              label: "Jobs Done",
            },
            {
              icon: "radio-button-on" as const,
              val: worker.isOnline ? "Online" : "Offline",
              label: "Status",
            },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.content}>
          {/* Skills */}
          {worker.skills?.length ? (
            <>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsWrap}>
                {worker.skills.map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Badges */}
          <Text style={styles.sectionTitle}>Verified By HomeServe</Text>
          <View style={styles.badgeRow}>
            {[
              {
                icon: "shield-checkmark-outline" as const,
                label: "Background Verified",
              },
              {
                icon: "document-text-outline" as const,
                label: "Govt. ID Checked",
              },
              { icon: "school-outline" as const, label: "Skills Certified" },
            ].map((b) => (
              <View key={b.label} style={styles.badge}>
                <Ionicons name={b.icon} size={18} color={colors.success} />
                <Text style={styles.badgeText}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          ) : (
            reviews.slice(0, 3).map((r) => (
              <Card key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewInitial}>
                      {(r.user?.name ?? r.customerName ?? "C")[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>
                      {r.user?.name ?? r.customerName ?? "Customer"}
                    </Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= r.rating ? "star" : "star-outline"}
                          size={12}
                          color={colors.star}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(r.createdAt ?? Date.now()).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" },
                    )}
                  </Text>
                </View>
                {r.comment ? (
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.stickyBottom}>
        <Button
          title="Book This Professional"
          onPress={() => router.push({ pathname: "/service/list", params: {} })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { paddingTop: spacing.xl, paddingBottom: spacing.xxxl + spacing.xl },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroContent: { alignItems: "center", paddingHorizontal: spacing.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  workerName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  ratingVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  ratingCount: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.8)" },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: -spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
    marginBottom: spacing.xl,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
  },
  skillText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  badgeRow: { gap: spacing.md },
  badge: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },

  noReviews: { color: colors.textMuted, fontSize: fontSize.sm },
  reviewCard: { marginBottom: spacing.md },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitial: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  reviewName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: fontSize.xs, color: colors.textMuted },
  reviewComment: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  stickyBottom: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.raised,
  },
});
