import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { C } from '@/lib/theme'
import { useOnboarding } from '@/store/onboarding'

/**
 * Onboarding Welcome Screen
 *
 * Presents Aria and explains the 3 modes of interaction.
 * This is the first screen after signup.
 */
export default function OnboardingWelcome() {
  const router = useRouter()
  const { nextStep, skipOnboarding } = useOnboarding()

  const handleStart = () => {
    nextStep()
    router.push('/onboarding/chat-mode' as never)
  }

  const handleSkip = () => {
    skipOnboarding()
    router.replace('/(app)' as never)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="sparkles" size={56} color={C.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Bienvenido a Aria</Text>
        <Text style={styles.subtitle}>Tu asistente personal de IA</Text>

        {/* Description */}
        <Text style={styles.description}>
          Aria es un asistente inteligente que te ayuda de 3 formas. Aprenderemos cada una juntos.
        </Text>

        {/* 3 Modes Cards */}
        <View style={styles.modesContainer}>
          {/* Mode 1: Chat */}
          <View style={styles.modeCard}>
            <View style={styles.modeIcon}>
              <Ionicons name="chatbubble-outline" size={28} color={C.primary} />
            </View>
            <Text style={styles.modeTitle}>Escribe</Text>
            <Text style={styles.modeDescription}>
              Haz preguntas escribiendo en el chat. Aria responde al instante.
            </Text>
          </View>

          {/* Mode 2: Voice */}
          <View style={styles.modeCard}>
            <View style={styles.modeIcon}>
              <Ionicons name="mic-outline" size={28} color={C.primary} />
            </View>
            <Text style={styles.modeTitle}>Habla</Text>
            <Text style={styles.modeDescription}>
              Di "Hey Aria" o presiona el micrófono. Aria te escucha y responde con voz.
            </Text>
          </View>

          {/* Mode 3: Control */}
          <View style={styles.modeCard}>
            <View style={styles.modeIcon}>
              <Ionicons name="phone-portrait-outline" size={28} color={C.primary} />
            </View>
            <Text style={styles.modeTitle}>Controla</Text>
            <Text style={styles.modeDescription}>
              Pídele que envíe mensajes, haga llamadas, reproduzca música y más.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Empezar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.primary,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },

  modesContainer: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: C.surface2,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  modeDescription: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },

  spacer: { flex: 1, maxHeight: 24 },

  buttons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: C.surface2,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  secondaryBtnText: {
    color: C.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
