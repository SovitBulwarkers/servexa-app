import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import { Input } from '../../src/components/ui';
import Button from '../../src/components/Button';
import KeyboardScreen from '../../src/components/KeyboardScreen';
import { useAuth } from '../../src/store/auth-context';

GoogleSignin.configure({
  // Web Client ID (OAuth client_type 3) from the SAME Firebase project as
  // google-services.json / GoogleService-Info.plist. This now comes from
  // .env (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) instead of being hardcoded —
  // the previous hardcoded value belonged to a different Firebase project
  // number than google-services.json, which is what caused DEVELOPER_ERROR.
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function Login() {
  const router = useRouter();
  const { sendOtp, loginWithGoogle, registerWithEmail, loginWithEmail } = useAuth();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [emailForm, setEmailForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('Could not get Google ID token');

      // Sign into Firebase with the Google credential, then use Firebase's
      // own ID token (not Google's raw one) — that's what the backend
      // verifies via firebase-admin, consistent with how push notification
      // auth already works in this app.
      const credential = auth.GoogleAuthProvider.credential(idToken);
      const firebaseResult = await auth().signInWithCredential(credential);
      const firebaseIdToken = await firebaseResult.user.getIdToken();

      await loginWithGoogle(firebaseIdToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User closed the picker — not an error worth showing.
      } else {
        Alert.alert('Google sign-in failed', e?.response?.data?.message || e?.message || 'Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!emailForm.email || !emailForm.password) {
      Alert.alert('Missing info', 'Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      if (emailMode === 'signup') {
        if (!emailForm.name.trim()) {
          setLoading(false);
          return Alert.alert('Missing info', 'Enter your name');
        }
        await registerWithEmail(emailForm.email, emailForm.password, emailForm.name);
      } else {
        await loginWithEmail(emailForm.email, emailForm.password);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Authentication failed', e?.response?.data?.message || 'Please try again.');
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

          <Pressable style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={googleLoading}>
            <Text style={styles.googleBtnText}>
              {googleLoading ? 'Signing in...' : 'G  Continue with Google'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
              onPress={() => setMode('phone')}
            >
              <Text style={[styles.modeBtnText, mode === 'phone' && styles.modeBtnTextActive]}>Phone OTP</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
              onPress={() => setMode('email')}
            >
              <Text style={[styles.modeBtnText, mode === 'email' && styles.modeBtnTextActive]}>Email</Text>
            </Pressable>
          </View>

          {mode === 'email' ? (
            <>
              <Text style={styles.heading}>{emailMode === 'signup' ? 'Create account' : 'Welcome back'}</Text>
              <Text style={styles.subheading}>
                {emailMode === 'signup' ? 'Sign up with your email to continue.' : 'Sign in with your email to continue.'}
              </Text>

              <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
                {emailMode === 'signup' && (
                  <Input
                    label="Full name"
                    leftIcon="person-outline"
                    placeholder="Jane Doe"
                    value={emailForm.name}
                    onChangeText={(t) => setEmailForm((f) => ({ ...f, name: t }))}
                  />
                )}
                <Input
                  label="Email"
                  leftIcon="mail-outline"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailForm.email}
                  onChangeText={(t) => setEmailForm((f) => ({ ...f, email: t }))}
                />
                <Input
                  label="Password"
                  leftIcon="lock-closed-outline"
                  placeholder="••••••••"
                  secureTextEntry
                  value={emailForm.password}
                  onChangeText={(t) => setEmailForm((f) => ({ ...f, password: t }))}
                />
              </View>

              <Button
                title={emailMode === 'signup' ? 'Create account' : 'Sign in'}
                onPress={handleEmailAuth}
                loading={loading}
              />

              <Pressable
                onPress={() => setEmailMode(emailMode === 'signup' ? 'signin' : 'signup')}
                style={{ marginTop: spacing.lg }}
              >
                <Text style={styles.switchModeText}>
                  {emailMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={styles.switchModeLink}>{emailMode === 'signup' ? 'Sign in' : 'Sign up'}</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <>
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
            </>
          )}

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
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  googleBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted ?? '#F1F5F9',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.white },
  modeBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  modeBtnTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },
  switchModeText: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.sm },
  switchModeLink: { color: colors.primary, fontWeight: fontWeight.semibold },
  terms: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
