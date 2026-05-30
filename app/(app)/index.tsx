import { useRef, useEffect, useState } from 'react'
import {
  View, FlatList, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { textForTts } from '@/lib/textForTts'
import { useRouter, useFocusEffect, Link } from 'expo-router'
import { useCallback } from 'react'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import { Message } from '@/types'
import { AiProvider } from '@/types'
import api from '@/lib/api'
import { C } from '@/lib/theme'

const SUGGESTIONS = [
  { icon: 'search-outline',      text: '¿Qué pasó hoy en el mundo?' },
  { icon: 'partly-sunny-outline', text: '¿Cómo está el clima en mi ciudad?' },
  { icon: 'calendar-outline',    text: 'Ayúdame a planificar mi semana' },
  { icon: 'airplane-outline',    text: 'Quiero planificar unas vacaciones' },
]

export default function ChatScreen() {
  const router = useRouter()
  const { messages, isStreaming, sendMessage, activeConversation, createConversation } = useChatStore()
  const { user } = useAuthStore()
  const [activeProvider, setActiveProvider] = useState<AiProvider | null>(null)
  const [providersChecked, setProvidersChecked] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const listRef = useRef<FlatList>(null)
  const wasStreaming = useRef(false)

  const loadProvider = useCallback(() => {
    api.get('/providers').then(({ data }) => {
      const def = (data as AiProvider[]).find((p) => p.is_default && p.is_active)
        ?? (data as AiProvider[]).find((p) => p.is_active)
        ?? null
      setActiveProvider(def)
      setProvidersChecked(true)
    }).catch(() => setProvidersChecked(true))
  }, [])

  // Re-check provider when returning to chat (e.g. after configuring one)
  useFocusEffect(useCallback(() => { loadProvider() }, [loadProvider]))

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  useEffect(() => {
    if (wasStreaming.current && !isStreaming && ttsEnabled) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content) {
        const spoken = textForTts(last.content)
        if (spoken) {
          Speech.stop()
          setIsSpeaking(true)
          Speech.speak(spoken, {
            language: 'es-ES',
            rate: 0.95,
            pitch: 1.0,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          })
        }
      }
    }
    wasStreaming.current = isStreaming
  }, [isStreaming, ttsEnabled, messages])

  useEffect(() => () => { Speech.stop(); setIsSpeaking(false) }, [])

  const handleSend = async (text: string, opts?: { viaVoice?: boolean; imageUri?: string | null }) => {
    Speech.stop()
    setIsSpeaking(false)
    if (!activeConversation) await createConversation()

    if (opts?.imageUri) {
      // Send as multipart/form-data when an image is attached
      const conv = activeConversation ?? await (async () => { await createConversation(); return activeConversation })()
      if (!conv) { sendMessage(text, opts); return }
      const form = new FormData()
      form.append('content', text)
      form.append('image', { uri: opts.imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any)
      try {
        await api.post(`/conversations/${conv.id}/messages`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch (e) {
        console.warn('Image upload failed, falling back to text only', e)
        sendMessage(text, opts)
      }
    } else {
      sendMessage(text, opts)
    }
  }

  const toggleTts = () => {
    if (ttsEnabled) { Speech.stop(); setIsSpeaking(false) }
    setTtsEnabled((v) => !v)
  }

  const renderItem = ({ item, index }: { item: Message; index: number }) => (
    <MessageBubble
      message={item}
      isStreaming={isStreaming && index === messages.length - 1 && item.role === 'assistant'}
    />
  )

  const firstName = user?.name?.split(' ')[0] ?? 'Usuario'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Ionicons name="sparkles" size={16} color={C.primary} />
          </View>
          <View>
            <Text style={styles.greeting}>Hola, {firstName}</Text>
            <Text style={styles.providerBadge}>
              {activeProvider
                ? `${activeProvider.provider} · ${activeProvider.model}`
                : 'Sin proveedor activo'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTts} activeOpacity={0.7}>
            <Ionicons
              name={ttsEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
              size={18}
              color={ttsEnabled ? C.primary : C.textSecondary}
            />
          </TouchableOpacity>
          <Link href="/(app)/help" asChild>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={styles.newBtn} onPress={createConversation} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages or welcome */}
      {messages.length === 0 ? (
        <View style={styles.welcome}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="sparkles" size={36} color={C.primary} />
          </View>
          <Text style={styles.welcomeTitle}>¿En qué puedo ayudarte?</Text>
          <Text style={styles.welcomeSub}>Tu asistente personal está listo</Text>

          {providersChecked && !activeProvider && (
            <View style={styles.setupCard}>
              <View style={styles.setupHeader}>
                <Ionicons name="warning-outline" size={20} color={C.primary} />
                <Text style={styles.setupTitle}>Configura tu IA para empezar</Text>
              </View>
              <Text style={styles.setupBody}>
                Necesitas agregar un proveedor de IA (Gemini es gratis). Sin esto, las respuestas no funcionarán.
              </Text>
              <TouchableOpacity
                style={styles.setupBtn}
                onPress={() => router.push('/(app)/providers' as never)}
                activeOpacity={0.85}
              >
                <Ionicons name="hardware-chip-outline" size={16} color="#fff" />
                <Text style={styles.setupBtnText}>Configurar ahora</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeProvider && (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.text}
                  style={styles.suggestion}
                  onPress={() => handleSend(s.text)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={s.icon as any} size={16} color={C.primary} />
                  <Text style={styles.suggestionText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          // M-07: optimizaciones de performance
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          removeClippedSubviews={true}
          initialNumToRender={15}
          getItemLayout={undefined}  // sin getItemLayout porque los mensajes son variable height
        />
      )}

      <ChatInput onSend={handleSend} isStreaming={isStreaming} isSpeaking={isSpeaking} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting:      { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  providerBadge: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center',
  },
  newBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },

  list:        { flex: 1 },
  listContent: { paddingVertical: 12 },

  welcome: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 12,
  },
  welcomeIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: C.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  welcomeSub:   { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 8 },

  suggestions: { width: '100%', gap: 8 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: C.border,
  },
  suggestionText: { fontSize: 14, color: C.textPrimary, flex: 1 },

  setupCard: {
    width: '100%',
    backgroundColor: C.primaryMuted,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.primary,
    gap: 10,
    marginTop: 4,
  },
  setupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setupTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  setupBody: { color: C.textSecondary, fontSize: 13, lineHeight: 19 },
  setupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, paddingVertical: 11, borderRadius: 12, marginTop: 4,
  },
  setupBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
