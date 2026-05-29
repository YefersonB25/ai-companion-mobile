import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Switch, Alert, TouchableOpacity, TextInput, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { UserSetting } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { C } from '@/lib/theme'
import { wakeWord } from '@/lib/wakeWord'
import { syncDailyBriefing } from '@/lib/localNotifications'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Partial<UserSetting>>({
    memory_enabled: true,
    stream_responses: true,
    language: 'es',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wakeWordOn, setWakeWordOn] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    api.get('/settings').then(({ data }) => { if (data) setSettings(data) }).catch(() => {})
    wakeWord.isRunning().then(setWakeWordOn)
  }, [])

  const toggleWakeWord = async (on: boolean) => {
    if (on) {
      Alert.alert(
        'Activar "Hey Aria"',
        'AI Companion va a escuchar continuamente las frases "Hey Aria", "Oye Aria" u "Hola Aria" para abrirse automáticamente. Esto consume batería extra (~10-20% al día). Una notificación persistente indicará que está escuchando.\n\nRECOMENDADO: agrega AI Companion a la lista de "no optimizar batería" en Ajustes para que Android no mate el servicio.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Activar',
            onPress: async () => {
              const ok = await wakeWord.start()
              setWakeWordOn(ok)
              if (!ok) Alert.alert('Error', 'No se pudo activar. Verifica permisos de micrófono.')
            },
          },
        ]
      )
    } else {
      await wakeWord.stop()
      setWakeWordOn(false)
    }
  }

  const update = (key: keyof UserSetting, value: unknown) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', settings)
      // Re-schedule briefing local notif with new time/enabled flag
      await syncDailyBriefing()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
        await logout()
        router.replace('/(auth)/login')
      }},
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Text style={styles.pageTitle}>Ajustes</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(app)/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={16} color={C.primary} />
            <Text style={styles.profileBtnText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Comportamiento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comportamiento</Text>
          {[
            { key: 'memory_enabled',   label: 'Memoria activada',          desc: 'Tu asistente aprende sobre ti' },
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
                trackColor={{ false: C.surface, true: C.primaryMuted }}
                thumbColor={settings[key as keyof UserSetting] ? C.primary : C.textSecondary}
              />
            </View>
          ))}
        </View>

        {/* Activación por voz "Hey Aria" */}
        {wakeWord.available && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activación por voz</Text>
            <Text style={styles.rowDesc}>
              Di &quot;Hey Aria&quot;, &quot;Oye Aria&quot; o &quot;Hola Aria&quot; en cualquier momento (incluso con el teléfono bloqueado) y la app se abre lista para escuchar tu pregunta.
            </Text>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Escuchar siempre</Text>
                <Text style={styles.rowDesc}>Foreground service · consume batería extra</Text>
              </View>
              <Switch
                value={wakeWordOn}
                onValueChange={toggleWakeWord}
                trackColor={{ false: C.surface, true: C.primaryMuted }}
                thumbColor={wakeWordOn ? C.primary : C.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Briefing diario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Briefing diario</Text>
          <Text style={styles.rowDesc}>
            Resumen personalizado cada mañana: clima, agenda y novedades.
          </Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Activar briefing</Text>
            </View>
            <Switch
              value={!!settings.briefing_enabled}
              onValueChange={(v) => update('briefing_enabled', v)}
              trackColor={{ false: C.surface, true: C.primaryMuted }}
              thumbColor={settings.briefing_enabled ? C.primary : C.textSecondary}
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
                placeholder="Bogotá, Madrid, Miami..."
              />
            </>
          )}
        </View>

        {/* Persona */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persona del asistente</Text>
          <Input
            label="Nombre del asistente"
            value={settings.persona?.name ?? ''}
            onChangeText={(v) => update('persona', { ...settings.persona, name: v })}
            placeholder="Aria, Max, J.A.R.V.I.S..."
          />
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Instrucciones personalizadas</Text>
            <TextInput
              style={styles.textarea}
              value={settings.persona?.prompt ?? ''}
              onChangeText={(v) => update('persona', { ...settings.persona, prompt: v })}
              placeholder="Eres un asistente experto en logística..."
              placeholderTextColor={C.textSecondary}
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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={C.red} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AI Companion v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  scroll:    { padding: 20, gap: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: C.textPrimary },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { color: '#fff', fontSize: 20, fontWeight: '700' },
  userName:    { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  userEmail:   { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryMuted, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  profileBtnText: { color: C.primary, fontSize: 13, fontWeight: '600' },

  section: {
    backgroundColor: C.surface, borderRadius: 16,
    padding: 16, gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  rowDesc:  { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  textarea: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: C.textPrimary, backgroundColor: C.surface2,
    minHeight: 100,
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#3d1515',
    backgroundColor: '#1a0a0a',
  },
  logoutText: { color: C.red, fontWeight: '600', fontSize: 15 },
  version:    { textAlign: 'center', color: C.textMuted, fontSize: 12 },
})
