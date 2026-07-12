import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../src/theme";
import { WalletAPI, CouponAPI } from "../../src/api/endpoints";
import { Card, EmptyState } from "../../src/components/ui";

const TX_ICON: Record<
  string,
  { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  CREDIT: {
    name: "arrow-down-circle-outline",
    color: colors.success,
    bg: colors.successLight,
  },
  DEBIT: {
    name: "arrow-up-circle-outline",
    color: colors.danger,
    bg: colors.dangerLight,
  },
  REFUND: {
    name: "refresh-circle-outline",
    color: colors.primary,
    bg: colors.primaryLight,
  },
};

export default function WalletScreen() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "coupons">(
    "transactions",
  );
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [wRes, txRes, cpRes] = await Promise.all([
        WalletAPI.getWallet(),
        WalletAPI.getTransactions(),
        CouponAPI.getActive(),
      ]);
      setWallet(wRes.data?.data);
      setTransactions(txRes.data?.data?.transactions ?? []);
      setCoupons(cpRes.data?.data ?? []);
    } catch {
      setError("Could not load your wallet. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  if (error)
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Something went wrong"
          subtitle={error}
        />
        <Pressable
          onPress={() => {
            setLoading(true);
            load();
          }}
          style={{ alignSelf: "center" }}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: fontWeight.bold,
              marginTop: spacing.md,
            }}
          >
            Retry
          </Text>
        </Pressable>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text style={styles.pageTitle}>Wallet</Text>
        </View>

        {/* Balance card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{wallet?.balance ?? 0}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Ionicons
                name="arrow-down-outline"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.balanceStatText}>Total Added</Text>
              <Text style={styles.balanceStatVal}>
                ₹{wallet?.totalAdded ?? 0}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Ionicons
                name="arrow-up-outline"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.balanceStatText}>Total Spent</Text>
              <Text style={styles.balanceStatVal}>
                ₹{wallet?.totalSpent ?? 0}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Add money quick amounts */}
        <View style={styles.addMoneyRow}>
          {[100, 200, 500, 1000].map((amt) => (
            <Pressable
              key={amt}
              style={({ pressed }) => [
                styles.amtBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.amtText}>+₹{amt}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["transactions", "coupons"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === t && styles.tabTextActive,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ padding: spacing.xl }}>
          {activeTab === "transactions" ? (
            transactions.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No transactions yet" />
            ) : (
              transactions.map((tx) => {
                const icon = TX_ICON[tx.type] ?? TX_ICON.DEBIT;
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name} size={20} color={icon.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle}>
                        {tx.description ?? tx.type}
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(
                          tx.createdAt ?? Date.now(),
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            tx.type === "CREDIT" || tx.type === "REFUND"
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      {tx.type === "DEBIT" ? "−" : "+"}₹{tx.amount}
                    </Text>
                  </View>
                );
              })
            )
          ) : coupons.length === 0 ? (
            <EmptyState
              icon="pricetag-outline"
              title="No coupons available"
              subtitle="Check back for fresh offers!"
            />
          ) : (
            coupons.map((cp: any) => (
              <View key={cp.id} style={styles.couponCard}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.couponLeft}
                >
                  <Text style={styles.couponCode}>{cp.code}</Text>
                </LinearGradient>
                <View style={styles.couponRight}>
                  <Text style={styles.couponDesc}>
                    {cp.description ?? cp.code}
                  </Text>
                  <Text style={styles.couponValue}>
                    {cp.type === "PERCENTAGE"
                      ? `${cp.value}% OFF`
                      : `₹${cp.value} OFF`}
                  </Text>
                  {cp.minOrderValue ? (
                    <Text style={styles.couponMin}>
                      Min. order ₹{cp.minOrderValue}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.8)",
    fontWeight: fontWeight.medium,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
    marginVertical: spacing.sm,
  },
  balanceRow: { flexDirection: "row", marginTop: spacing.md },
  balanceStat: { flex: 1, gap: 2 },
  balanceDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: spacing.lg,
  },
  balanceStatText: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.7)" },
  balanceStatVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  addMoneyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  amtBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  amtText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm - 2,
  },
  tabBtnActive: { backgroundColor: colors.white, ...shadow.subtle },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.primary },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  txDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  couponCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  couponLeft: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  couponCode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
    textAlign: "center",
  },
  couponRight: { flex: 1, padding: spacing.md, gap: 4 },
  couponDesc: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  couponValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  couponMin: { fontSize: fontSize.xs, color: colors.textMuted },
});
