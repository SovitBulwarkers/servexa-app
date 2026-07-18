import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../src/theme";
import { SubscriptionAPI, SubscriptionPlan } from "../../src/api/endpoints";
import { EmptyState } from "../../src/components/ui";
import Button from "../../src/components/Button";
import { useAuth } from "../../src/store/auth-context";

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [plansRes, myRes] = await Promise.all([
        SubscriptionAPI.getPlans(),
        SubscriptionAPI.getMySubscription(),
      ]);
      setPlans(plansRes.data?.data ?? []);
      setActivePlanId(myRes.data?.data?.planId ?? null);
    } catch {
      setError("Could not load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subscribe = async (plan: SubscriptionPlan) => {
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== "function") {
      Alert.alert(
        "Not available",
        "Online payment isn't available in this build. Please update the app.",
      );
      return;
    }

    setSubscribingId(plan.id);
    try {
      const { data: orderRes } = await SubscriptionAPI.createOrder(plan.id);
      const order = orderRes.data;

      const checkoutResult = await RazorpayCheckout.open({
        key: order.keyId,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        name: "HomeServe",
        description: `${plan.name} subscription`,
        prefill: {
          email: user?.email || undefined,
          contact: user?.phone || undefined,
          name: user?.name || undefined,
        },
        theme: { color: colors.primary },
      });

      await SubscriptionAPI.verify({
        razorpayOrderId: checkoutResult.razorpay_order_id,
        razorpayPaymentId: checkoutResult.razorpay_payment_id,
        razorpaySignature: checkoutResult.razorpay_signature,
      });

      router.replace("/subscription/my");
    } catch (e: any) {
      const cancelledByUser =
        e?.code === 0 || /cancel/i.test(e?.description ?? "");
      if (cancelledByUser) return;
      const message =
        e?.response?.data?.message ||
        e?.description ||
        e?.message ||
        "Could not complete subscription. Please try again.";
      Alert.alert("Subscription Failed", message);
    } finally {
      setSubscribingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
      >
        {error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Something went wrong"
            subtitle={error}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title="No plans available"
            subtitle="Check back soon for membership plans."
          />
        ) : (
          plans.map((plan) => {
            const isActive = plan.id === activePlanId;
            const isSubscribing = subscribingId === plan.id;
            return (
              <View key={plan.id} style={styles.planCard}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.planBadgeRow}
                >
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>
                      {plan.discountPercent}% OFF
                    </Text>
                  </View>
                </LinearGradient>

                <View style={styles.planBody}>
                  {plan.description ? (
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  ) : null}

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{plan.price}</Text>
                    <Text style={styles.priceUnit}>
                      / {plan.durationDays} days
                    </Text>
                  </View>

                  <View style={styles.perkRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.perkText}>
                      {plan.discountPercent}% off every booking
                      {plan.maxDiscountPerBooking
                        ? ` (up to ₹${plan.maxDiscountPerBooking} per booking)`
                        : ""}
                    </Text>
                  </View>

                  {isActive ? (
                    <View style={styles.activeTag}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.activeTagText}>
                        This is your current plan
                      </Text>
                    </View>
                  ) : (
                    <Button
                      title={
                        isSubscribing ? "Processing..." : `Subscribe for ₹${plan.price}`
                      }
                      onPress={() => subscribe(plan)}
                      loading={isSubscribing}
                      disabled={!!activePlanId || isSubscribing}
                      style={{ marginTop: spacing.md }}
                    />
                  )}
                </View>
              </View>
            );
          })
        )}

        {activePlanId ? (
          <Text style={styles.footNote}>
            You already have an active plan. Cancel it from "My Subscription"
            before switching to a different one.
          </Text>
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
  planCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  planBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  discountPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  discountPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planBody: { padding: spacing.lg },
  planDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  priceUnit: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  perkText: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1 },
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  activeTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  footNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
