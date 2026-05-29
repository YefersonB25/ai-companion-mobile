import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Message } from '@/types'
import { C } from '@/lib/theme'

interface Props {
  message: Message
  isStreaming?: boolean
}

// Simple markdown: **bold**, `code`, line breaks
function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const baseColor = isUser ? '#fff' : C.textPrimary
  const parts = text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\n)/g)

  const nodes = parts.map((part, i) => {
    if (part === '\n') {
      return <Text key={i}>{'\n'}</Text>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700', color: baseColor }}>
          {part.slice(2, -2)}
        </Text>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text key={i} style={[styles.inlineCode, { color: isUser ? '#c7d2fe' : '#a78bfa' }]}>
          {part.slice(1, -1)}
        </Text>
      )
    }
    return (
      <Text key={i} style={{ color: baseColor }}>
        {part}
      </Text>
    )
  })

  return <Text style={{ fontSize: 15, lineHeight: 23 }}>{nodes}</Text>
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.row, isUser && styles.rowReverse]}>
      {/* Avatar */}
      <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAI]}>
        {isUser
          ? <Ionicons name="person" size={14} color="#fff" />
          : <Ionicons name="sparkles" size={14} color={C.primary} />
        }
      </View>

      {/* Bubble */}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <MarkdownText text={message.content} isUser={isUser} />
        {isStreaming && (
          <Text style={styles.cursor}>▌</Text>
        )}
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
  row:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 5 },
  rowReverse: { flexDirection: 'row-reverse' },

  avatar: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 3,
  },
  avatarUser: { backgroundColor: C.primary },
  avatarAI:   { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },

  bubble: {
    maxWidth: '78%', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderTopRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: C.surface2,
    borderTopLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
  },

  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: C.surface,
    borderRadius: 4,
  },

  cursor: { color: C.primary, fontSize: 15 },
  meta:   { fontSize: 10, color: C.textSecondary, marginTop: 5 },
})
