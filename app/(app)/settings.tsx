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
import { deviceControl } from '@/lib/deviceControl'
import { syncDailyBriefing } from '@/lib/localNotifications'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Partial<UserSetting>>({
    memory_enabled: true,
    stream_responses: true,
    language: 'es',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wakeWordOn, setWakeWordOn]     = useState(false)
  const [ttsSpeed, setTtsSpeedState]   = useState(0.95)
  const [ttsPitch, setTtsPitchState]   = useState(1.0)
  const [hasOverlay, setHasOverlay]    = useState(true)
  const [isDeviceAdmin, setIsDeviceAdmin]     = useState(false)
  const [hasNotifAccess, setHasNotifAccess]   = useState(false)
  const [canWriteSettings, setCanWrite]       = useState(false)
  const [drivingMode, setDrivingModeState]    = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    api.get('/settings').then(({ data }) => { if (data) setSettings(data) }).catch(() => {})
    wakeWord.isRunning().then(setWakeWordOn)
    if (wakeWord.available) wakeWord.canDrawOverlays().then(setHasOverlay)
    if (deviceControl.available) {
      deviceControl.isDeviceAdmin().then(setIsDeviceAdmin)
      deviceControl.hasNotificationAccess().then(setHasNotifAccess)
      deviceControl.canWriteSettings().then(setCanWrite)
    }
    if (wakeWord.available) wakeWord.isDrivingMode().then(setDrivingModeState)
  }, [])

  const setTtsSpeed = async (v: number) => { setTtsSpeedState(v); await wakeWord.setTtsSpeed(v) }
  const setTtsPitch = async (v: number) => { setTtsPitchState(v); await wakeWord.setTtsPitch(v) }

  const toggleDrivingMode = async (on: boolean) => {
    setDrivingModeState(on)
    await wakeWord.setDrivingMode(on)
  }

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
              Di &quot;Hey Aria&quot;, &quot;Oye Aria&quot; o &quot;Hola Aria&quot; para activarla. Mientras responde, di &quot;espera&quot;, &quot;para&quot; o &quot;pausa&quot; para interrumpirla.
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
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Para activar con el botón de encendido: ve a{' '}
                <Text style={styles.infoTextBold}>Ajustes → Apps → Predeterminadas → Asistente digital</Text>
                {' '}y selecciona AI Companion.
              </Text>
            </View>

            {/* Permiso overlay para abrir apps */}
            {!hasOverlay && (
              <TouchableOpacity
                style={[styles.row, { marginTop: 10, backgroundColor: C.surface2, borderRadius: 12, padding: 12 }]}
                onPress={async () => { await wakeWord.requestOverlayPermission(); setTimeout(() => wakeWord.canDrawOverlays().then(setHasOverlay), 1500) }}
                activeOpacity={0.75}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: '#f59e0b' }]}>⚠ Permiso para abrir apps</Text>
                  <Text style={styles.rowDesc}>Sin este permiso, Aria no puede abrir WhatsApp, Spotify, etc. desde voz</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
              </TouchableOpacity>
            )}
            {hasOverlay && (
              <View style={[styles.row, { marginTop: 10 }]}>
                <Text style={[styles.rowDesc, { color: '#22c55e' }]}>✓ Permiso para abrir apps concedido</Text>
              </View>
            )}

            {/* Velocidad de voz */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.rowLabel}>Velocidad de voz</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {[{ label: 'Lenta', v: 0.7 }, { label: 'Normal', v: 0.95 }, { label: 'Rápida', v: 1.3 }, { label: 'Muy rápida', v: 1.7 }].map(opt => (
                  <TouchableOpacity
                    key={opt.v}
                    onPress={() => setTtsSpeed(opt.v)}
                    style={[styles.chipBtn, Math.abs(ttsSpeed - opt.v) < 0.1 && styles.chipBtnActive]}
                  >
                    <Text style={[styles.chipText, Math.abs(ttsSpeed - opt.v) < 0.1 && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tono de voz */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.rowLabel}>Tono de voz</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {[{ label: 'Grave', v: 0.75 }, { label: 'Normal', v: 1.0 }, { label: 'Agudo', v: 1.3 }].map(opt => (
                  <TouchableOpacity
                    key={opt.v}
                    onPress={() => setTtsPitch(opt.v)}
                    style={[styles.chipBtn, Math.abs(ttsPitch - opt.v) < 0.1 && styles.chipBtnActive]}
                  >
                    <Text style={[styles.chipText, Math.abs(ttsPitch - opt.v) < 0.1 && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Control del dispositivo */}
        {deviceControl.available && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Control del dispositivo</Text>
            <Text style={styles.rowDesc}>
              Aria puede controlar tu teléfono por voz: pantalla, linterna, volumen, brillo y notificaciones.
            </Text>

            {/* Modo conducción */}
            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Modo conducción</Text>
                <Text style={styles.rowDesc}>Respuestas ultra-cortas mientras manejas</Text>
              </View>
              <Switch
                value={drivingMode}
                onValueChange={toggleDrivingMode}
                trackColor={{ false: C.surface, true: C.primaryMuted }}
                thumbColor={drivingMode ? C.primary : C.textSecondary}
              />
            </View>

            {/* Device Admin */}
            <TouchableOpacity
              style={[styles.row, { marginTop: 10, backgroundColor: isDeviceAdmin ? C.surface2 : C.primaryMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: isDeviceAdmin ? C.border : C.primary }]}
              onPress={async () => {
                if (!isDeviceAdmin) {
                  await deviceControl.requestDeviceAdmin()
                  setTimeout(() => deviceControl.isDeviceAdmin().then(setIsDeviceAdmin), 2000)
                }
              }}
              activeOpacity={isDeviceAdmin ? 1 : 0.75}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: isDeviceAdmin ? '#22c55e' : C.primary }]}>
                  {isDeviceAdmin ? '✓ Bloqueo de pantalla activo' : '⚠ Activar bloqueo de pantalla'}
                </Text>
                <Text style={styles.rowDesc}>
                  {isDeviceAdmin ? 'Aria puede bloquear la pantalla con tu voz' : 'Toca para activar administrador de dispositivo'}
                </Text>
              </View>
              {!isDeviceAdmin && <Ionicons name="chevron-forward" size={16} color={C.primary} />}
            </TouchableOpacity>

            {/* Notification Access */}
            <TouchableOpacity
              style={[styles.row, { marginTop: 8, backgroundColor: hasNotifAccess ? C.surface2 : C.primaryMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: hasNotifAccess ? C.border : C.primary }]}
              onPress={async () => {
                if (!hasNotifAccess) {
                  await deviceControl.requestNotificationAccess()
                  setTimeout(() => deviceControl.hasNotificationAccess().then(setHasNotifAccess), 2000)
                }
              }}
              activeOpacity={hasNotifAccess ? 1 : 0.75}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: hasNotifAccess ? '#22c55e' : C.primary }]}>
                  {hasNotifAccess ? '✓ Acceso a notificaciones activo' : '⚠ Activar acceso a notificaciones'}
                </Text>
                <Text style={styles.rowDesc}>
                  {hasNotifAccess ? 'Di "Lee mis notificaciones" para resumirlas con IA' : 'Toca para dar acceso a notificaciones'}
                </Text>
              </View>
              {!hasNotifAccess && <Ionicons name="chevron-forward" size={16} color={C.primary} />}
            </TouchableOpacity>

            {/* Write Settings */}
            <TouchableOpacity
              style={[styles.row, { marginTop: 8, backgroundColor: canWriteSettings ? C.surface2 : C.primaryMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: canWriteSettings ? C.border : C.primary }]}
              onPress={async () => {
                if (!canWriteSettings) {
                  await deviceControl.setBrightness(128)
                  setTimeout(() => deviceControl.canWriteSettings().then(setCanWrite), 2000)
                }
              }}
              activeOpacity={canWriteSettings ? 1 : 0.75}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: canWriteSettings ? '#22c55e' : C.primary }]}>
                  {canWriteSettings ? '✓ Control de brillo activo' : '⚠ Activar control de brillo'}
                </Text>
                <Text style={styles.rowDesc}>
                  {canWriteSettings ? 'Di "Pon brillo al máximo" o "Baja el brillo"' : 'Toca para dar permiso de ajustes del sistema'}
                </Text>
              </View>
              {!canWriteSettings && <Ionicons name="chevron-forward" size={16} color={C.primary} />}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Comandos: &quot;bloquea la pantalla&quot;, &quot;enciende la linterna&quot;, &quot;sube el volumen a 10&quot;, &quot;pon brillo al máximo&quot;, &quot;lee mis notificaciones&quot;, &quot;activa modo conducción&quot;
              </Text>
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
  infoBox:  { backgroundColor: C.primaryMuted, borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.primary },
  infoText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  infoTextBold: { fontWeight: '700', color: C.textPrimary },
  chipBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface2, borderWidth: 1.5, borderColor: C.border },
  chipBtnActive: { backgroundColor: C.primaryMuted, borderColor: C.primary },
  chipText: { fontSize: 12, color: C.textSecondary },
  chipTextActive: { color: C.primary, fontWeight: '600' },
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
