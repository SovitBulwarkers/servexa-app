import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme';

const LAST_UPDATED = 'July 13, 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By creating an account or using the HomeServe app, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.',
    ],
  },
  {
    title: '2. The Service',
    body: [
      'HomeServe is a platform that connects customers with independent service workers for home services (such as cleaning, repairs, and related work). We facilitate the booking and payment process; the actual service is performed by the assigned worker.',
    ],
  },
  {
    title: '3. Account Registration',
    body: [
      'You must provide accurate information when creating an account and verify your phone number via OTP. You are responsible for keeping your account credentials secure and for all activity under your account.',
    ],
  },
  {
    title: '4. Bookings and Pricing',
    body: [
      'Prices shown at the time of booking include the service charge and any applicable coupon discount. Final pricing may include additional charges disclosed before payment (e.g. for extra work requested on-site).',
      'We reserve the right to correct any pricing errors displayed in the app due to technical issues.',
    ],
  },
  {
    title: '5. Cancellations and Refunds',
    body: [
      'You may cancel a booking from the app before a worker is assigned or within the cancellation window shown at booking. Cancellation fees may apply for late cancellations, as shown in-app.',
      'Refunds for eligible cancellations or service issues will be processed to your original payment method within a reasonable timeframe.',
    ],
  },
  {
    title: '6. Worker Conduct and Liability',
    body: [
      'Workers on the platform are independent service providers. While we vet workers before onboarding, HomeServe is not the employer of workers and is not liable for the direct actions of a worker except as required by law.',
      'If you experience an issue with a booking, please raise a support ticket so we can investigate and take appropriate action.',
    ],
  },
  {
    title: '7. Payments',
    body: [
      'Payments are processed through our third-party payment partner. By making a payment, you agree to their applicable terms. HomeServe does not store your full card or bank details.',
    ],
  },
  {
    title: '8. User Conduct',
    body: [
      'You agree not to misuse the app, including submitting false information, abusing support or chat features, or attempting to circumvent the platform to transact directly with a worker outside the app in violation of these Terms.',
    ],
  },
  {
    title: '9. Support Tickets',
    body: [
      'You may raise a support ticket for booking or service-related issues. Once a ticket is marked Closed by our support team, it is no longer open for further replies; please raise a new ticket if the issue persists or a new issue arises.',
    ],
  },
  {
    title: '10. Termination',
    body: [
      'We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or misuse the platform. You may stop using the app and request account deletion at any time via Support.',
    ],
  },
  {
    title: '11. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, HomeServe is not liable for indirect, incidental, or consequential damages arising from your use of the app or the services booked through it.',
    ],
  },
  {
    title: '12. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. Material changes will be notified within the app. Continued use after changes take effect constitutes acceptance of the updated Terms.',
    ],
  },
  {
    title: '13. Contact Us',
    body: [
      'For questions about these Terms, please reach out through the Support section in the app.',
    ],
  },
];

export default function TermsOfServiceScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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