import { useState, useEffect } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { C } from '@/lib/theme'
import { useVoiceTrigger } from '@/store/voiceTrigger'

interface Props {
  onSend: (text: string, opts?: { viaVoice?: boolean }) => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, isStreaming }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [interimText, setInterimText] = useState('')

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? ''
    if (event.isFinal) {
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
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
  }

  const startRecording = async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) return
    setText('')
    setRecording(true)
    ExpoSpeechRecognitionModule.start({ lang: 'es-ES', interimResults: true, continuous: false })
  }

  const toggleRecording = async () => {
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
  const canSend      = !recording && !!text.trim() && !isStreaming

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        <View style={[styles.row, recording && styles.rowRecording]}>
          {/* Mic */}
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={toggleRecording}
            disabled={isStreaming}
            activeOpacity={0.75}
          >
            {recording
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="mic-outline" size={18} color={recording ? '#fff' : C.textSecondary} />
            }
          </TouchableOpacity>

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
  micBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: C.primary },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.primaryMuted },
})
