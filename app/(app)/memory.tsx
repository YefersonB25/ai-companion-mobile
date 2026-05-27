import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '@/lib/api'
import { MemoryNode } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  person:     '#6366f1',
  project:    '#0ea5e9',
  habit:      '#22c55e',
  preference: '#f59e0b',
  event:      '#ec4899',
  skill:      '#8b5cf6',
  note:       '#64748b',
}

const TYPE_EMOJIS: Record<string, string> = {
  person:     '👤',
  project:    '📁',
  habit:      '🔄',
  preference: '⭐',
  event:      '📅',
  skill:      '🛠',
  note:       '📝',
}

export default function MemoryScreen() {
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [filtered, setFiltered] = useState<MemoryNode[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/memory/mindmap')
      setNodes(data.nodes ?? [])
      setFiltered(data.nodes ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = nodes
    if (activeType) result = result.filter((n) => n.type === activeType)
    if (search) result = result.filter(
      (n) => n.label.toLowerCase().includes(search.toLowerCase()) ||
             n.content.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [nodes, activeType, search])

  const types = [...new Set(nodes.map((n) => n.type))]

  const renderNode = ({ item }: { item: MemoryNode }) => (
    <View style={styles.node}>
      <View style={[styles.nodeIcon, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
        <Text style={styles.nodeEmoji}>{TYPE_EMOJIS[item.type] ?? '🔵'}</Text>
      </View>
      <View style={styles.nodeContent}>
        <View style={styles.nodeHeader}>
          <Text style={styles.nodeLabel} numberOfLines={1}>{item.label}</Text>
          <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] }]}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.nodeContent2} numberOfLines={2}>{item.content}</Text>
        <View style={styles.importanceBar}>
          <View style={[styles.importanceFill, { width: `${item.importance * 100}%` as any }]} />
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa Mental</Text>
        <Text style={styles.subtitle}>{nodes.length} nodos de memoria</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar en tu memoria..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Type filters */}
      {types.length > 0 && (
        <View style={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filter, !activeType && styles.filterActive]}
            onPress={() => setActiveType(null)}
          >
            <Text style={[styles.filterText, !activeType && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          {types.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filter, activeType === t && { backgroundColor: TYPE_COLORS[t] }]}
              onPress={() => setActiveType(activeType === t ? null : t)}
            >
              <Text style={[styles.filterText, activeType === t && styles.filterTextActive]}>
                {TYPE_EMOJIS[t]} {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🧠</Text>
          <Text style={styles.emptyText}>Sin nodos de memoria aún</Text>
          <Text style={styles.emptySubtext}>
            Empieza a chatear y tu asistente irá construyendo tu mapa mental
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderNode}
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
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title:   { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  search: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#1e293b',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  filtersScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filter: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterActive:     { backgroundColor: '#6366f1' },
  filterText:       { fontSize: 12, color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list:  { padding: 16, gap: 0 },
  node:  { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  nodeIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nodeEmoji:   { fontSize: 20 },
  nodeContent: { flex: 1, gap: 4 },
  nodeHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nodeLabel:   { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  typeBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  nodeContent2:  { fontSize: 13, color: '#64748b', lineHeight: 18 },
  importanceBar: {
    height: 3, backgroundColor: '#f1f5f9',
    borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  importanceFill: { height: 3, backgroundColor: '#6366f1', borderRadius: 2 },
  separator: { height: 1, backgroundColor: '#f8fafc' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
})
