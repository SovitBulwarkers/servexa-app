import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';
import { ReviewAPI } from '../../src/api/endpoints';
import Button from '../../src/components/Button';

const TAGS = ['Punctual', 'Professional', 'Friendly', 'Thorough', 'Great Value', 'Would Rebook'];

export default function ReviewScreen() {
  const router = useRouter();
  const { bookingId, workerId } = useLocalSearchParams<{ bookingId: string; workerId: string }>();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const submit = async () => {
    if (rating === 0) { Alert.alert('Rate', 'Please give a star rating first.'); return; }
    setLoading(true);
    try {
      const fullComment = selectedTags.length
        ? `${selectedTags.join(', ')}${comment ? '. ' + comment : ''}`
        : comment;
      await ReviewAPI.create({ bookingId, workerId, rating, comment: fullComment || undefined });
      router.replace('/(tabs)/bookings');
    } catch {
      Alert.alert('Error', 'Could not submit review. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const display = hovered || rating;

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Rate & Review</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.question}>How was your experience?</Text>
        <Text style={styles.sub}>Your feedback helps us improve our service quality.</Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable
              key={s}
              onPressIn={() => setHovered(s)}
              onPressOut={() => setHovered(0)}
              onPress={() => setRating(s)}
            >
              <Ionicons
                name={s <= display ? 'star' : 'star-outline'}
                size={44}
                color={s <= display ? colors.star : colors.border}
              />
            </Pressable>
          ))}
        </View>
        {display > 0 && (
          <Text style={styles.ratingLabel}>{LABELS[display]}</Text>
        )}

        {/* Quick tags */}
        <Text style={styles.sectionTitle}>What did you like?</Text>
        <View style={styles.tagsWrap}>
          {TAGS.map((t) => {
            const sel = selectedTags.includes(t);
            return (
              <Pressable key={t} style={[styles.tag, sel && styles.tagSel]} onPress={() => toggleTag(t)}>
                {sel && <Ionicons name="checkmark" size={12} color={colors.primary} />}
                <Text style={[styles.tagText, sel && styles.tagTextSel]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Comment */}
        <Text style={styles.sectionTitle}>Add a comment (optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Tell us more about your experience..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        <Button title="Submit Review" onPress={submit} loading={loading} style={{ marginTop: spacing.xxl }} />
        <Pressable style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
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
  scroll: { padding: spacing.xl, alignItems: 'center', paddingBottom: spacing.xxxl },
  question: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxl },
  starsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  ratingLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.star, marginBottom: spacing.xxl },
  sectionTitle: { alignSelf: 'flex-start', fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.lg },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignSelf: 'flex-start' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagSel: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  tagText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tagTextSel: { color: colors.primary, fontWeight: fontWeight.bold },
  commentInput: {
    width: '100%', backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing.lg,
    fontSize: fontSize.sm, color: colors.textPrimary, minHeight: 120,
  },
  skipBtn: { marginTop: spacing.lg, padding: spacing.md },
  skipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
});
