import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Switch, TextInput, Modal, ScrollView, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '@/lib/api'
import { AiProvider } from '@/types'
import Button from '@/components/ui/Button'

const PROVIDER_KEY_URLS: Record<string, { url: string; label: string; isFree: boolean }> = {
  claude:   { url: 'https://console.anthropic.com/settings/keys',     label: 'console.anthropic.com',     isFree: false },
  openai:   { url: 'https://platform.openai.com/api-keys',            label: 'platform.openai.com',       isFree: false },
  deepseek: { url: 'https://platform.deepseek.com/api_keys',          label: 'platform.deepseek.com',     isFree: false },
  gemini:   { url: 'https://aistudio.google.com/apikey',              label: 'aistudio.google.com',       isFree: true  },
  mistral:  { url: 'https://console.mistral.ai/api-keys',             label: 'console.mistral.ai',        isFree: false },
}

const PROVIDER_EMOJIS: Record<string, string> = {
  claude: '🟣', openai: '🟢', deepseek: '🔵', gemini: '🔶', mistral: '🔴',
}

const SUPPORTED = [
  { name: 'claude',   label: 'Anthropic Claude', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
  { name: 'openai',   label: 'OpenAI GPT',       models: ['gpt-4o', 'gpt-4o-mini', 'o1'] },
  { name: 'deepseek', label: 'DeepSeek',         models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: 'gemini',   label: 'Google Gemini',    models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { name: 'mistral',  label: 'Mistral AI',       models: ['mistral-large-latest', 'codestral-latest'] },
]

export default function ProvidersScreen() {
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ provider: 'gemini', model: 'gemini-2.5-flash', api_key: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await api.get('/providers')
    setProviders(data)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.api_key.trim()) {
      Alert.alert('Error', 'Ingresa tu API key')
      return
    }
    setSaving(true)
    try {
      await api.post('/providers', form)
      setShowModal(false)
      setForm({ provider: 'claude', model: 'claude-sonnet-4-6', api_key: '' })
      await load()
    } catch {
      Alert.alert('Error', 'No se pudo guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (id: number) => {
    await api.patch(`/providers/${id}`, { is_default: true })
    await load()
  }

  const toggleActive = async (p: AiProvider) => {
    await api.patch(`/providers/${p.id}`, { is_active: !p.is_active })
    await load()
  }

  const remove = (id: number) => {
    Alert.alert('Eliminar proveedor', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.delete(`/providers/${id}`)
        await load()
      }},
    ])
  }

  const currentModels = SUPPORTED.find((s) => s.name === form.provider)?.models ?? []

  const renderProvider = ({ item }: { item: AiProvider }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{PROVIDER_EMOJIS[item.provider] ?? '🤖'}</Text>
        <View>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{item.provider}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>⭐ Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardModel}>{item.model}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleActive(item)}
          trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
          thumbColor={item.is_active ? '#6366f1' : '#fff'}
        />
        {!item.is_default && (
          <TouchableOpacity onPress={() => setDefault(item.id)} style={styles.actionBtn}>
            <Text style={styles.actionText}>⭐</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => remove(item.id)} style={styles.actionBtn}>
          <Text style={styles.actionText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Proveedores IA</Text>
          <Text style={styles.subtitle}>Gestiona tus API keys y modelos</Text>
        </View>
        <Button label="+ Agregar" onPress={() => setShowModal(true)} size="sm" />
      </View>

      {providers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={styles.emptyText}>Sin proveedores configurados</Text>
          <Text style={styles.emptySubtext}>Agrega tu primera API key para empezar</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar proveedor</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Proveedor</Text>
            <View style={styles.providerGrid}>
              {SUPPORTED.map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[styles.providerOption, form.provider === s.name && styles.providerSelected]}
                  onPress={() => setForm({ ...form, provider: s.name, model: s.models[0] })}
                >
                  <Text style={styles.providerEmoji}>{PROVIDER_EMOJIS[s.name]}</Text>
                  <Text style={[styles.providerName, form.provider === s.name && styles.providerNameSelected]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Modelo</Text>
            <View style={styles.modelGrid}>
              {currentModels.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modelOption, form.model === m && styles.modelSelected]}
                  onPress={() => setForm({ ...form, model: m })}
                >
                  <Text style={[styles.modelText, form.model === m && styles.modelTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>API Key</Text>
            <TextInput
              style={styles.keyInput}
              value={form.api_key}
              onChangeText={(v) => setForm({ ...form, api_key: v })}
              placeholder="sk-... o similar"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoCapitalize="none"
            />

            {PROVIDER_KEY_URLS[form.provider] && (
              <TouchableOpacity
                style={styles.helpLink}
                onPress={() => Linking.openURL(PROVIDER_KEY_URLS[form.provider].url)}
                activeOpacity={0.7}
              >
                <Text style={styles.helpText}>
                  {PROVIDER_KEY_URLS[form.provider].isFree ? '✨ Gratis · ' : '💳 De pago · '}
                  Generar key en {PROVIDER_KEY_URLS[form.provider].label} ↗
                </Text>
              </TouchableOpacity>
            )}

            <Button label={saving ? 'Guardando...' : 'Guardar proveedor'} onPress={handleSave} loading={saving} size="lg" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title:   { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  list:    { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji:    { fontSize: 28 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' },
  cardModel:    { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  defaultBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  defaultBadgeText: { fontSize: 10, color: '#92400e', fontWeight: '600' },
  cardActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn:    { padding: 6 },
  actionText:   { fontSize: 18 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  modal:        { flex: 1, backgroundColor: '#fff' },
  modalHeader:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  modalClose: { fontSize: 20, color: '#94a3b8', padding: 4 },
  modalContent: { padding: 20, gap: 16 },
  fieldLabel:   { fontSize: 14, fontWeight: '600', color: '#374151' },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  providerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  providerSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  providerEmoji:    { fontSize: 16 },
  providerName:     { fontSize: 13, color: '#64748b', fontWeight: '500' },
  providerNameSelected: { color: '#6366f1' },
  modelGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modelOption:  {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modelSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  modelText:     { fontSize: 12, color: '#64748b' },
  modelTextSelected: { color: '#6366f1', fontWeight: '600' },
  keyInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc',
  },
  helpLink: {
    paddingVertical: 8, paddingHorizontal: 4,
    marginTop: -8, marginBottom: 8,
  },
  helpText: { fontSize: 12, color: '#6366f1', textDecorationLine: 'underline' },
})
