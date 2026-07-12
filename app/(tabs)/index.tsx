import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
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
  shadow,
} from "../../src/theme";
import {
  CatalogAPI,
  CouponAPI,
  BannerAPI,
  Category,
  Service,
  AppBanner,
} from "../../src/api/endpoints";
import {
  Card,
  SectionHeader,
  RatingTag,
  EmptyState,
} from "../../src/components/ui";
import BannerCarousel, { Banner } from "../../src/components/BannerCarousel";
import { useAuth } from "../../src/store/auth-context";

const { width } = Dimensions.get("window");

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Cleaning: "sparkles-outline",
  Plumbing: "water-outline",
  Electrical: "flash-outline",
  Carpentry: "hammer-outline",
  Painting: "brush-outline",
  "Pest Control": "bug-outline",
  "AC Repair": "thermometer-outline",
  "Appliance Repair": "build-outline",
};

const TRUST_ITEMS = [
  {
    icon: "shield-checkmark-outline" as const,
    label: "Verified pros",
    sub: "Background checked",
  },
  {
    icon: "time-outline" as const,
    label: "On-time",
    sub: "Avg. 30 min arrival",
  },
  {
    icon: "pricetag-outline" as const,
    label: "Fair pricing",
    sub: "No hidden fees",
  },
];

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fallback-1",
    title: "Book a trusted pro today",
    subtitle: "Verified, background-checked professionals",
    gradient: [colors.gradientStart, colors.gradientEnd],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Service[]>([]);
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<
    {
      code: string;
      description?: string;
      discountValue?: number;
      discountType?: string;
    }[]
  >([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [catRes, popRes, couponRes, bannerRes] = await Promise.all([
        CatalogAPI.getCategories(),
        CatalogAPI.getPopularServices(),
        CouponAPI.getActive().catch(() => ({ data: [] })),
        BannerAPI.getActive().catch(() => ({ data: [] })),
      ]);

      const categoriesData =
        catRes?.data?.data ?? catRes?.data?.categories ?? catRes?.data ?? [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      const popularData =
        popRes?.data?.data ?? popRes?.data?.services ?? popRes?.data ?? [];
      setPopular(Array.isArray(popularData) ? popularData : []);

      const couponData =
        (couponRes as any)?.data?.data ??
        (couponRes as any)?.data?.coupons ??
        (couponRes as any)?.data ??
        [];
      setCoupons(Array.isArray(couponData) ? couponData : []);

      const bannerData =
        (bannerRes as any)?.data?.data ?? (bannerRes as any)?.data ?? [];
      setBanners(Array.isArray(bannerData) ? bannerData : []);
    } catch (err) {
      console.log("Home Screen Error:", err);
      setError("Could not load services. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.hero}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name ?? "Welcome"} 👋</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/notifications")}
              style={styles.bellBtn}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.white}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/service/search")}
            style={styles.searchBox}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textMuted}
            />
            <Text style={styles.searchPlaceholder}>
              What do you need help with?
            </Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.trustRow}>
          {TRUST_ITEMS.map((item) => (
            <Card key={item.label} style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Ionicons name={item.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.trustLabel}>{item.label}</Text>
              <Text style={styles.trustSub}>{item.sub}</Text>
            </Card>
          ))}
        </View>

        <BannerCarousel
          banners={(banners.length > 0
            ? banners.map((b) => ({
                id: b.id,
                title: b.title,
                image: b.image,
                gradient: [colors.gradientStart, colors.gradientEnd] as [string, string],
                onPress: () => {
                  if (b.link) {
                    router.push(b.link as any);
                  } else {
                    router.push("/service/categories");
                  }
                },
              }))
            : FALLBACK_BANNERS
          ).map((b) => b)}
        />

        <View style={styles.body}>
          <SectionHeader
            title="Browse by category"
            actionLabel="View all"
            onAction={() => router.push("/service/categories")}
          />

          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginBottom: spacing.xxl }}
            />
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Something went wrong"
              subtitle={error}
            />
          ) : (
            <View style={styles.categoryGrid}>
              {(Array.isArray(categories) ? categories : [])
                .slice(0, 8)
                .map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={({ pressed }) => [
                      styles.catItem,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/service/list",
                        params: { categoryId: cat.id, categoryName: cat.name },
                      })
                    }
                  >
                    <View style={styles.catIconWrap}>
                      <Ionicons
                        name={CATEGORY_ICONS[cat.name] ?? "construct-outline"}
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.catLabel} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
            </View>
          )}

          <SectionHeader
            title="Popular services"
            actionLabel="View all"
            onAction={() => router.push("/service/list")}
          />
          {popular.length === 0 && !loading ? (
            <EmptyState
              icon="construct-outline"
              title="No services yet"
              subtitle="Check back soon!"
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.sm }}
            >
              {popular.map((service) => (
                <Pressable
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() =>
                    router.push({
                      pathname: "/service/[id]",
                      params: { id: service.id },
                    })
                  }
                >
                  <View style={styles.serviceImgWrap}>
                    {service.image ? (
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImg}
                      />
                    ) : (
                      <View
                        style={[styles.serviceImg, styles.serviceImgPlaceholder]}
                      >
                        <Ionicons
                          name={CATEGORY_ICONS[service.name] ?? "construct-outline"}
                          size={32}
                          color={colors.primary}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {service.name}
                    </Text>
                    <RatingTag
                      rating={service.rating}
                      reviewCount={service.reviewCount}
                    />
                    <Text style={styles.servicePrice}>₹{service.price}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/service/list",
                params: { emergency: "1" },
              })
            }
            style={styles.emergencyBanner}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              style={styles.emergencyGrad}
            >
              <View style={styles.emergencyLeft}>
                <Text style={styles.emergencyLabel}>⚡ Emergency Service</Text>
                <Text style={styles.emergencySub}>
                  Get a pro to your door ASAP
                </Text>
              </View>
              <Ionicons
                name="arrow-forward-circle"
                size={36}
                color="rgba(255,255,255,0.9)"
              />
            </LinearGradient>
          </Pressable>

          {coupons.length > 0 && (
            <>
              <SectionHeader
                title="Offers & Coupons"
                actionLabel="See all"
                onAction={() => router.push("/(tabs)/wallet")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.lg }}
              >
                {coupons.map((o, i) => (
                  <LinearGradient
                    key={o.code}
                    colors={
                      OFFER_GRADIENTS[i % OFFER_GRADIENTS.length] as [
                        string,
                        string,
                      ]
                    }
                    style={styles.offerCard}
                  >
                    <Text style={styles.offerCode}>{o.code}</Text>
                    <Text style={styles.offerDesc}>
                      {o.description ?? "Special offer"}
                    </Text>
                    <View style={styles.offerPill}>
                      <Text style={styles.offerPillText}>
                        {o.discountType === "PERCENTAGE"
                          ? `${o.discountValue}%`
                          : `₹${o.discountValue}`}{" "}
                        OFF
                      </Text>
                    </View>
                  </LinearGradient>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const OFFER_GRADIENTS = [
  [colors.primary, colors.gradientEnd],
  ["#19A463", "#22C47A"],
  [colors.accent, colors.accentDark],
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    paddingTop: spacing.md,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.75)",
    fontWeight: fontWeight.medium,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 52,
    gap: spacing.sm,
    ...shadow.raised,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    flex: 1,
  },

  trustRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.xxl,
    marginBottom: spacing.xxl,
  },
  trustCard: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  trustIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  trustSub: { fontSize: 10, color: colors.textMuted, lineHeight: 14 },

  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  catItem: {
    width: (width - spacing.xl * 2 - spacing.sm * 3) / 4,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  catIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.subtle,
  },
  catLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: "center",
  },

  serviceCard: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  serviceImgWrap: { width: 168, height: 114 },
  serviceImg: { width: 168, height: 114 },
  serviceImgPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: { padding: spacing.md, gap: spacing.xs },
  serviceName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  servicePrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  emergencyBanner: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginVertical: spacing.xxl,
  },
  emergencyGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  emergencyLeft: { gap: spacing.xs },
  emergencyLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  emergencySub: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.9)" },

  offerCard: {
    width: 200,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  offerCode: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  offerDesc: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.85)" },
  offerPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  offerPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
