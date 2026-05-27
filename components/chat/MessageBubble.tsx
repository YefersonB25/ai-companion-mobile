import { View, Text, StyleSheet } from 'react-native'
import { Message } from '@/types'

interface Props {
  message: Message
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.row, isUser && styles.rowReverse]}>
      <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAI]}>
        <Text style={styles.avatarText}>{isUser ? '👤' : '🤖'}</Text>
      </View>

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.content, isUser && styles.contentUser]}>
          {message.content}
          {isStreaming && <Text style={styles.cursor}>▌</Text>}
        </Text>

        {!isUser && message.provider && (
          <Text style={styles.meta}>
            {message.provider} · {message.model}
            {message.latency_ms ? ` · ${message.latency_ms}ms` : ''}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  rowReverse: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  avatarUser: { backgroundColor: '#6366f1' },
  avatarAI:   { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  avatarText: { fontSize: 14 },
  bubble: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: '#6366f1', borderTopRightRadius: 4 },
  bubbleAI:   { backgroundColor: '#f8fafc', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  content:     { fontSize: 15, lineHeight: 22, color: '#1e293b' },
  contentUser: { color: '#fff' },
  cursor:      { color: '#6366f1' },
  meta: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
})
