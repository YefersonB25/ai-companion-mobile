import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Text, Modal, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C } from '@/lib/theme'
import AnimatedWaveform from './AnimatedWaveform'

interface Props {
  visible: boolean
  interimText?: string
  recordingDuration?: number
  onCancel?: () => void
}

/**
 * Full-screen overlay for voice listening state.
 * Shown when user triggers Aria via wake word or voice shortcut.
 *
 * Displays:
 * - Large animated waveform
 * - Real-time transcript
 * - Recording timer
 * - Cancel button
 */
export default function VoiceListeningOverlay({
  visible,
  interimText = '',
  recordingDuration = 0,
  onCancel,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, fadeAnim])

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Background blur effect (visual only) */}
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Aria está escuchando</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Waveform */}
          <View style={styles.waveformContainer}>
            <AnimatedWaveform
              isRecording={visible}
              recordingDuration={recordingDuration}
              interimText={interimText}
              variant="expanded"
            />
          </View>

          {/* Hint text */}
          {!interimText && (
            <Text style={styles.hintText}>
              Habla ahora o presiona para detener
            </Text>
          )}

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
  },
  content: {
    width: '85%',
    borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  waveformContainer: {
    width: '100%',
    marginVertical: 20,
  },
  hintText: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
