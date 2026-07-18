import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from "../../src/theme";
import { SubscriptionAPI, UserSubscription } from "../../src/api/endpoints";
import { EmptyState } from "../../src/components/ui";
import Button from "../../src/components/Button";

export default function MySubscriptionScreen() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await SubscriptionAPI.getMySubscription();
      setSubscription(data?.data ?? null);
    } catch {
      setError("Could not load your subscription.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You'll lose the discount on future bookings.",
      [
        { text: "Keep Plan", style: "cancel" },
        { text: "Cancel Plan", style: "destructive", onPress: doCancel },
      ],
    );
  };

  const doCancel = async () => {
    setCancelling(true);
    try {
      await SubscriptionAPI.cancel();
      await load();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Could not cancel subscription.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const daysLeft = (endDate?: string) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="Something went wrong" subtitle={error} />
        ) : !subscription ? (
          <EmptyState
            icon="ribbon-outline"
            title="No active subscription"
            subtitle="Subscribe to a plan to get discounts on every booking."
          />
        ) : (
          <>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.card}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.planName}>{subscription.plan.name}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {subscription.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.discount}>
                {subscription.plan.discountPercent}% OFF every booking
              </Text>
              {subscription.endDate ? (
                <Text style={styles.expiry}>
                  {daysLeft(subscription.endDate)} day
                  {daysLeft(subscription.endDate) === 1 ? "" : "s"} remaining
                  {"  •  "}
                  Renews/expires{" "}
                  {new Date(subscription.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              ) : null}
            </LinearGradient>

            <View style={styles.detailBlock}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Started on</Text>
                <Text style={styles.detailValue}>
                  {subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </Text>
              </View>
              {subscription.plan.maxDiscountPerBooking ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Max discount / booking</Text>
                  <Text style={styles.detailValue}>
                    ₹{subscription.plan.maxDiscountPerBooking}
                  </Text>
                </View>
              ) : null}
            </View>

            <Button
              title={cancelling ? "Cancelling..." : "Cancel Subscription"}
              variant="outline"
              onPress={confirmCancel}
              loading={cancelling}
              disabled={cancelling}
              style={{ marginTop: spacing.xl }}
            />
          </>
        )}

        {!loading && !subscription && !error ? (
          <Button
            title="Browse Plans"
            onPress={() => router.push("/subscription/plans")}
            style={{ marginTop: spacing.lg }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  statusPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  discount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  expiry: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing.md,
  },
  detailBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  detailLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
