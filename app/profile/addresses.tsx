import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { UserAPI, Address } from '../../src/api/endpoints';
import { Input } from '../../src/components/ui';
import Button from '../../src/components/Button';
import { useLocation } from '../../src/hooks/useLocation';

const LABELS = ['Home', 'Work', 'Other'];
const LABEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline', Work: 'business-outline', Other: 'location-outline',
};

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<{ label: string; line1: string; line2: string; city: string; latitude?: number; longitude?: number }>({ label: 'Home', line1: '', line2: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { loading: locating, error: locError, detectCurrentLocation } = useLocation();

  const load = async () => {
    setLoadError(null);
    try {
      const { data } = await UserAPI.getAddresses();
      setAddresses(data?.data ?? [])
    } catch {
      setLoadError('Could not load your addresses. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const useMyLocation = async () => {
    const loc = await detectCurrentLocation();
    if (loc) {
      setForm((prev) => ({
        ...prev,
        line1: loc.line1,
        city: loc.city ?? prev.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
    }
  };

  const openAdd = () => { setEditing(null); setForm({ label: 'Home', line1: '', line2: '', city: '' }); setShowModal(true); };
  const openEdit = (a: Address) => { setEditing(a); setForm({ label: a.label, line1: a.line1, line2: a.line2 ?? '', city: a.city ?? '' }); setShowModal(true); };

  const save = async () => {
    if (!form.line1.trim()) { Alert.alert('Address required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await UserAPI.updateAddress(editing.id, form);
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
      } else {
        const { data } = await UserAPI.addAddress(form as any);
        setAddresses((prev) => [...prev, data]);
      }
      setShowModal(false);
    } catch {
      Alert.alert('Could not save address', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await UserAPI.deleteAddress(id); } catch {}
          setAddresses((prev) => prev.filter((a) => a.id !== id));
        },
      },
    ]);
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={LABEL_ICONS[item.label] ?? 'location-outline'} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{item.label}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
          )}
        </View>
        <Text style={styles.line}>{item.line1}</Text>
        {item.line2 ? <Text style={styles.line}>{item.line2}</Text> : null}
        {item.city ? <Text style={styles.line}>{item.city}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={() => remove(item.id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <Pressable onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : loadError ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySub}>{loadError}</Text>
          <Button title="Retry" onPress={() => { setLoading(true); load(); }} fullWidth={false} style={{ paddingHorizontal: spacing.xxxl, marginTop: spacing.lg }} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={renderAddress}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No addresses yet</Text>
              <Text style={styles.emptySub}>Add an address to book services faster</Text>
              <Button title="Add Address" onPress={openAdd} fullWidth={false} style={{ paddingHorizontal: spacing.xxxl, marginTop: spacing.lg }} />
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Address' : 'New Address'}</Text>
            <Pressable onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
              <Pressable onPress={useMyLocation} style={styles.gpsBtn} disabled={locating}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                )}
                <Text style={styles.gpsBtnText}>{locating ? 'Detecting your location…' : 'Use current location'}</Text>
              </Pressable>
              {locError ? <Text style={styles.gpsError}>{locError}</Text> : null}

              <Text style={styles.typeLabel}>Address Type</Text>
              <View style={styles.typeRow}>
                {LABELS.map((l) => (
                  <Pressable
                    key={l}
                    style={[styles.typeChip, form.label === l && styles.typeChipSel]}
                    onPress={() => setForm({ ...form, label: l })}
                  >
                    <Ionicons name={LABEL_ICONS[l]} size={16} color={form.label === l ? colors.white : colors.primary} />
                    <Text style={[styles.typeChipText, form.label === l && styles.typeChipTextSel]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <Input label="Street / Area *" leftIcon="location-outline" placeholder="House no., street, area" value={form.line1} onChangeText={(t) => setForm({ ...form, line1: t })} />
              <Input label="Landmark (optional)" leftIcon="map-outline" placeholder="Near school, temple..." value={form.line2} onChangeText={(t) => setForm({ ...form, line2: t })} />
              <Input label="City" leftIcon="business-outline" placeholder="City" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />
              <Button title="Save Address" onPress={save} loading={saving} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.md, paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  gpsBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  gpsError: { fontSize: fontSize.xs, color: colors.danger, textAlign: 'center', marginBottom: spacing.lg },
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card,
  },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  defaultBadge: { backgroundColor: colors.successLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 10, color: colors.success, fontWeight: fontWeight.bold },
  line: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 19 },
  actions: { gap: spacing.sm },
  actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, paddingHorizontal: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  typeLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  typeChipSel: { backgroundColor: colors.primary },
  typeChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  typeChipTextSel: { color: colors.white },
});
