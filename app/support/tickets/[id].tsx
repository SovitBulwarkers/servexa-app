import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../../src/theme";
import { SupportAPI } from "../../../src/api/endpoints";
import { StatusPill, EmptyState } from "../../../src/components/ui";

const STATUS_TONE: Record<string, "info" | "success" | "warning" | "danger"> = {
  OPEN: "warning",
  RESOLVED: "success",
  CLOSED: "info",
  IN_PROGRESS: "info",
};

export default function TicketDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await SupportAPI.getTicket(id!);
      setTicket(data?.data ?? null);
    } catch {
      setError("Could not load this ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const isClosed = ticket?.status === "CLOSED";

  const sendReply = async () => {
    if (!reply.trim() || isClosed) return;
    setSending(true);
    setSendError(null);
    try {
      await SupportAPI.reply(id!, reply.trim());
      setReply("");
      await load();
    } catch (e: any) {
      setSendError(
        e?.response?.data?.message ||
          "Could not send your reply. Please try again.",
      );
      load();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (error || !ticket) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ticket</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          icon="cloud-offline-outline"
          title="Something went wrong"
          subtitle={error ?? "Ticket not found"}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ticket.subject}
          </Text>
        </View>
        <StatusPill
          label={ticket.status}
          tone={STATUS_TONE[ticket.status] ?? "info"}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={[
            {
              id: "description",
              senderType: "ME",
              message: ticket.description,
              createdAt: ticket.createdAt,
              isDescription: true,
            },
            ...(ticket.messages ?? []),
          ]}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isAdmin = item.senderType === "ADMIN";
            const isAi = item.senderType === "AI";
            const isOtherSide = isAdmin || isAi;
            return (
              <View
                style={[
                  styles.bubbleRow,
                  isOtherSide ? styles.rowLeft : styles.rowRight,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isOtherSide ? styles.bubbleAdmin : styles.bubbleMe,
                  ]}
                >
                  {isOtherSide && (
                    <Text style={styles.bubbleSender}>
                      {isAi ? "AI Assistant" : "Support"}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.bubbleText,
                      isOtherSide ? styles.bubbleTextAdmin : styles.bubbleTextMe,
                    ]}
                  >
                    {item.message}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleTime,
                      isOtherSide ? styles.bubbleTimeAdmin : styles.bubbleTimeMe,
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {isClosed ? (
          <View style={styles.closedBanner}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.closedBannerText}>
              This ticket is closed. You can no longer send messages here —
              raise a new ticket if you need further help.
            </Text>
          </View>
        ) : (
          <View style={styles.replyBar}>
            {sendError ? (
              <Text style={styles.sendError}>{sendError}</Text>
            ) : null}
            <View style={styles.replyRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your message..."
                placeholderTextColor={colors.textMuted}
                value={reply}
                onChangeText={setReply}
                multiline
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  (!reply.trim() || sending) && styles.sendBtnDisabled,
                ]}
                onPress={sendReply}
                disabled={!reply.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Ionicons name="send" size={18} color={colors.surface} />
                )}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  list: { padding: spacing.xl, gap: spacing.md },
  bubbleRow: { flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.subtle,
  },
  bubbleAdmin: { backgroundColor: colors.surface, borderTopLeftRadius: 4 },
  bubbleMe: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleSender: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  bubbleText: { fontSize: fontSize.sm },
  bubbleTextAdmin: { color: colors.textPrimary },
  bubbleTextMe: { color: colors.surface },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeAdmin: { color: colors.textMuted },
  bubbleTimeMe: { color: colors.surface + "AA" },
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closedBannerText: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted },
  replyBar: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendError: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  replyRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  replyInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.textMuted },
});
