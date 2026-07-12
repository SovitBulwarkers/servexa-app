import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import { Input } from '../../src/components/ui';
import Button from '../../src/components/Button';
import KeyboardScreen from '../../src/components/KeyboardScreen';
import { useAuth } from '../../src/store/auth-context';

export default function Login() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    const fullPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
    setError('');
    setLoading(true);
    try {
      await sendOtp(fullPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen style={styles.container}>
      <View style={styles.content}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>HS</Text>
            </View>
            <Text style={styles.brand}>HomeServe</Text>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Enter your phone number to sign in or create a new account.
          </Text>

          <View style={{ marginTop: spacing.xxl }}>
            <Input
              label="Phone number"
              leftIcon="call-outline"
              placeholder="98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (error) setError('');
              }}
              error={error}
              maxLength={10}
            />
          </View>

          <Button title="Continue" onPress={handleContinue} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="Continue as Guest"
            onPress={() => router.push('/(auth)/otp')}
            variant="outline"
          />

          <Text style={styles.terms}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxxl, gap: spacing.md },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.white, fontWeight: fontWeight.extrabold, fontSize: fontSize.md },
  brand: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  heading: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary, marginBottom: spacing.sm },
  subheading: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 21 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl, gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: fontSize.sm },
  terms: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
