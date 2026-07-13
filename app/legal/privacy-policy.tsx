import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme';

const LAST_UPDATED = 'July 13, 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Introduction',
    body: [
      'This Privacy Policy explains how HomeServe ("we", "our", "us") collects, uses, stores, and protects information when you use our mobile application to book home services. By creating an account or using the app, you agree to the practices described here.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'Account information: your name, phone number, email address, and profile photo.',
      'Location data: your address and, during an active booking, live location — so we can match you with nearby workers and show real-time tracking.',
      'Booking and payment information: service history, booking details, amounts paid, and payment method metadata (we do not store full card numbers — payments are processed by our payment partner).',
      'Communications: messages you send through in-app chat or support tickets, including replies from workers or our support team.',
      'Device information: device model, operating system, app version, and push notification tokens, used for app functionality and troubleshooting.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    body: [
      'To create and manage your account, and to let you book, track, and pay for services.',
      'To match your booking with an available worker and share necessary details (such as your address and contact number) with that worker for the duration of the job.',
      'To send you booking updates, worker arrival notifications, and support responses.',
      'To improve app performance, prevent fraud, and resolve disputes raised through support tickets.',
      'To comply with legal obligations where required.',
    ],
  },
  {
    title: '4. Sharing of Information',
    body: [
      'With workers assigned to your booking, limited to what is needed to complete the job (name, address, contact number, service details).',
      'With payment processors, solely to complete transactions.',
      'With law enforcement or regulators if legally required.',
      'We do not sell your personal information to third parties for advertising purposes.',
    ],
  },
  {
    title: '5. Location Data',
    body: [
      'We collect precise location data only while you have an active booking being tracked, or when you set your service address. You can control location permissions from your device settings, but disabling location may limit features like live worker tracking.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain your account and booking history for as long as your account is active, and for a reasonable period afterward to comply with legal, tax, and dispute-resolution requirements. You may request deletion of your account as described in Section 8.',
    ],
  },
  {
    title: '7. Data Security',
    body: [
      'We use industry-standard measures — including encrypted connections and access controls — to protect your data. No system is completely secure, and we encourage you to use a strong, unique password for your account.',
    ],
  },
  {
    title: '8. Your Rights',
    body: [
      'You can access, update, or correct your profile information at any time from the app.',
      'You can request deletion of your account and associated personal data by contacting support through the in-app Support section. Some information may be retained where required by law (e.g. transaction records).',
    ],
  },
  {
    title: '9. Children\u2019s Privacy',
    body: [
      'Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.',
    ],
  },
  {
    title: '10. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. If we make material changes, we will notify you in the app. Continued use of the app after changes take effect constitutes acceptance of the updated policy.',
    ],
  },
  {
    title: '11. Contact Us',
    body: [
      'If you have questions about this Privacy Policy or how your data is handled, please reach out through the Support section in the app.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((line, i) => (
              <Text key={i} style={styles.paragraph}>{line}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl ?? 48 },
  updated: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  paragraph: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.xs },
});