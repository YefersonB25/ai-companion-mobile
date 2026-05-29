import { useEffect, useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Alert, Share, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useChatStore } from '@/store/chat'
import { Conversation } from '@/types'
import { useRouter } from 'expo-router'
import { C } from '@/lib/theme'
import api from '@/lib/api'

// --- Helpers ---

function relativeTime(iso: string): string {
  const now = Date.now()
  const diff = Math.floor((now - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Ahora mismo'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Ayer'
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

const PROVIDER_COLORS: Record<string, string> = {
  openai:    '#10a37f',
  anthropic: '#d97706',
  google:    '#4285f4',
  gemini:    '#4285f4',
  groq:      '#f43f5e',
  ollama:    '#8b5cf6',
  mistral:   '#ff7000',
}

function providerColor(provider: string | null): string {
  if (!provider) return C.textMuted
  return PROVIDER_COLORS[provider.toLowerCase()] ?? C.primary
}

// --- Export ---

interface ExportMessage {
  role: string
  content: string
}

interface ExportResponse {
  title?: string
  messages?: ExportMessage[]
}

async function exportConversation(conv: Conversation): Promise<void> {
  const { data } = await api.get<ExportResponse>(`/conversations/${conv.id}/export`)
  const title = data.title ?? conv.title ?? 'Conversación'
  const date = new Date().toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const body = (data.messages ?? [])
    .map((m) => `[${m.role === 'user' ? 'Tú' : 'IA'}] ${m.content}`)
    .join('\n\n')

  const formatted = `=== ${title} ===\nExportado: ${date}\n\n${body}`

  await Share.share({ message: formatted, title })
}

// --- Component ---

export default function ConversationsScreen() {
  const {
    conversations,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
  } = useChatStore()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [exportingId, setExportingId] = useState<number | null>(null)

  useEffect(() => { loadConversations() }, [loadConversations])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await loadConversations() } finally { setRefreshing(false) }
  }, [loadConversations])

  const handleSelect = async (conv: Conversation) => {
    await selectConversation(conv.id)
    router.push('/(app)')
  }

  const handleNew = async () => {
    await createConversation()
    router.push('/(app)')
  }

  const handleLongPress = (conv: Conversation) => {
    Alert.alert(
      conv.title ?? 'Conversación',
      undefined,
      [
        {
          text: 'Abrir',
          onPress: () => handleSelect(conv),
        },
        {
          text: 'Exportar',
          onPress: () => handleExport(conv),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmDelete(conv),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    )
  }

  const handleExport = async (conv: Conversation) => {
    setExportingId(conv.id)
    try {
      await exportConversation(conv)
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar la conversación.')
    } finally {
      setExportingId(null)
    }
  }

  const confirmDelete = (conv: Conversation) => {
    Alert.alert(
      'Eliminar conversación',
      `¿Deseas eliminar "${conv.title ?? 'esta conversación'}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conv.id)
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la conversación.')
            }
          },
        },
      ],
    )
  }

  const renderItem = ({ item }: { item: Conversation }) => {
    const isExporting = exportingId === item.id
    const pColor = providerColor(item.provider)

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleSelect(item)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        {/* Icon with provider dot */}
        <View style={styles.itemIconWrap}>
          <View style={styles.itemIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.primary} />
          </View>
          <View style={[styles.providerDot, { backgroundColor: pColor }]} />
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title ?? 'Nueva conversación'}
          </Text>
          <View style={styles.itemMeta}>
            {item.provider && (
              <Text style={[styles.itemProvider, { color: pColor, borderColor: pColor + '44' }]}>
                {item.provider}
              </Text>
            )}
            {item.messages_count != null && (
              <Text style={styles.itemCount}>
                {item.messages_count} {item.messages_count === 1 ? 'mensaje' : 'mensajes'}
              </Text>
            )}
            <Text style={styles.itemDate}>{relativeTime(item.updated_at)}</Text>
          </View>
        </View>

        {isExporting
          ? <ActivityIndicator size="small" color={C.primary} />
          : <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.count}>{conversations.length} conversaciones</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleNew} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={40} color={C.textSecondary} />
          </View>
          <Text style={styles.emptyText}>Inicia tu primera conversación</Text>
          <Text style={styles.emptySubtext}>
            Tus conversaciones aparecerán aquí una vez que comiences a chatear.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleNew} activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Ir al Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary },
  count: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  newBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  itemIconWrap: { position: 'relative' },
  itemIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  providerDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: C.bg,
  },
  itemContent:  { flex: 1 },
  itemTitle:    { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  itemMeta:     { flexDirection: 'row', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' },
  itemProvider: {
    fontSize: 11, backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  itemCount: { fontSize: 12, color: C.textSecondary },
  itemDate:  { fontSize: 12, color: C.textMuted },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 74 },

  // Empty state
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText:    { fontSize: 18, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
})
