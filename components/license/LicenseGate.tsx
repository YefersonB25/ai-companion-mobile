import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/auth'
import { useLicenseStore } from '@/store/license'
import type { LicenseStatus } from '@aria/core'
import api from '@/lib/api'
import { C } from '@/lib/theme'

type Screen = 'gate' | 'acquire' | 'sent'

export default function LicenseGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { status, loading, fetch } = useLicenseStore()

  useEffect(() => {
    if (user) fetch()
  }, [user, fetch])

  if (loading || !status) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    )
  }

  // Admins bypass, app open, or active license → render app normally
  if (!status.licenses_required || status.has_active_license) {
    return <>{children}</>
  }

  return <LicenseWall status={status} onRefresh={fetch} />
}

// ─────────────────────────────────────────────────────────────
// Muro de licencia
// ─────────────────────────────────────────────────────────────
function LicenseWall({ status, onRefresh }: { status: LicenseStatus; onRefresh: () => void }) {
  const [screen, setScreen] = useState<Screen>('gate')

  if (screen === 'acquire') {
    return <AcquireForm onBack={() => setScreen('gate')} onSent={() => setScreen('sent')} />
  }

  if (screen === 'sent') {
    return <SentConfirmation onRefresh={onRefresh} />
  }

  const license = status.license
  const isExpired = license && !license.is_active

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isExpired ? 'warning-outline' : 'key-outline'}
            size={36}
            color="#fff"
          />
        </View>

        <Text style={styles.title}>
          {isExpired ? 'Tu licencia ha vencido' : 'Licencia requerida'}
        </Text>

        <Text style={styles.subtitle}>
          {isExpired
            ? `Tu licencia venció el ${new Date(license!.expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}. Renuévala para continuar.`
            : 'Para usar AI Companion necesitas una licencia activa. Adquiere la tuya y accede a tu asistente personal.'}
        </Text>

        {status.pending_request && (
          <View style={styles.pendingBox}>
            <Ionicons name="time-outline" size={16} color="#f59e0b" />
            <Text style={styles.pendingText}>
              Tu solicitud está en revisión. Te notificaremos pronto.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setScreen('acquire')}>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>
              {isExpired ? 'Renovar licencia' : 'Adquirir licencia'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={16} color={C.primary} />
            <Text style={styles.btnSecondaryText}>Verificar nuevamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────
// Formulario de adquisición
// ─────────────────────────────────────────────────────────────
function AcquireForm({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const { user } = useAuthStore()
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    company: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa nombre, correo y teléfono.')
      return
    }
    setLoading(true)
    try {
      await api.post('/license/request', { ...form, plan_type: plan })
      onSent()
    } catch {
      Alert.alert('Error', 'No pudimos enviar tu solicitud. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Adquiere tu licencia</Text>
          </View>

          <Text style={styles.formSubtitle}>
            Completa tus datos y te enviamos el catálogo de precios al correo con los botones para pagar por WhatsApp.
          </Text>

          {/* Plan selector */}
          <View style={styles.planRow}>
            {(['monthly', 'yearly'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.planCard, plan === p && styles.planCardActive]}
                onPress={() => setPlan(p)}
              >
                <Text style={[styles.planName, plan === p && styles.planNameActive]}>
                  {p === 'monthly' ? 'Mensual' : 'Anual'}
                </Text>
                <Text style={[styles.planSub, plan === p && styles.planSubActive]}>
                  {p === 'monthly' ? 'Facturación mensual' : 'Mayor ahorro'}
                </Text>
                {p === 'yearly' && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>AHORRO</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <FieldRow label="Nombre completo *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Tu nombre" />
            <FieldRow label="Correo electrónico *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" />
            <FieldRow label="Teléfono / WhatsApp *" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+57 300 000 0000" keyboardType="phone-pad" />
            <FieldRow label="Ciudad" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Bogotá, Medellín..." />
            <FieldRow label="Empresa" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Nombre de tu empresa (opcional)" />
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send-outline" size={18} color="#fff" />
            }
            <Text style={styles.btnPrimaryText}>Enviar y recibir catálogo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function FieldRow({
  label, value, onChange, placeholder, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; keyboardType?: TextInput['props']['keyboardType']; autoCapitalize?: TextInput['props']['autoCapitalize']
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
// Confirmación enviado
// ─────────────────────────────────────────────────────────────
function SentConfirmation({ onRefresh }: { onRefresh: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: '#16a34a' }]}>
          <Ionicons name="checkmark-circle-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>¡Solicitud enviada!</Text>
        <Text style={styles.subtitle}>
          Revisa tu correo. Te enviamos el catálogo con los precios y los botones para adquirir tu licencia por WhatsApp.
        </Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={16} color={C.primary} />
          <Text style={styles.btnSecondaryText}>Verificar si ya tengo licencia</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#451a03',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#92400e',
    width: '100%',
  },
  pendingText: { fontSize: 13, color: '#fbbf24', flex: 1, lineHeight: 19 },
  actions: { width: '100%', gap: 10, marginTop: 8 },
  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: { color: C.primary, fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  // Form
  formScroll: { padding: 20, gap: 16, paddingBottom: 40 },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backBtn: { padding: 4 },
  formTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  formSubtitle: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  planRow: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    position: 'relative',
  },
  planCardActive: { borderColor: C.primary, backgroundColor: `${C.primary}18` },
  planName: { fontSize: 15, fontWeight: '700', color: C.textSecondary },
  planNameActive: { color: C.primary },
  planSub: { fontSize: 12, color: C.textMuted },
  planSubActive: { color: C.textSecondary },
  savingsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#14532d',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  savingsText: { fontSize: 9, fontWeight: '700', color: '#4ade80' },
  fields: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: C.surface2,
    color: C.textPrimary,
  },
})
