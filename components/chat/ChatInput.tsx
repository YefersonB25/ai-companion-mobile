import { useState, useEffect, useRef } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, KeyboardAvoidingView, ActivityIndicator,
  Image, Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { C } from '@/lib/theme'
import { useVoiceTrigger } from '@/store/voiceTrigger'

interface Props {
  onSend: (text: string, opts?: { viaVoice?: boolean; imageUri?: string | null }) => void
  isStreaming: boolean
  isSpeaking?: boolean
}

export default function ChatInput({ onSend, isStreaming, isSpeaking = false }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)

  // Animated pulse for "Aria is speaking"
  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (isSpeaking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isSpeaking, pulseAnim])

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? ''
    if (event.isFinal) {
      ExpoSpeechRecognitionModule.abort()
      setRecording(false)
      setInterimText('')
      if (transcript.trim()) onSend(transcript.trim(), { viaVoice: true })
    } else {
      setInterimText(transcript)
    }
  })

  useSpeechRecognitionEvent('end', () => { setRecording(false); setInterimText('') })
  useSpeechRecognitionEvent('error', () => { setRecording(false); setInterimText('') })

  const handleSend = () => {
    const trimmed = text.trim()
    if ((!trimmed && !pendingImage) || isStreaming) return
    onSend(trimmed, { imageUri: pendingImage })
    setText('')
    setPendingImage(null)
  }

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    })
    if (!result.canceled && result.assets.length > 0) {
      setPendingImage(result.assets[0].uri)
    }
  }

  const startRecording = async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) return
    setText('')
    setRecording(true)
    ExpoSpeechRecognitionModule.start({ lang: 'es-ES', interimResults: true, continuous: true })
  }

  const toggleRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (recording) {
      ExpoSpeechRecognitionModule.abort()
      setRecording(false)
      setInterimText('')
      return
    }
    await startRecording()
  }

  // Auto-start dictation when launched via deep link (ai-companion://voice) or shortcut
  const voicePending = useVoiceTrigger((s) => s.pending)
  const clearVoiceTrigger = useVoiceTrigger((s) => s.clear)
  useEffect(() => {
    if (voicePending && !recording && !isStreaming) {
      clearVoiceTrigger()
      // Small delay so screen mounts fully before mic activates
      setTimeout(startRecording, 350)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePending, isStreaming])

  const displayText  = recording ? interimText : text
  const placeholder  = recording ? 'Escuchando...' : 'Escribe o habla...'
  const canSend      = !recording && (!!text.trim() || !!pendingImage) && !isStreaming

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Pending image preview */}
        {pendingImage && (
          <View style={styles.imagePreviewRow}>
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: pendingImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageClearBtn}
                onPress={() => setPendingImage(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.row, recording && styles.rowRecording]}>
          {/* Image picker button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={pickImage}
            disabled={isStreaming || recording}
            activeOpacity={0.75}
          >
            <Ionicons name="image-outline" size={18} color={C.textSecondary} />
          </TouchableOpacity>

          {/* Mic */}
          <Animated.View style={isSpeaking ? { transform: [{ scale: pulseAnim }] } : undefined}>
            <TouchableOpacity
              style={[styles.micBtn, recording && styles.micBtnActive, isSpeaking && styles.micBtnSpeaking]}
              onPress={toggleRecording}
              disabled={isStreaming}
              activeOpacity={0.75}
            >
              {recording
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="mic-outline" size={18} color={recording ? '#fff' : isSpeaking ? C.primary : C.textSecondary} />
              }
            </TouchableOpacity>
          </Animated.View>

          <TextInput
            style={styles.input}
            value={displayText}
            onChangeText={recording ? undefined : setText}
            placeholder={placeholder}
            placeholderTextColor={recording ? C.primary : C.textSecondary}
            multiline
            maxLength={4000}
            editable={!isStreaming && !recording}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          {/* Send / Streaming indicator */}
          {!recording && (
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {isStreaming
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="arrow-up" size={18} color="#fff" />
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  imagePreviewWrap: {
    position: 'relative',
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  imageClearBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: C.surface2,
    borderRadius: 18, borderWidth: 1.5, borderColor: C.border,
    paddingLeft: 6, paddingRight: 6, paddingVertical: 6,
  },
  rowRecording: {
    borderColor: C.primary,
    backgroundColor: C.primaryMuted,
  },
  input: {
    flex: 1, fontSize: 15, color: C.textPrimary,
    maxHeight: 120, paddingVertical: 4, paddingHorizontal: 4,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: C.primary },
  micBtnSpeaking: { backgroundColor: C.primaryMuted, borderWidth: 1.5, borderColor: C.primary },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.primaryMuted },
})
