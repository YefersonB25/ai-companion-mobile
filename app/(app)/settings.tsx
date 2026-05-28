import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Switch, Alert, TouchableOpacity, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { UserSetting } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Partial<UserSetting>>({
    memory_enabled: true,
    stream_responses: true,
    language: 'es',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    api.get('/settings').then(({ data }) => { if (data) setSettings(data) }).catch(() => {})
  }, [])

  const update = (key: keyof UserSetting, value: unknown) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
        await logout()
        router.replace('/(auth)/login')
      }},
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Comportamiento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comportamiento</Text>
          {[
            { key: 'memory_enabled', label: 'Memoria activada', desc: 'Tu asistente aprende sobre ti' },
            { key: 'stream_responses', label: 'Respuestas en tiempo real', desc: 'Streaming de respuestas' },
          ].map(({ key, label, desc }) => (
            <View key={key} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowDesc}>{desc}</Text>
              </View>
              <Switch
                value={!!settings[key as keyof UserSetting]}
                onValueChange={(v) => update(key as keyof UserSetting, v)}
                trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
                thumbColor={settings[key as keyof UserSetting] ? '#6366f1' : '#fff'}
              />
            </View>
          ))}
        </View>

        {/* Briefing diario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Briefing diario</Text>
          <Text style={styles.rowDesc}>
            Tu asistente te envía cada mañana un resumen personalizado: clima, recordatorios y tu día.
          </Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Activar briefing</Text>
              <Text style={styles.rowDesc}>Recibe tu briefing cada mañana</Text>
            </View>
            <Switch
              value={!!settings.briefing_enabled}
              onValueChange={(v) => update('briefing_enabled', v)}
              trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
              thumbColor={settings.briefing_enabled ? '#6366f1' : '#fff'}
            />
          </View>
          {settings.briefing_enabled && (
            <>
              <Input
                label="Hora de envío (HH:MM)"
                value={settings.briefing_time ?? '08:00'}
                onChangeText={(v) => update('briefing_time', v)}
                placeholder="08:00"
                keyboardType="numeric"
              />
              <Input
                label="Ciudad para el clima"
                value={settings.briefing_city ?? ''}
                onChangeText={(v) => update('briefing_city', v)}
                placeholder="Ej: Bogotá, Madrid, Miami..."
              />
            </>
          )}
        </View>

        {/* Persona */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persona del asistente</Text>
          <Input
            label="Nombre"
            value={settings.persona?.name ?? ''}
            onChangeText={(v) => update('persona', { ...settings.persona, name: v })}
            placeholder="Ej: Aria, Max, Luna..."
          />
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Prompt del sistema</Text>
            <TextInput
              style={styles.textarea}
              value={settings.persona?.prompt ?? ''}
              onChangeText={(v) => update('persona', { ...settings.persona, prompt: v })}
              placeholder="Eres un asistente personal experto en logística..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button
          label={saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          onPress={handleSave}
          loading={saving}
          size="lg"
        />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AI Companion v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, gap: 24 },
  profile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 16,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userName:   { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  userEmail:  { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  section: {
    backgroundColor: '#f8fafc', borderRadius: 16,
    padding: 16, gap: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
  rowDesc:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  textarea: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#1e293b', backgroundColor: '#fff',
    minHeight: 100,
  },
  logoutBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#fecdd3',
  },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
  version:    { textAlign: 'center', color: '#cbd5e1', fontSize: 12 },
})
