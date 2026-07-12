import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { useAuth } from '../../src/store/auth-context';
import { BookingAPI, WalletAPI } from '../../src/api/endpoints';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

function MenuItem({ icon, label, onPress, color = colors.textPrimary, badge }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: color === colors.danger ? colors.dangerLight : colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={color === colors.danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, color === colors.danger && { color: colors.danger }]}>{label}</Text>
      {badge ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<{ bookings: number; reviews: number; wallet: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [bookingsRes, walletRes] = await Promise.all([
            BookingAPI.myBookings(),
            WalletAPI.getWallet(),
          ]);
          if (cancelled) return;
          const bookings = bookingsRes.data?.data ?? [];
          const wallet = walletRes.data?.data;
          setStats({
            bookings: bookings.length,
            reviews: bookings.filter((b: any) => !!b.review).length,
            wallet: wallet?.balance ?? 0,
          });
        } catch {
          if (!cancelled) setStats({ bookings: 0, reviews: 0, wallet: 0 });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.hero}>
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.editAvatarBtn}
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="pencil" size={14} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Bookings', value: stats ? String(stats.bookings) : '—', icon: 'calendar-outline' as const },
            { label: 'Reviews', value: stats ? String(stats.reviews) : '—', icon: 'star-outline' as const },
            { label: 'Wallet', value: stats ? `₹${stats.wallet.toFixed(0)}` : '—', icon: 'wallet-outline' as const },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}>
          <MenuSection title="Account">
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
            <MenuItem icon="location-outline" label="Saved Addresses" onPress={() => router.push('/profile/addresses')} />
            <MenuItem icon="card-outline" label="Saved Cards" onPress={() => router.push('/profile/cards')} />
          </MenuSection>

          <MenuSection title="Activity">
            <MenuItem icon="calendar-outline" label="My Bookings" onPress={() => router.push('/(tabs)/bookings')} />
            <MenuItem icon="wallet-outline" label="Wallet & Transactions" onPress={() => router.push('/(tabs)/wallet')} />
            <MenuItem icon="pricetag-outline" label="Coupons" onPress={() => router.push('/(tabs)/wallet')} />
          </MenuSection>

          <MenuSection title="Support">
            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/support/tickets')} />
            <MenuItem icon="chatbubble-outline" label="Live Chat" onPress={() => router.push('/support/tickets')} />
            <MenuItem icon="document-text-outline" label="FAQ" onPress={() => router.push('/support/faq')} />
          </MenuSection>

          <MenuSection title="Legal">
            <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
            <MenuItem icon="reader-outline" label="Terms of Service" onPress={() => {}} />
            <MenuItem icon="information-circle-outline" label="App Version 1.0.0" onPress={() => {}} />
          </MenuSection>

          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} color={colors.danger} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.xl },
  avatarWrap: { marginBottom: spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitial: { fontSize: 36, fontWeight: fontWeight.extrabold, color: colors.white },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  userName: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.white, marginBottom: 4 },
  userPhone: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)' },
  userEmail: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: -spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
    marginBottom: spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginLeft: spacing.xs },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.subtle },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  badge: {
    backgroundColor: colors.danger, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.white },
});