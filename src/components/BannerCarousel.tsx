import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, radius, spacing, shadow } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const AUTO_SCROLL_MS = 3500;

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  gradient?: [string, string];
  onPress?: () => void;
};

export default function BannerCarousel({
  banners,
  height = 160,
}: {
  banners: Banner[];
  height?: number;
}) {
  const listRef = useRef<FlatList<Banner>>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    indexRef.current = newIndex;
    setIndex(newIndex);
  }, []);

  if (!banners.length) return null;

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: CARD_WIDTH + spacing.md,
          offset: (CARD_WIDTH + spacing.md) * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <Pressable onPress={item.onPress} style={[styles.card, { width: CARD_WIDTH, height }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : null}
            <LinearGradient
              colors={item.image ? ['rgba(18,14,40,0.15)', 'rgba(18,14,40,0.75)'] : (item.gradient ?? [colors.gradientStart, colors.gradientEnd])}
              style={styles.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
              ) : null}
            </LinearGradient>
          </Pressable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadow.raised,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
});
