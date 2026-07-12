import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';

/**
 * Wraps a screen with text inputs so the focused field is never hidden
 * behind the keyboard. Fixes the app-wide "input hidden under keyboard" bug.
 *
 * - iOS: uses KeyboardAvoidingView "padding" behavior.
 * - Android: relies on windowSoftInputMode=adjustResize (set in app.json)
 *   plus a ScrollView so content can always scroll the focused field into view.
 */
export default function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  scroll = true,
  edges = ['top', 'bottom'],
  keyboardVerticalOffset = 0,
  backgroundColor = colors.background,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  edges?: Edge[];
  keyboardVerticalOffset?: number;
  backgroundColor?: string;
}) {
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});
