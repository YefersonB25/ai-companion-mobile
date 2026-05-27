import { useState } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Text, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'

interface Props {
  onSend: (text: string) => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, isStreaming }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [interimText, setInterimText] = useState('')

  // --- STT events ---
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? ''
    if (event.isFinal) {
      setRecording(false)
      setInterimText('')
      if (transcript.trim()) onSend(transcript.trim())
    } else {
      setInterimText(transcript)
    }
  })

  useSpeechRecognitionEvent('end', () => {
    setRecording(false)
    setInterimText('')
  })

  useSpeechRecognitionEvent('error', () => {
    setRecording(false)
    setInterimText('')
  })

  // --- Handlers ---
  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
  }

  const toggleRecording = async () => {
    if (recording) {
      ExpoSpeechRecognitionModule.abort()
      setRecording(false)
      setInterimText('')
      return
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) return
    setText('')
    setRecording(true)
    ExpoSpeechRecognitionModule.start({ lang: 'es-ES', interimResults: true, continuous: false })
  }

  const displayText = recording ? interimText : text
  const placeholder = recording ? 'Escuchando...' : 'Escribe o habla...'

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={[styles.inputRow, recording && styles.inputRowRecording]}>
          {/* Mic button */}
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={toggleRecording}
            disabled={isStreaming}
            activeOpacity={0.75}
          >
            {recording
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.micIcon}>🎙️</Text>
            }
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={displayText}
            onChangeText={recording ? undefined : setText}
            placeholder={placeholder}
            placeholderTextColor={recording ? '#6366f1' : '#94a3b8'}
            multiline
            maxLength={4000}
            editable={!isStreaming && !recording}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          {/* Send button — hidden while recording */}
          {!recording && (
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || isStreaming) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || isStreaming}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>{isStreaming ? '⏸' : '➤'}</Text>
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
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  inputRowRecording: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 120,
    paddingVertical: 4,
  },
  micBtn: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  micBtnActive: {
    backgroundColor: '#6366f1',
  },
  micIcon: { fontSize: 16 },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
  sendIcon: { color: '#fff', fontSize: 16 },
})
