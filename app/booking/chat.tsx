import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Socket } from 'socket.io-client';
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../src/theme';
import { ChatAPI, ChatMessage, BookingAPI } from '../../src/api/endpoints';
import { getSocket } from '../../src/lib/socket';
import { useAuth } from '../../src/store/auth-context';

export default function BookingChat() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [workerName, setWorkerName] = useState<string>('Professional');
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const [msgRes, bookingRes] = await Promise.all([
        ChatAPI.getMessages(bookingId),
        BookingAPI.getById(bookingId).catch(() => null),
      ]);
      setMessages((msgRes.data?.data ?? []).slice().reverse());
if (bookingRes?.data?.data?.worker?.name) setWorkerName(bookingRes.data.data.worker.name);
    } catch {
      setError('Could not load this conversation. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    (async () => {
      const socket = await getSocket('chat');
      if (!mounted) return;
      socketRef.current = socket;

      const onConnect = () => {
        setConnected(true);
        socket.emit('join-booking', { bookingId });
        socket.emit('mark-read', { bookingId });
      };
      const onDisconnect = () => setConnected(false);
      const onNewMessage = (msg: ChatMessage) => {
        if (msg.bookingId !== bookingId) return;
        setMessages((prev) => [...prev, msg]);
        socket.emit('mark-read', { bookingId });
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('new-message', onNewMessage);
      if (socket.connected) onConnect();

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('new-message', onNewMessage);
      };
    })();

    return () => { mounted = false; };
  }, [bookingId]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current || !bookingId) return;
    socketRef.current.emit('send-message', {
      bookingId,
      message: trimmed,
      senderType: 'CUSTOMER',
    });
    setText('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === user?.id || item.senderType === 'CUSTOMER';
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.message}</Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{workerName}</Text>
          <Text style={styles.headerSub}>{connected ? 'Online' : 'Connecting…'}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.textMuted }]} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={renderItem}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Say hello to get started</Text>
              </View>
            }
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message…"
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <Pressable style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={send} disabled={!text.trim()}>
              <Ionicons name="send" size={18} color={colors.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
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
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSub: { fontSize: fontSize.xs, color: colors.textMuted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  retryText: { color: colors.primary, fontWeight: fontWeight.bold },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, maxHeight: 100, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSize.sm, color: colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textMuted },
});
