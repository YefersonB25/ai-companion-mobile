import { create } from 'zustand'
import { Conversation, Message } from '@/types'
import api, { getStreamUrl } from '@/lib/api'
import * as SecureStore from 'expo-secure-store'
import * as Speech from 'expo-speech'
import { parseActions, executeAction } from '@/lib/phoneActions'
import { textForTts } from '@/lib/textForTts'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  isStreaming: boolean
  ttsEnabled: boolean
  loadConversations: () => Promise<void>
  createConversation: () => Promise<Conversation>
  selectConversation: (id: number) => Promise<void>
  deleteConversation: (id: number) => Promise<void>
  sendMessage: (content: string, opts?: { viaVoice?: boolean }) => Promise<void>
  appendChunk: (chunk: string) => void
  addAssistantMessage: (content: string) => Promise<void>
  setTtsEnabled: (v: boolean) => void
  stopSpeaking: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,
  ttsEnabled: true,

  loadConversations: async () => {
    const { data } = await api.get('/conversations')
    set({ conversations: data.data ?? data })
  },

  createConversation: async () => {
    const { data } = await api.post('/conversations', { channel: 'mobile' })
    set((s) => ({
      conversations: [data, ...s.conversations],
      activeConversation: data,
      messages: [],
    }))
    return data
  },

  selectConversation: async (id) => {
    const { data } = await api.get(`/conversations/${id}`)
    set({ activeConversation: data, messages: data.messages ?? [] })
  },

  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`)
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversation: s.activeConversation?.id === id ? null : s.activeConversation,
      messages: s.activeConversation?.id === id ? [] : s.messages,
    }))
  },

  sendMessage: async (content, opts) => {
    let conv = get().activeConversation
    if (!conv) conv = await get().createConversation()

    const now = Date.now()
    const userMsg: Message = {
      id: now,
      conversation_id: conv.id,
      role: 'user',
      content,
      provider: null,
      model: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: null,
      created_at: new Date().toISOString(),
    }

    const aiMsg: Message = {
      id: now + 1,
      conversation_id: conv.id,
      role: 'assistant',
      content: '',
      provider: null,
      model: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: null,
      created_at: new Date().toISOString(),
    }

    set((s) => ({ messages: [...s.messages, userMsg, aiMsg], isStreaming: true }))

    const token = await SecureStore.getItemAsync('token')
    const url = getStreamUrl(`/conversations/${conv.id}/messages`)

    let fullResponse = ''

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, stream: true }),
      })

      if (!res.ok) {
        let msg = `Error ${res.status}`
        let errorCode = ''
        try {
          const body = await res.json()
          errorCode = body.error ?? ''
          msg = body.message ?? msg
        } catch {}

        if (errorCode === 'no_provider') {
          get().appendChunk(
            '⚙️ **Sin proveedor de IA configurado**\n\n' +
            'Para que Aria pueda responderte necesitas agregar una API key.\n\n' +
            'Ve a **Ajustes → Proveedores IA** y agrega tu clave de Gemini (gratis), OpenAI, Claude u otro.'
          )
        } else if (errorCode === 'license_required') {
          get().appendChunk('🔒 Necesitas una licencia activa para continuar usando AI Companion.')
        } else {
          get().appendChunk(`⚠️ ${msg}`)
        }
        return
      }

      const ctype = res.headers.get('content-type') ?? ''

      // Non-streaming JSON response (when backend uses tool agent loop)
      if (ctype.includes('application/json')) {
        const data = await res.json()
        const text = data.content ?? data.message ?? ''
        if (text) {
          get().appendChunk(text)
          fullResponse = text
        }
      } else {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value)
            for (const line of text.split('\n')) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.slice(6))
                  if (json.chunk) {
                    get().appendChunk(json.chunk)
                    fullResponse += json.chunk
                  }
                  if (json.error) get().appendChunk(`⚠️ ${json.error}`)
                } catch {}
              }
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de red'
      get().appendChunk(`⚠️ ${msg}`)
    } finally {
      set({ isStreaming: false })
    }

    // After response is complete: parse phone actions and speak the clean text
    if (fullResponse) {
      const { cleanText, actions } = parseActions(fullResponse)

      // Replace the message content with the cleaned (action-free) version
      if (actions.length > 0 && cleanText !== fullResponse) {
        set((s) => {
          const msgs = [...s.messages]
          const last = msgs[msgs.length - 1]
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: cleanText }
          }
          return { messages: msgs }
        })
      }

      // TTS: only if the user sent the message via voice
      if (opts?.viaVoice && get().ttsEnabled && cleanText) {
        const spoken = textForTts(cleanText)
        if (spoken) Speech.speak(spoken, { language: 'es-ES', rate: 1.0, pitch: 1.0 })
      }

      // Execute phone actions sequentially
      for (const action of actions) {
        try {
          await executeAction(action)
        } catch (e) {
          console.warn('phone action failed', e)
        }
      }
    }

    await get().loadConversations()
  },

  appendChunk: (chunk) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
      }
      return { messages: msgs }
    }),

  /**
   * Insert a standalone assistant message into the current conversation (no
   * backend round-trip). Used to surface the daily briefing in the chat when
   * the user taps the briefing notification.
   */
  addAssistantMessage: async (content) => {
    let conv = get().activeConversation
    if (!conv) conv = await get().createConversation()
    const now = Date.now()
    const msg: Message = {
      id: now,
      conversation_id: conv.id,
      role: 'assistant',
      content,
      provider: null,
      model: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: null,
      created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, msg] }))
  },

  setTtsEnabled: (v) => set({ ttsEnabled: v }),

  stopSpeaking: () => Speech.stop(),
}))
