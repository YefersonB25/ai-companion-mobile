import { useRef, useEffect, useState } from 'react'
import {
  View, FlatList, Text, StyleSheet, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import { Message } from '@/types'
import api from '@/lib/api'
import { AiProvider } from '@/types'

const SUGGESTIONS = [
  '¿Qué puedes hacer por mí?',
  'Ayúdame a planificar mi semana',
  '¿Qué me recomiendas para cenar?',
  'Quiero planificar unas vacaciones',
]

export default function ChatScreen() {
  const { messages, isStreaming, sendMessage, activeConversation, createConversation } = useChatStore()
  const { user } = useAuthStore()
  const [activeProvider, setActiveProvider] = useState<AiProvider | null>(null)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const listRef = useRef<FlatList>(null)
  const wasStreaming = useRef(false)

  useEffect(() => {
    api.get('/providers').then(({ data }) => {
      const def = (data as AiProvider[]).find((p) => p.is_default && p.is_active)
      setActiveProvider(def ?? null)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  // TTS: speak AI response when streaming ends
  useEffect(() => {
    if (wasStreaming.current && !isStreaming && ttsEnabled) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content) {
        Speech.stop()
        Speech.speak(last.content, { language: 'es-ES', rate: 0.95, pitch: 1.0 })
      }
    }
    wasStreaming.current = isStreaming
  }, [isStreaming, ttsEnabled, messages])

  // Stop TTS when unmounting
  useEffect(() => () => { Speech.stop() }, [])

  const handleSend = async (text: string) => {
    Speech.stop()
    if (!activeConversation) await createConversation()
    sendMessage(text)
  }

  const toggleTts = () => {
    if (ttsEnabled) Speech.stop()
    setTtsEnabled((v) => !v)
  }

  const renderItem = ({ item, index }: { item: Message; index: number }) => (
    <MessageBubble
      message={item}
      isStreaming={isStreaming && index === messages.length - 1 && item.role === 'assistant'}
    />
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>
            {activeProvider
              ? `${activeProvider.provider} · ${activeProvider.model}`
              : 'Configura un proveedor de IA'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* TTS toggle */}
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTts} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>{ttsEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
          {/* New conversation */}
          <TouchableOpacity style={styles.newBtn} onPress={createConversation} activeOpacity={0.8}>
            <Text style={styles.newBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages or welcome */}
      {messages.length === 0 ? (
        <View style={styles.welcome}>
          <Text style={styles.welcomeEmoji}>🧠</Text>
          <Text style={styles.welcomeTitle}>¿En qué puedo ayudarte?</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => handleSend(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ChatInput onSend={handleSend} isStreaming={isStreaming} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  greeting:      { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  subGreeting:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },
  newBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  newBtnText: { color: '#fff', fontSize: 22, lineHeight: 24 },
  list:        { flex: 1 },
  listContent: { paddingVertical: 8 },
  welcome:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  welcomeEmoji:   { fontSize: 64 },
  welcomeTitle:   { fontSize: 22, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  suggestions:    { width: '100%', gap: 10 },
  suggestion: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  suggestionText: { fontSize: 14, color: '#475569', textAlign: 'center' },
})
