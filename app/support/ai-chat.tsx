import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
} from "../../src/theme";
import { AiSupportAPI, AiChatTurn } from "../../src/api/endpoints";

interface DisplayMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

const WELCOME: DisplayMessage = {
  id: "welcome",
  role: "model",
  text:
    "Hi! I'm HomeServe's support assistant. Ask me about bookings, payments, tracking, or subscriptions — and I can connect you to a human agent any time.",
};

export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestEscalation, setSuggestEscalation] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const listRef = useRef<FlatList>(null);

  const historyForApi = (): AiChatTurn[] =>
    messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, text: m.text }));

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { data } = await AiSupportAPI.chat(text, [
        ...historyForApi(),
        { role: "user", text },
      ]);
      const reply = data?.data;
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: "model", text: reply?.reply ?? "" },
      ]);
      setSuggestEscalation(!!reply?.suggestEscalation);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: "model",
          text:
            e?.response?.data?.message ||
            "Sorry, I'm having trouble responding right now. Try again, or talk to a human.",
        },
      ]);
      setSuggestEscalation(true);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const escalate = async () => {
    if (escalating) return;
    setEscalating(true);
    try {
      const { data } = await AiSupportAPI.escalate([
        ...historyForApi(),
      ]);
      const ticketId = data?.data?.ticketId;
      if (ticketId) {
        router.replace({ pathname: "/support/tickets/[id]", params: { id: ticketId } });
      } else {
        router.push("/support/tickets");
      }
    } catch (e: any) {
      Alert.alert(
        "Couldn't connect you",
        e?.response?.data?.message ||
          "Please try again, or raise a ticket from Help & Support.",
      );
    } finally {
      setEscalating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Support Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-powered • Instant replies</Text>
        </View>
        <Pressable
          onPress={escalate}
          disabled={escalating}
          style={styles.humanBtn}
        >
          {escalating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isMe = item.role === "user";
            return (
              <View
                style={[styles.bubbleRow, isMe ? styles.rowRight : styles.rowLeft]}
              >
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleAi]}>
                  {!isMe && <Text style={styles.bubbleSender}>AI Assistant</Text>}
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextAi]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            sending ? (
              <View style={[styles.bubbleRow, styles.rowLeft]}>
                <View style={[styles.bubble, styles.bubbleAi]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null
          }
        />

        {suggestEscalation && (
          <Pressable style={styles.escalateBanner} onPress={escalate}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.escalateBannerText}>
              Want to talk to a human agent instead? Tap here.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.replyBar}>
          <View style={styles.replyRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Ask a question..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!input.trim() || sending}
            >
              <Ionicons name="send" size={18} color={colors.surface} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  humanBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: { fontSize: fontSize.xs, color: colors.textMuted },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAi: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bubbleSender: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  bubbleText: { fontSize: fontSize.sm, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  bubbleTextAi: { color: colors.textPrimary },
  escalateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  escalateBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  replyBar: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  replyRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  replyInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
