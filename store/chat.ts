/**
 * Mobile Chat Store
 *
 * Re-exports from @aria/core — shared across web and mobile.
 * Initialization happens in app/_layout.tsx with mobile-specific config (TTS, phone actions).
 */

export { useChatStore, initializeChatStore } from '@aria/core'
export type { ChatState, ChatStoreConfig } from '@aria/core'

/**
 * Mobile-specific: Add TTS extension on top of shared chat store.
 *
 * Usage in components:
 *   const { messages } = useChatStore()
 *   const { ttsEnabled, setTtsEnabled, stopSpeaking } = useChatTtsExtension()
 */

import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '@aria/core'
import * as Speech from 'expo-speech'
import { textForTts } from '@/lib/textForTts'

export function useChatTtsExtension() {
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const prevMessagesRef = useRef<any[]>([])

  const { messages, isStreaming } = useChatStore()

  // Speak last assistant message when streaming finishes
  useEffect(() => {
    if (!ttsEnabled || isStreaming) return

    const lastMsg = messages[messages.length - 1]
    const prevLastMsg = prevMessagesRef.current[prevMessagesRef.current.length - 1]

    // If assistant message changed and we just finished streaming
    if (
      lastMsg?.role === 'assistant' &&
      lastMsg?.id !== prevLastMsg?.id &&
      lastMsg?.content
    ) {
      const spoken = textForTts(lastMsg.content)
      if (spoken) {
        Speech.stop()
        setIsSpeaking(true)
        Speech.speak(spoken, {
          language: 'es-ES',
          rate: 0.95,
          pitch: 1.0,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        })
      }
    }

    prevMessagesRef.current = messages
  }, [messages, isStreaming, ttsEnabled])

  return {
    ttsEnabled,
    setTtsEnabled,
    isSpeaking,
    stopSpeaking: () => {
      Speech.stop()
      setIsSpeaking(false)
    },
  }
}
