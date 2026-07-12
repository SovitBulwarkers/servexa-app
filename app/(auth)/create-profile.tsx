import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import { Input } from '../../src/components/ui';
import Button from '../../src/components/Button';
import KeyboardScreen from '../../src/components/KeyboardScreen';
import { useAuth } from '../../src/store/auth-context';
import { UserAPI } from '../../src/api/endpoints';

export default function CreateProfile() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (name.trim()) {
        await UserAPI.updateProfile({ name: name.trim(), email: email.trim() || undefined });
        await refreshUser();
      }
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen style={styles.container}>
      <View style={styles.content}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </View>

          <Text style={styles.heading}>Tell us about you</Text>
          <Text style={styles.subheading}>This helps our service pros address you correctly.</Text>

          <View style={{ marginTop: spacing.xxl }}>
            <Input
              label="Full name"
              leftIcon="person-outline"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Input
              label="Email (optional)"
              leftIcon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Button title="Continue" onPress={handleSave} loading={loading} />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  heading: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  subheading: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
