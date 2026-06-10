import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { C } from '@/lib/theme'
import { useOnboarding } from '@/store/onboarding'

/**
 * Onboarding Chat Mode Screen
 *
 * Teaches how to use text-based chat with Aria.
 * Shows example message and allows user to try.
 */
export default function OnboardingChatMode() {
  const router = useRouter()
  const { nextStep, markChatModeTried } = useOnboarding()
  const [message, setMessage] = useState('')
  const [showExample, setShowExample] = useState(true)

  const handleTry = () => {
    markChatModeTried()
    nextStep()
    router.push('/onboarding/voice-mode' as never)
  }

  const handleSendExample = () => {
    setShowExample(false)
    setTimeout(() => {
      setShowExample(true)
    }, 2000)
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
        <Text style={styles.headerTitle}>Modo Escritura</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.dot, { backgroundColor: C.primary }]} />
          <View style={[styles.dot, { backgroundColor: C.border }]} />
          <View style={[styles.dot, { backgroundColor: C.border }]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Escribe tu pregunta</Text>
        <Text style={styles.description}>
          Haz cualquier pregunta escribiendo en el chat. Aria responderá al instante.
        </Text>

        {/* Chat preview */}
        <View style={styles.chatPreview}>
          {/* User message example */}
          <View style={styles.messageBubble}>
            <Text style={styles.userMessageText}>¿Cuál es el mejor café?</Text>
          </View>

          {/* Aria response */}
          {showExample && (
            <View style={[styles.messageBubble, styles.ariaBubble]}>
              <Text style={styles.ariaMessageText}>
                Depende de tus preferencias, pero algunos estilos populares son:
                {'\n\n'}
                • Espresso: intenso y concentrado
                • Americano: suave y largo
                • Cappuccino: cremoso y balanceado
                {'\n\n'}
                ¿Cuál prefieres?
              </Text>
            </View>
          )}
        </View>

        {/* Try box */}
        <View style={styles.tryBox}>
          <Text style={styles.tryTitle}>Ahora probá vos:</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor={C.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={handleSendExample}
              disabled={!message.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={message.trim() ? '#fff' : C.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            💡 Aria entiende preguntas complejas, puede ayudarte con decisiones, escribir textos, investigar y más.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Continue button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleTry}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Continuar</Text>
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

  chatPreview: {
    backgroundColor: C.surface2,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  messageBubble: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  ariaBubble: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  ariaMessageText: {
    color: C.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },

  tryBox: {
    backgroundColor: C.primaryMuted,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.primary,
    gap: 12,
    marginBottom: 24,
  },
  tryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  input: {
    flex: 1,
    maxHeight: 80,
    fontSize: 13,
    color: C.textPrimary,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: C.border,
  },
  hint: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
  },

  spacer: { flex: 1, minHeight: 16 },

  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
