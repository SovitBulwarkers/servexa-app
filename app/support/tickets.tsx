import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  shadow,
} from "../../src/theme";
import { SupportAPI } from "../../src/api/endpoints";
import { StatusPill, EmptyState } from "../../src/components/ui";
import { Input } from "../../src/components/ui";
import Button from "../../src/components/Button";

const STATUS_TONE: Record<string, "info" | "success" | "warning" | "danger"> = {
  OPEN: "warning",
  RESOLVED: "success",
  CLOSED: "info",
  IN_PROGRESS: "info",
};

export default function SupportTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const { data } = await SupportAPI.myTickets();
      setTickets(data?.data?.tickets ?? []);
    } catch {
      setError("Could not load your support tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Fill in all fields");
      return;
    }
    setCreating(true);
    try {
      await SupportAPI.createTicket({
        subject: subject.trim(),
        description: message.trim(),
      });
      setShowCreate(false);
      setSubject("");
      setMessage("");
      await load();
    } catch {
      Alert.alert(
        "Could not create ticket",
        "Please check your connection and try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Pressable
          onPress={() => router.push("/support/faq")}
          style={styles.faqBtn}
        >
          <Text style={styles.faqBtnText}>FAQ</Text>
        </Pressable>
      </View>

      {/* Contact options */}
      <View style={styles.contactRow}>
        {[
          {
            icon: "chatbubble-outline" as const,
            label: "Chat",
            color: colors.primary,
          },
          {
            icon: "call-outline" as const,
            label: "Call",
            color: colors.success,
          },
          {
            icon: "mail-outline" as const,
            label: "Email",
            color: colors.warning,
          },
        ].map((c) => (
          <Pressable key={c.label} style={styles.contactBtn}>
            <View
              style={[styles.contactIcon, { backgroundColor: c.color + "20" }]}
            >
              <Ionicons name={c.icon} size={22} color={c.color} />
            </View>
            <Text style={styles.contactLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.ticketsHeader}>
        <Text style={styles.sectionTitle}>My Tickets</Text>
        <Pressable
          style={styles.newTicketBtn}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.newTicketText}>New Ticket</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: spacing.xxl }}
        />
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Something went wrong"
          subtitle={error}
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.ticketCard}
              onPress={() => router.push(`/support/tickets/${item.id}`)}
            >
              <View style={styles.ticketTop}>
                <View style={styles.ticketIcon}>
                  <Ionicons
                    name="ticket-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {item.subject}
                  </Text>
                  <Text style={styles.ticketDate}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <StatusPill
                  label={item.status}
                  tone={STATUS_TONE[item.status] ?? "info"}
                />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="ticket-outline"
              title="No tickets yet"
              subtitle="Raise a ticket if you need help"
            />
          }
        />
      )}

      {/* Create ticket modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Raise a Ticket</Text>
            <Pressable onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
              <Input
                label="Subject"
                leftIcon="document-text-outline"
                placeholder="Brief description of your issue"
                value={subject}
                onChangeText={setSubject}
              />
              <Text style={styles.msgLabel}>Message</Text>
              <TextInput
                style={styles.msgInput}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
              <Button
                title="Submit Ticket"
                onPress={createTicket}
                loading={creating}
                style={{ marginTop: spacing.xl }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  faqBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
  },
  faqBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  contactRow: { flexDirection: "row", padding: spacing.xl, gap: spacing.md },
  contactBtn: { flex: 1, alignItems: "center", gap: spacing.sm },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  ticketsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  newTicketText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.subtle,
  },
  ticketTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  ticketIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketSubject: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  ticketDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  msgLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  msgInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    minHeight: 140,
  },
});
