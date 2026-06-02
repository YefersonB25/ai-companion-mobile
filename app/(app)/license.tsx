import { useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useLicenseStore } from '@/store/license'
import { useAuthStore } from '@/store/auth'
import { C } from '@/lib/theme'

export default function LicenseScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { status, loading, fetch } = useLicenseStore()

  useEffect(() => {
    if (user) fetch()
  }, [user, fetch])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  const license = status?.license
  const isActive = license?.is_active
  const isExpired = license && !license.is_active && license.status !== 'revoked'
  const typeLabel = { monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizada' }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mi Licencia</Text>
          <TouchableOpacity onPress={fetch} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* License card */}
        {license ? (
          <View style={[styles.card, isActive ? styles.cardActive : styles.cardExpired]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'warning'}
                  size={20}
                  color={isActive ? C.green : '#f59e0b'}
                />
                <Text style={styles.cardTitle}>
                  Plan {typeLabel[license.type] ?? license.type}
                </Text>
              </View>
              <View style={[styles.badge, isActive ? styles.badgeActive : isExpired ? styles.badgeExpired : styles.badgeRevoked]}>
                <Text style={styles.badgeText}>
                  {isActive ? 'Activa' : license.status === 'revoked' ? 'Revocada' : 'Vencida'}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <InfoCell label="Clave" value={license.key} mono />
              <InfoCell
                label="Inicio"
                value={new Date(license.starts_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              />
              <InfoCell
                label="Vencimiento"
                value={new Date(license.expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                warn={!!isExpired}
              />
              {isActive && (
                <InfoCell
                  label="Días restantes"
                  value={`${license.days_remaining} días`}
                  highlight
                />
              )}
            </View>

            {!isActive && (
              <TouchableOpacity
                style={styles.renewBtn}
                onPress={() => router.push('/(app)/license-acquire' as never)}
              >
                <Ionicons name="sparkles-outline" size={16} color="#fff" />
                <Text style={styles.renewBtnText}>Renovar licencia</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="key-outline" size={36} color={C.textMuted} />
            <Text style={styles.emptyTitle}>Sin licencia registrada</Text>
            <Text style={styles.emptySubtitle}>
              {status?.licenses_required
                ? 'Necesitas una licencia para usar la app.'
                : 'La app está en modo abierto por ahora.'}
            </Text>
          </View>
        )}

        {/* Pending request */}
        {status?.pending_request && (
          <View style={styles.pendingBox}>
            <Ionicons name="time-outline" size={16} color="#f59e0b" />
            <Text style={styles.pendingText}>
              Solicitud de licencia {status.pending_request.plan_type === 'monthly' ? 'mensual' : 'anual'} en revisión.
              Enviada el {new Date(status.pending_request.created_at).toLocaleDateString('es-CO')}.
            </Text>
          </View>
        )}

        {/* CTA */}
        {!status?.pending_request && !isActive && (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(app)/license-acquire' as never)}
          >
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>Adquirir licencia</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

function InfoCell({ label, value, mono, warn, highlight }: {
  label: string; value: string; mono?: boolean; warn?: boolean; highlight?: boolean
}) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={[
        styles.cellValue,
        mono && styles.cellMono,
        warn && styles.cellWarn,
        highlight && styles.cellHighlight,
      ]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { padding: 20, gap: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backBtn:    { padding: 4 },
  refreshBtn: { padding: 4, marginLeft: 'auto' },
  title:      { fontSize: 20, fontWeight: '700', color: C.textPrimary, flex: 1 },

  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 16,
  },
  cardActive:  { borderColor: C.green,    backgroundColor: '#14532d18' },
  cardExpired: { borderColor: '#92400e',  backgroundColor: '#451a0318' },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: C.textPrimary },

  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeActive:  { backgroundColor: '#14532d' },
  badgeExpired: { backgroundColor: '#451a03' },
  badgeRevoked: { backgroundColor: '#3b0764' },
  badgeText:    { fontSize: 11, fontWeight: '700', color: '#fff' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { minWidth: '45%', flex: 1, gap: 3 },
  cellLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cellValue: { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  cellMono:  { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
  cellWarn:  { color: '#f59e0b', fontWeight: '600' },
  cellHighlight: { color: C.green, fontWeight: '700' },

  renewBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  renewBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyCard: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle:    { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center' },

  pendingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#451a03',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  pendingText: { fontSize: 13, color: '#fbbf24', flex: 1, lineHeight: 19 },

  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})

