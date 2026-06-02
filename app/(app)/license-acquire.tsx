import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useLicenseStore } from '@/store/license'
import api from '@/lib/api'
import { C } from '@/lib/theme'

export default function LicenseAcquireScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { fetch: refreshLicense } = useLicenseStore()

  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    company: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa nombre, correo y teléfono.')
      return
    }
    setLoading(true)
    try {
      await api.post('/license/request', { ...form, plan_type: plan })
      await refreshLicense()
      setSent(true)
    } catch {
      Alert.alert('Error', 'No pudimos enviar tu solicitud. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconWrap, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#fff" />
          </View>
          <Text style={styles.sentTitle}>¡Solicitud enviada!</Text>
          <Text style={styles.sentSubtitle}>
            Revisa tu correo <Text style={{ color: C.primary }}>{form.email}</Text>.
            Te enviamos el catálogo con los precios y botones para adquirir tu licencia por WhatsApp.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(app)/license' as never)}>
            <Text style={styles.btnText}>Ver estado de mi licencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()}>
            <Text style={styles.btnGhostText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Adquirir licencia</Text>
          </View>

          <Text style={styles.subtitle}>
            Elige tu plan y completa tus datos. Te enviaremos el catálogo de precios al correo con los botones de pago por WhatsApp.
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
                  {p === 'monthly' ? 'Facturación mensual' : 'Mayor ahorro anual'}
                </Text>
                {p === 'yearly' && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>AHORRO</Text>
                  </View>
                )}
                {plan === p && (
                  <View style={styles.planCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Field label="Nombre completo *" value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Tu nombre completo" />
            <Field label="Correo electrónico *" value={form.email}
              onChange={v => setForm(f => ({ ...f, email: v }))}
              placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="Teléfono / WhatsApp *" value={form.phone}
              onChange={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="+57 300 000 0000" keyboardType="phone-pad" />
            <Field label="Ciudad" value={form.city}
              onChange={v => setForm(f => ({ ...f, city: v }))}
              placeholder="Bogotá, Medellín..." />
            <Field label="Empresa / Organización" value={form.company}
              onChange={v => setForm(f => ({ ...f, company: v }))}
              placeholder="Nombre de tu empresa (opcional)" />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send-outline" size={18} color="#fff" />
            }
            <Text style={styles.btnText}>Enviar y recibir catálogo</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Recibirás el catálogo de precios con los botones para pagar por WhatsApp.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize }: {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 16,
  },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn:   { padding: 4 },
  title:     { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  subtitle:  { fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  planRow: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, padding: 14, gap: 4, position: 'relative',
  },
  planCardActive: { borderColor: C.primary, backgroundColor: `${C.primary}18` },
  planName:     { fontSize: 15, fontWeight: '700', color: C.textSecondary },
  planNameActive: { color: C.primary },
  planSub:      { fontSize: 11, color: C.textMuted },
  planSubActive: { color: C.textSecondary },
  planCheck:    { position: 'absolute', top: 8, right: 8 },
  savingsBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: '#14532d', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  savingsText: { fontSize: 9, fontWeight: '700', color: '#4ade80' },

  fields: { gap: 14 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  fieldInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, backgroundColor: C.surface2, color: C.textPrimary,
  },

  btn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnGhost: { paddingVertical: 12, alignItems: 'center' },
  btnGhostText: { color: C.textSecondary, fontSize: 14 },
  hint: { fontSize: 12, color: C.textMuted, textAlign: 'center' },

  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  sentTitle:    { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  sentSubtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
})
