import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import Button from '../../src/components/Button';

export default function BookingSuccess() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={56} color={colors.white} />
        </Animated.View>

        <Animated.View style={{ opacity, alignItems: 'center' }}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your booking has been placed successfully. We'll notify you once a professional is assigned.
          </Text>
          {bookingId && (
            <View style={styles.idBadge}>
              <Text style={styles.idText}>Booking ID: #{bookingId.slice(-6).toUpperCase()}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.infoRow}>
          {[
            { icon: 'notifications-outline' as const, text: "You'll get a notification when pro is assigned" },
            { icon: 'call-outline' as const, text: 'Pro will call 30 min before arrival' },
            { icon: 'shield-checkmark-outline' as const, text: '30-day service guarantee' },
          ].map((item) => (
            <View key={item.text} style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="View Booking"
            variant="outline"
            style={[styles.btn, { backgroundColor: colors.white }]}
            onPress={() => router.push({ pathname: '/booking/[id]', params: { id: bookingId ?? '' } })}
          />
          <Button
            title="Go Home"
            style={styles.btn}
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  checkCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
  },
  title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.white, textAlign: 'center', marginBottom: spacing.md },
  subtitle: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.pill,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
  },
  idText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  infoRow: {
    width: '100%', gap: spacing.md, marginTop: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.xl, padding: spacing.xl,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl, width: '100%' },
  btn: { flex: 1 },
});
