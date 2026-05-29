import { useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useChatStore } from '@/store/chat'
import { Conversation } from '@/types'
import { useRouter } from 'expo-router'
import { C } from '@/lib/theme'

export default function ConversationsScreen() {
  const { conversations, loadConversations, selectConversation, createConversation } = useChatStore()
  const router = useRouter()

  useEffect(() => { loadConversations() }, [loadConversations])

  const handleSelect = async (conv: Conversation) => {
    await selectConversation(conv.id)
    router.push('/(app)')
  }

  const handleNew = async () => {
    await createConversation()
    router.push('/(app)')
  }

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={styles.itemIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title ?? 'Nueva conversación'}
        </Text>
        <View style={styles.itemMeta}>
          {item.provider && <Text style={styles.itemProvider}>{item.provider}</Text>}
          <Text style={styles.itemDate}>
            {new Date(item.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
    </TouchableOpacity>
  )

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
          <Text style={styles.emptyText}>Sin conversaciones aún</Text>
          <Text style={styles.emptySubtext}>Empieza desde la pestaña Chat</Text>
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
  list:      { paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  itemIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  itemContent:  { flex: 1 },
  itemTitle:    { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  itemMeta:     { flexDirection: 'row', gap: 8, marginTop: 3, alignItems: 'center' },
  itemProvider: {
    fontSize: 11, color: C.primary, backgroundColor: C.primaryMuted,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  itemDate:  { fontSize: 12, color: C.textSecondary },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 74 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText:    { fontSize: 18, fontWeight: '600', color: C.textPrimary },
  emptySubtext: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
})
