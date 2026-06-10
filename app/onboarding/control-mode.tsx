import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { C } from '@/lib/theme'
import { useOnboarding } from '@/store/onboarding'

/**
 * Onboarding Control Mode Screen
 *
 * Shows device automation capabilities.
 * Examples: SMS, calls, music, apps, reminders, flashlight, etc.
 */
export default function OnboardingControlMode() {
  const router = useRouter()
  const { nextStep, markControlModeTried } = useOnboarding()

  const actions = [
    { icon: 'chatbubble-outline', text: 'Enviar mensajes SMS y WhatsApp' },
    { icon: 'call-outline', text: 'Hacer y recibir llamadas' },
    { icon: 'musical-notes-outline', text: 'Reproducir música en Spotify o YouTube' },
    { icon: 'apps-outline', text: 'Abrir cualquier app instalada' },
    { icon: 'alarm-outline', text: 'Crear recordatorios y eventos' },
    { icon: 'flashlight-outline', text: 'Controlar linterna y brillo' },
    { icon: 'volume-high-outline', text: 'Ajustar volumen y brillo' },
    { icon: 'phone-portrait-outline', text: 'Bloquear y encender pantalla' },
  ]

  const handleDone = () => {
    markControlModeTried()
    nextStep()
    const { setCompleted } = useOnboarding.getState()
    setCompleted(true)
    router.replace('/(app)' as never)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            const { skipOnboarding } = useOnboarding.getState()
            skipOnboarding()
            router.replace('/(app)' as never)
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Control de Dispositivo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.dot, { backgroundColor: C.border }]} />
          <View style={[styles.dot, { backgroundColor: C.border }]} />
          <View style={[styles.dot, { backgroundColor: C.primary }]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Controla tu teléfono</Text>
        <Text style={styles.description}>
          Pídele a Aria que haga cosas por ti. Aquí hay algunos ejemplos:
        </Text>

        {/* Actions Grid */}
        <View style={styles.actionsGrid}>
          {actions.map((action, idx) => (
            <View key={idx} style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={24} color={C.primary} />
              </View>
              <Text style={styles.actionText}>{action.text}</Text>
            </View>
          ))}
        </View>

        {/* Examples section */}
        <View style={styles.examplesBox}>
          <Text style={styles.examplesTitle}>💬 Ejemplos de comandos:</Text>
          <View style={styles.examplesList}>
            <Text style={styles.exampleItem}>
              • "Envía un mensaje a María diciendo hola"
            </Text>
            <Text style={styles.exampleItem}>
              • "Reproduce Bad Bunny en Spotify"
            </Text>
            <Text style={styles.exampleItem}>
              • "Llama a mamá"
            </Text>
            <Text style={styles.exampleItem}>
              • "Abre WhatsApp"
            </Text>
            <Text style={styles.exampleItem}>
              • "Enciende la linterna"
            </Text>
            <Text style={styles.exampleItem}>
              • "Crea un recordatorio para mañana a las 3pm"
            </Text>
          </View>
        </View>

        {/* Key note */}
        <View style={styles.noteBox}>
          <Ionicons name="bulb-outline" size={20} color={C.primary} />
          <Text style={styles.noteText}>
            Aria está siempre aprendiendo. Cuanto más la uses, mejor entiende lo que quieres.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Done button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>¡Listo! Voy a empezar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },

  actionsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: C.surface2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: C.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  examplesBox: {
    backgroundColor: C.primaryMuted,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.primary,
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
  },
  examplesList: {
    gap: 8,
  },
  exampleItem: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
  },

  noteBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.surface2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
    flex: 1,
  },

  spacer: { flex: 1, minHeight: 16 },

  doneBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
