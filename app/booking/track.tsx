import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Socket } from "socket.io-client";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../src/theme";
import { BookingAPI, Booking } from "../../src/api/endpoints";
import { getSocket } from "../../src/lib/socket";
import { useLocation } from "../../src/hooks/useLocation";
import Button from "../../src/components/Button";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function TrackWorker() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerLoc, setWorkerLoc] = useState<{
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { detectCurrentLocation } = useLocation();
  const [myLoc, setMyLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await BookingAPI.getById(bookingId!);
        const booking = data?.data;
        setBooking(booking);
        if (
          booking?.worker?.latitude != null &&
          booking?.worker?.longitude != null
        ) {
          setWorkerLoc({
            latitude: booking.worker.latitude,
            longitude: booking.worker.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        setError("Could not load booking details for tracking.");
      } finally {
        setLoading(false);
      }
      const loc = await detectCurrentLocation();
      if (loc) setMyLoc({ latitude: loc.latitude, longitude: loc.longitude });
    };
    if (bookingId) init();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;
    (async () => {
      const socket = await getSocket("tracking");
      if (!mounted) return;
      socketRef.current = socket;

      const onConnect = () => {
        setConnected(true);
        socket.emit("track:booking", { bookingId });
      };
      const onDisconnect = () => setConnected(false);
      const onLocationUpdate = (data: {
        latitude: number;
        longitude: number;
        timestamp: string;
      }) => {
        setWorkerLoc(data);
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("location:update", onLocationUpdate);
      if (socket.connected) onConnect();

      return () => {
        socket.emit("track:stop", { bookingId });
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("location:update", onLocationUpdate);
      };
    })();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const distanceKm =
    workerLoc && myLoc
      ? haversineKm(
          myLoc.latitude,
          myLoc.longitude,
          workerLoc.latitude,
          workerLoc.longitude,
        )
      : null;
  const etaMin =
    distanceKm != null ? Math.max(1, Math.round((distanceKm / 25) * 60)) : null; // ~25km/h avg city speed

  const openInMaps = () => {
    if (!workerLoc) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${workerLoc.latitude},${workerLoc.longitude}`;
    Linking.openURL(url);
  };

  if (loading)
    return (
      <ActivityIndicator
        color={colors.primary}
        style={{ flex: 1, marginTop: 80 }}
      />
    );

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.errorText}>{error ?? "Booking not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Track Professional</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: connected ? colors.success : colors.textMuted },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerInitial}>
              {(booking.worker?.name ?? "P")[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>
              {booking.worker?.name ?? "Professional"}
            </Text>
            <Text style={styles.workerSub}>
              {connected
                ? "Live tracking active"
                : "Connecting to live tracking…"}
            </Text>
          </View>
        </View>

        {workerLoc ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons
                  name="navigate-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.statVal}>
                  {distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}
                </Text>
                <Text style={styles.statLabel}>Away</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.statVal}>
                  {etaMin != null ? `${etaMin} min` : "—"}
                </Text>
                <Text style={styles.statLabel}>Est. arrival</Text>
              </View>
            </View>

            <View style={styles.coordCard}>
              <Text style={styles.coordLabel}>Last known position</Text>
              <Text style={styles.coordVal}>
                {workerLoc.latitude.toFixed(5)},{" "}
                {workerLoc.longitude.toFixed(5)}
              </Text>
              <Text style={styles.coordTime}>
                Updated{" "}
                {new Date(workerLoc.timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <Button
              title="Open in Maps"
              onPress={openInMaps}
              style={{ marginTop: spacing.lg }}
            />
          </>
        ) : (
          <View style={styles.center}>
            <Ionicons
              name="location-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.errorText}>
              Waiting for your professional to start sharing their location…
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  content: { padding: spacing.xl, gap: spacing.lg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  workerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  workerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  workerInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  workerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  workerSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  statVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  coordCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  coordLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coordVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  coordTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
});
