import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import { Input } from '../../src/components/ui';
import Button from '../../src/components/Button';
import { useAuth } from '../../src/store/auth-context';
import { UserAPI, UploadAPI } from '../../src/api/endpoints';

export default function EditProfile() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to change your profile picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const { data }: any = await UploadAPI.uploadImage(form);
      setAvatar(data.url ?? uri);
    } catch {
      setAvatar(uri);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setLoading(true);
    try {
      await UserAPI.updateProfile({ name: name.trim(), email: email.trim() || undefined, avatar: avatar || undefined });
      await refreshUser();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable onPress={pickImage} style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{(name || 'U')[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                {uploading
                  ? <Ionicons name="reload-outline" size={16} color={colors.white} />
                  : <Ionicons name="camera" size={16} color={colors.white} />}
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
            <Input
              label="Email Address"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.phoneRow}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <View style={styles.phoneWrap}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <Text style={styles.phoneText}>{user?.phone ?? '—'}</Text>
                <Text style={styles.phoneNote}>(Cannot be changed)</Text>
              </View>
            </View>
            <Button title="Save Changes" onPress={save} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarWrap: { marginBottom: spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primaryLight },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: fontWeight.extrabold, color: colors.primary },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.background,
  },
  avatarHint: { fontSize: fontSize.xs, color: colors.textMuted },
  form: { gap: 0 },
  phoneLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  phoneRow: { marginBottom: spacing.xxl },
  phoneWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, height: 52,
    borderWidth: 1.5, borderColor: colors.border,
  },
  phoneText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  phoneNote: { fontSize: fontSize.xs, color: colors.textMuted, marginLeft: spacing.xs },
});
