import { useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useChatStore } from '@/store/chat'
import { Conversation } from '@/types'
import { useRouter } from 'expo-router'

export default function ConversationsScreen() {
  const { conversations, loadConversations, selectConversation } = useChatStore()
  const router = useRouter()

  useEffect(() => { loadConversations() }, [loadConversations])

  const handleSelect = async (conv: Conversation) => {
    await selectConversation(conv.id)
    router.push('/(app)')
  }

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>💬</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title ?? 'Nueva conversación'}
        </Text>
        <View style={styles.itemMeta}>
          {item.provider && (
            <Text style={styles.itemProvider}>{item.provider}</Text>
          )}
          <Text style={styles.itemDate}>
            {new Date(item.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.count}>{conversations.length} conversaciones</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>Sin conversaciones aún</Text>
          <Text style={styles.emptySubtext}>Empieza a chatear desde la pestaña Chat</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title:   { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  count:   { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  list:    { paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  itemIconText: { fontSize: 20 },
  itemContent:  { flex: 1 },
  itemTitle:    { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  itemMeta:     { flexDirection: 'row', gap: 8, marginTop: 3 },
  itemProvider: {
    fontSize: 11, color: '#6366f1', backgroundColor: '#eef2ff',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  itemDate:  { fontSize: 12, color: '#94a3b8' },
  chevron:   { fontSize: 20, color: '#cbd5e1' },
  separator: { height: 1, backgroundColor: '#f8fafc', marginLeft: 76 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
})
