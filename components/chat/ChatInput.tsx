import { useState, useRef } from 'react'
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Text, Platform, KeyboardAvoidingView,
} from 'react-native'

interface Props {
  onSend: (text: string) => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, isStreaming }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={4000}
            editable={!isStreaming}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isStreaming}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>{isStreaming ? '⏸' : '➤'}</Text>
          </TouchableOpacity>
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
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 120,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
  sendIcon: { color: '#fff', fontSize: 16 },
})
