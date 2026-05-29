import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput,
  Alert, RefreshControl, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '@/lib/api'
import { MemoryNode } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateStr?: string | null): string | null {
  if (!dateStr) return null
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return null
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60)       return 'hace un momento'
  if (diffSec < 3600)     return `hace ${Math.floor(diffSec / 60)} min`
  if (diffSec < 86400)    return `hace ${Math.floor(diffSec / 3600)} h`
  if (diffSec < 2592000)  return `hace ${Math.floor(diffSec / 86400)} días`
  if (diffSec < 31536000) return `hace ${Math.floor(diffSec / 2592000)} meses`
  return `hace ${Math.floor(diffSec / 31536000)} años`
}

function importanceDot(importance: number): string {
  if (importance >= 0.7) return '#22c55e'   // high — green
  if (importance >= 0.4) return '#f59e0b'   // medium — amber
  return '#94a3b8'                           // low — gray
}

function attributeTags(attrs: Record<string, unknown> | null): string[] {
  if (!attrs) return []
  const skip = new Set(['id', 'user_id', 'created_at', 'updated_at'])
  return Object.entries(attrs)
    .filter(([k, v]) => !skip.has(k) && v !== null && v !== '' && typeof v !== 'object')
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${v}`)
}

// ---------------------------------------------------------------------------
// Stats header component
// ---------------------------------------------------------------------------

function StatsHeader({ nodes }: { nodes: MemoryNode[] }) {
  const total = nodes.length
  if (total === 0) return null

  const counts: Record<string, number> = {}
  for (const n of nodes) counts[n.type] = (counts[n.type] ?? 0) + 1

  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <View style={styles.statsBar}>
      <Text style={styles.statsTotal}>{total} memorias</Text>
      {topTypes.map(([type, count]) => (
        <View key={type} style={styles.statsPill}>
          <Text style={styles.statsPillText}>
            {TYPE_EMOJIS[type] ?? '🔵'} {count} {type}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Memory card
// ---------------------------------------------------------------------------

interface MemoryCardProps {
  item: MemoryNode
  onDelete: (node: MemoryNode) => void
}

function MemoryCard({ item, onDelete }: MemoryCardProps) {
  const [showActions, setShowActions] = useState(false)
  const tags = attributeTags(item.attributes)
  const timeAgo = relativeTime(item.updated_at)
  const dotColor = importanceDot(item.importance)
  const typeColor = TYPE_COLORS[item.type] ?? '#64748b'

  const handleLongPress = () => {
    setShowActions(true)
    Alert.alert(
      '¿Eliminar esta memoria?',
      `"${item.label}" será eliminado permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setShowActions(false) },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setShowActions(false)
            onDelete(item)
          },
        },
      ],
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={handleLongPress}
      style={[styles.node, showActions && styles.nodeHighlighted]}
    >
      {/* Icon */}
      <View style={[styles.nodeIcon, { backgroundColor: typeColor + '20' }]}>
        <Text style={styles.nodeEmoji}>{TYPE_EMOJIS[item.type] ?? '🔵'}</Text>
      </View>

      {/* Body */}
      <View style={styles.nodeContent}>
        <View style={styles.nodeHeader}>
          <Text style={styles.nodeLabel} numberOfLines={1}>{item.label}</Text>

          {/* Importance dot */}
          <View style={[styles.importanceDot, { backgroundColor: dotColor }]} />

          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type}</Text>
          </View>
        </View>

        <Text style={styles.nodeBody} numberOfLines={2}>{item.content}</Text>

        {/* Attribute tags */}
        {tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Footer row */}
        <View style={styles.nodeFooter}>
          {/* Importance bar */}
          <View style={styles.importanceBarWrap}>
            <View style={[styles.importanceFill, {
              width: `${item.importance * 100}%` as any,
              backgroundColor: dotColor,
            }]} />
          </View>

          {/* Time */}
          {timeAgo && <Text style={styles.timeAgo}>{timeAgo}</Text>}
        </View>
      </View>

      {/* Trash button (always visible on right) */}
      <TouchableOpacity
        style={styles.trashBtn}
        onPress={handleLongPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.trashIcon}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MemoryScreen() {
  const [nodes, setNodes]         = useState<MemoryNode[]>([])
  const [filtered, setFiltered]   = useState<MemoryNode[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState(false)

  // ---- Data loading ----

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/memory/mindmap')
      const fetched: MemoryNode[] = data.nodes ?? []
      setNodes(fetched)
      setFiltered(fetched)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const { data } = await api.get('/memory/mindmap')
      const fetched: MemoryNode[] = data.nodes ?? []
      setNodes(fetched)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ---- Filtering ----

  useEffect(() => {
    let result = nodes
    if (activeType) result = result.filter((n) => n.type === activeType)
    if (search) result = result.filter(
      (n) =>
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()),
    )
    setFiltered(result)
  }, [nodes, activeType, search])

  // ---- Delete single ----

  const handleDelete = useCallback(async (node: MemoryNode) => {
    try {
      await api.delete(`/memory/${node.id}`)
      setNodes((prev) => prev.filter((n) => n.id !== node.id))
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la memoria. Intenta de nuevo.')
    }
  }, [])

  // ---- Delete all ----

  const handleClearAll = () => {
    if (nodes.length === 0) return
    Alert.alert(
      'Limpiar toda la memoria',
      `¿Estás seguro? Se eliminarán ${nodes.length} nodos permanentemente. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar todo',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              // No bulk endpoint — delete in parallel batches of 5
              const ids = nodes.map((n) => n.id)
              const BATCH = 5
              for (let i = 0; i < ids.length; i += BATCH) {
                await Promise.all(
                  ids.slice(i, i + BATCH).map((id) => api.delete(`/memory/${id}`)),
                )
              }
              setNodes([])
            } catch {
              Alert.alert('Error', 'Algunos nodos no pudieron eliminarse.')
              load(true)
            } finally {
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  // ---- Unique types ----

  const types = [...new Set(nodes.map((n) => n.type))]

  // ---- Render ----

  const renderNode = useCallback(
    ({ item }: { item: MemoryNode }) => (
      <MemoryCard item={item} onDelete={handleDelete} />
    ),
    [handleDelete],
  )

  const ListHeader = (
    <>
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

      {/* Stats */}
      <StatsHeader nodes={nodes} />

      {/* Type filters */}
      {types.length > 0 && (
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filter, !activeType && styles.filterActive]}
            onPress={() => setActiveType(null)}
          >
            <Text style={[styles.filterText, !activeType && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          {types.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filter, activeType === t && { backgroundColor: TYPE_COLORS[t] ?? '#6366f1' }]}
              onPress={() => setActiveType(activeType === t ? null : t)}
            >
              <Text style={[styles.filterText, activeType === t && styles.filterTextActive]}>
                {TYPE_EMOJIS[t]} {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  )

  const ListFooter = nodes.length > 0 ? (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.clearBtn, deleting && styles.clearBtnDisabled]}
        onPress={handleClearAll}
        disabled={deleting}
      >
        {deleting
          ? <ActivityIndicator color="#ef4444" size="small" />
          : <Text style={styles.clearBtnText}>🗑 Limpiar toda la memoria</Text>
        }
      </TouchableOpacity>
    </View>
  ) : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Screen header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mapa Mental</Text>
          <Text style={styles.subtitle}>{nodes.length} nodos de memoria</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderNode}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🧠</Text>
              <Text style={styles.emptyText}>
                {search || activeType ? 'Sin resultados' : 'Sin nodos de memoria aún'}
              </Text>
              <Text style={styles.emptySubtext}>
                {search || activeType
                  ? 'Prueba con otros filtros o términos de búsqueda.'
                  : 'Empieza a chatear y tu asistente irá construyendo tu mapa mental.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title:    { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  search: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#1e293b',
    borderWidth: 1, borderColor: '#e2e8f0',
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingBottom: 10,
    alignItems: 'center',
  },
  statsTotal: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  statsPill: {
    backgroundColor: '#f1f5f9', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statsPillText: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  // Filters
  filtersRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  filter:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  filterActive:    { backgroundColor: '#6366f1' },
  filterText:      { fontSize: 12, color: '#64748b', fontWeight: '500' },
  filterTextActive:{ color: '#fff' },

  // List
  list:      { padding: 16 },
  listEmpty: { flex: 1 },
  separator: { height: 1, backgroundColor: '#f8fafc' },

  // Node card
  node: {
    flexDirection: 'row', gap: 12, paddingVertical: 12,
    borderRadius: 12, paddingHorizontal: 4,
  },
  nodeHighlighted: { backgroundColor: '#fef2f2' },
  nodeIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nodeEmoji:   { fontSize: 20 },
  nodeContent: { flex: 1, gap: 4 },
  nodeHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nodeLabel:   { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },

  importanceDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  typeBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeBadgeText:{ fontSize: 10, fontWeight: '600' },

  nodeBody: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  // Tags
  tagsRow:   { marginTop: 4 },
  tag: {
    backgroundColor: '#f1f5f9', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 6,
  },
  tagText: { fontSize: 10, color: '#475569', fontWeight: '500' },

  // Footer row (importance + time)
  nodeFooter:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  importanceBarWrap: {
    flex: 1, height: 3, backgroundColor: '#f1f5f9',
    borderRadius: 2, overflow: 'hidden',
  },
  importanceFill:  { height: 3, borderRadius: 2 },
  timeAgo:         { fontSize: 10, color: '#94a3b8', flexShrink: 0 },

  // Trash button
  trashBtn: {
    justifyContent: 'center', alignItems: 'center',
    paddingLeft: 4, flexShrink: 0,
  },
  trashIcon: { fontSize: 16 },

  // Empty state
  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 32, paddingTop: 48,
  },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  // Loading
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  // Footer / clear all
  footer: {
    paddingTop: 24, paddingBottom: 8, alignItems: 'center',
  },
  clearBtn: {
    borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minWidth: 200, justifyContent: 'center',
  },
  clearBtnDisabled: { opacity: 0.5 },
  clearBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
})
