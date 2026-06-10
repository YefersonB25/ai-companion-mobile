import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { C } from '@/lib/theme'
import { useOnboarding } from '@/store/onboarding'
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition'
import * as Haptics from 'expo-haptics'
import AnimatedWaveform from '@/components/ui/AnimatedWaveform'

/**
 * Onboarding Voice Mode Screen
 *
 * Teaches how to use voice with Aria.
 * Shows wake word info and lets user try both:
 * 1. "Hey Aria" wake word
 * 2. Press mic button for STT
 */
export default function OnboardingVoiceMode() {
  const router = useRouter()
  const { nextStep, markVoiceModeTried } = useOnboarding()
  const [recording, setRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [showWakeWordInfo, setShowWakeWordInfo] = useState(true)
  const [completed, setCompleted] = useState(false)

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? ''
    if (event.isFinal) {
      ExpoSpeechRecognitionModule.abort()
      setRecording(false)
      setInterimText('')
      if (transcript.trim()) {
        markVoiceModeTried()
        setCompleted(true)
      }
    } else {
      setInterimText(transcript)
    }
  })

  useSpeechRecognitionEvent('end', () => {
    setRecording(false)
    setInterimText('')
  })

  const startRecording = async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) return

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowWakeWordInfo(false)
    setRecording(true)
    ExpoSpeechRecognitionModule.start({
      lang: 'es-ES',
      interimResults: true,
      continuous: true,
    })
  }

  const stopRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ExpoSpeechRecognitionModule.abort()
    setRecording(false)
    setInterimText('')
  }

  const handleContinue = () => {
    nextStep()
    router.push('/onboarding/control-mode' as never)
  }

  const handleSkip = () => {
    markVoiceModeTried()
    nextStep()
    router.push('/onboarding/control-mode' as never)
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
        <Text style={styles.headerTitle}>Modo Voz</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.dot, { backgroundColor: C.border }]} />
          <View style={[styles.dot, { backgroundColor: C.primary }]} />
          <View style={[styles.dot, { backgroundColor: C.border }]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Habla con Aria</Text>
        <Text style={styles.description}>
          Aria te escucha de 2 formas: por el wake word o presionando el micrófono.
        </Text>

        {/* Wake word info */}
        {showWakeWordInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color={C.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Palabras de activación:</Text>
              <Text style={styles.infoText}>
                "Hey Aria" • "Oye Aria" • "Hola Aria"
              </Text>
              <Text style={styles.infoSubtext}>
                Puedes decir la frase en cualquier momento del día. Aria estará escuchando en background.
              </Text>
            </View>
          </View>
        )}

        {/* Microphone button area */}
        <View style={styles.micArea}>
          {!recording && !completed && (
            <>
              <Text style={styles.instruction}>
                {showWakeWordInfo
                  ? '👇 O presiona el micrófono para hablar:'
                  : 'Habla ahora...'}
              </Text>

              <TouchableOpacity
                style={[styles.micButton, recording && styles.micButtonActive]}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={40} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {recording && (
            <>
              <View style={styles.waveformContainer}>
                <AnimatedWaveform isRecording={recording} variant="compact" />
              </View>
              <Text style={styles.recordingText}>
                {interimText || 'Escuchando...'}
              </Text>
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={stopRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {completed && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={56} color={C.green} />
              <Text style={styles.successTitle}>¡Lo entendiste!</Text>
              <Text style={styles.successText}>
                Aria capturó tu mensaje y está listo para responder.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttons}>
          {!completed && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Saltar esta lección</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
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
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: C.primaryMuted,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.primary,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoSubtext: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
  },

  micArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 20,
  },

  instruction: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
  },

  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.primaryDark,
  },
  micButtonActive: {
    backgroundColor: C.primaryDark,
  },

  waveformContainer: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordingText: {
    fontSize: 14,
    color: C.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '90%',
  },

  stopBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successBox: {
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  successText: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
  },

  spacer: { flex: 1, minHeight: 20 },

  buttons: {
    gap: 12,
    marginBottom: 20,
  },
  skipBtn: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  skipBtnText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
