import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { UserAPI } from '../../src/api/endpoints';
import { EmptyState } from '../../src/components/ui';
import Button from '../../src/components/Button';

const CARD_GRADIENTS: [string, string][] = [
  ['#1A5FE8', '#3B7BFF'], ['#19A463', '#22C47A'],
  ['#0F1A2B', '#2D3D52'], ['#9C27B0', '#CE93D8'],
];

export default function SavedCards() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    UserAPI.getSavedCards()
      .then((r: any) => setCards(r.data?.data ?? []))
      .catch(() => setError('Could not load your saved cards. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = (id: string) => {
    Alert.alert('Remove Card', 'Remove this card from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { await UserAPI.deleteSavedCard(id); } catch {}
          setCards((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Cards</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : error ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="cloud-offline-outline" title="Something went wrong" subtitle={error} />
          <Pressable onPress={load} style={{ alignSelf: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: fontWeight.bold }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <LinearGradient colors={CARD_GRADIENTS[index % CARD_GRADIENTS.length]} style={styles.card}>
              <View style={styles.cardTop}>
                <Ionicons name="card" size={28} color="rgba(255,255,255,0.8)" />
                <Pressable onPress={() => remove(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </View>
              <Text style={styles.cardNumber}>•••• •••• •••• {item.last4 ?? '4242'}</Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>{item.name ?? 'Card Holder'}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Expires</Text>
                  <Text style={styles.cardValue}>{item.expiry ?? '12/27'}</Text>
                </View>
              </View>
            </LinearGradient>
          )}
          ListEmptyComponent={
            <EmptyState icon="card-outline" title="No saved cards" subtitle="Save a card for faster checkout" />
          }
          ListFooterComponent={
            <Button title="+ Add New Card" variant="outline" onPress={() => {}} style={{ marginTop: spacing.lg }} />
          }
        />
      )}
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
  list: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  card: {
    borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg,
    ...shadow.raised,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardNumber: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white, letterSpacing: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  cardValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.white },
});
